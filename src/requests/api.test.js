import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import {
  createRequest,
  deleteRequest,
  withdrawRequest,
  getMyRequests,
} from './api';

jest.mock('@edx/frontend-platform/auth', () => ({
  getAuthenticatedHttpClient: jest.fn(),
}));
jest.mock('@edx/frontend-platform', () => ({
  getConfig: jest.fn().mockReturnValue({ LMS_BASE_URL: 'http://localhost:18000' }),
}));

const mockClient = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

beforeAll(() => {
  getAuthenticatedHttpClient.mockReturnValue(mockClient);
});

beforeEach(() => jest.clearAllMocks());

// ─── createRequest ────────────────────────────────────────────────────────────

describe('createRequest', () => {
  it('posts to leave endpoint for leave type', async () => {
    mockClient.post.mockResolvedValue({ data: { id: 1 } });
    await createRequest({
      type: 'leave',
      reason: 'sick',
      program_key: 'prog1',
      leave_start_date: '2026-06-01',
      leave_end_date: '2026-06-01',
    });
    expect(mockClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/requests/leave/'),
      expect.any(FormData),
    );
  });

  it('posts to remote-session endpoint for remote_session type', async () => {
    mockClient.post.mockResolvedValue({ data: { id: 2 } });
    await createRequest({
      type: 'remote_session',
      reason: 'working remotely',
      program_key: 'prog1',
      session_ids: ['abc'],
    });
    expect(mockClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/requests/remote-session/'),
      expect.any(FormData),
    );
  });

  it('returns response data', async () => {
    mockClient.post.mockResolvedValue({ data: { id: 99 } });
    const result = await createRequest({ type: 'leave', reason: 'r', program_key: 'p' });
    expect(result).toEqual({ id: 99 });
  });

  it('appends ?override=true to URL when override param is true', async () => {
    mockClient.post.mockResolvedValue({ data: { id: 1 } });
    await createRequest({
      type: 'leave', reason: 'sick', program_key: 'prog1', override: true,
    });
    const [url] = mockClient.post.mock.calls[0];
    expect(url).toContain('?override=true');
  });

  it('does NOT append ?override=true when override is false', async () => {
    mockClient.post.mockResolvedValue({ data: { id: 1 } });
    await createRequest({ type: 'leave', reason: 'sick', program_key: 'prog1' });
    const [url] = mockClient.post.mock.calls[0];
    expect(url).not.toContain('?override=true');
  });
});

// ─── deleteRequest ────────────────────────────────────────────────────────────

describe('deleteRequest', () => {
  it('deletes from the leave endpoint', async () => {
    mockClient.delete.mockResolvedValue({});
    await deleteRequest('123', 'leave');
    expect(mockClient.delete).toHaveBeenCalledWith(
      expect.stringContaining('/requests/leave/123/'),
    );
  });

  it('deletes from the remote-session endpoint', async () => {
    mockClient.delete.mockResolvedValue({});
    await deleteRequest('456', 'remote_session');
    expect(mockClient.delete).toHaveBeenCalledWith(
      expect.stringContaining('/requests/remote-session/456/'),
    );
  });
});

// ─── withdrawRequest ─────────────────────────────────────────────────────────

describe('withdrawRequest', () => {
  it('posts to the leave withdraw endpoint', async () => {
    mockClient.post.mockResolvedValue({ data: { id: 1, state: 'WITHDRAWAL_PENDING' } });
    await withdrawRequest('123');
    expect(mockClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/requests/leave/123/withdraw/'),
    );
  });

  it('returns updated request data', async () => {
    mockClient.post.mockResolvedValue({ data: { id: 1, state: 'WITHDRAWAL_PENDING' } });
    const result = await withdrawRequest('1');
    expect(result).toEqual({ id: 1, state: 'WITHDRAWAL_PENDING' });
  });
});

// ─── getMyRequests (single-type fetch) ───────────────────────────────────────

describe('getMyRequests', () => {
  it('calls only the endpoint for the given type', async () => {
    mockClient.get.mockResolvedValue({ data: { results: [], count: 0 } });
    await getMyRequests({ type: 'leave' });
    expect(mockClient.get).toHaveBeenCalledTimes(1);
    expect(mockClient.get).toHaveBeenCalledWith(expect.stringContaining('/requests/leave/'));
  });

  it('returns the server envelope untouched, so count is the server total', async () => {
    mockClient.get.mockResolvedValue({ data: { count: 300, results: [{ id: 1 }] } });
    const result = await getMyRequests({ type: 'leave', page: 1, page_size: 25 });
    expect(result.count).toBe(300);
    expect(result.results).toEqual([{ id: 1 }]);
  });

  it('forwards paging and filters to the server', async () => {
    mockClient.get.mockResolvedValue({ data: { results: [], count: 0 } });
    await getMyRequests({
      type: 'remote_session', program_key: 'prog1', state: 'PENDING', page: 3, page_size: 15,
    });
    const [url] = mockClient.get.mock.calls[0];
    expect(url).toContain('/requests/remote-session/');
    expect(url).toContain('page=3');
    expect(url).toContain('page_size=15');
    expect(url).toContain('program_key=prog1');
    expect(url).toContain('state=PENDING');
  });
});
