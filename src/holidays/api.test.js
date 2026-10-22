import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { createHoliday, updateHoliday, deleteHoliday } from './api';

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

describe('createHoliday', () => {
  it('posts to /public-holidays/ and returns data', async () => {
    mockClient.post.mockResolvedValue({ data: { id: 1, name: 'Eid' } });
    const result = await createHoliday({ name: 'Eid', start_date: '2026-04-01', end_date: '2026-04-01' });
    expect(mockClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/public-holidays/'),
      { name: 'Eid', start_date: '2026-04-01', end_date: '2026-04-01' },
    );
    expect(result).toEqual({ id: 1, name: 'Eid' });
  });
});

describe('updateHoliday', () => {
  it('patches the holiday by id', async () => {
    mockClient.patch.mockResolvedValue({ data: { id: 1, name: 'Eid Updated' } });
    const result = await updateHoliday(1, { name: 'Eid Updated' });
    expect(mockClient.patch).toHaveBeenCalledWith(
      expect.stringContaining('/public-holidays/1/'),
      { name: 'Eid Updated' },
    );
    expect(result).toEqual({ id: 1, name: 'Eid Updated' });
  });
});

describe('deleteHoliday', () => {
  it('sends DELETE to the holiday endpoint', async () => {
    mockClient.delete.mockResolvedValue({});
    await deleteHoliday(5);
    expect(mockClient.delete).toHaveBeenCalledWith(
      expect.stringContaining('/public-holidays/5/'),
    );
  });
});
