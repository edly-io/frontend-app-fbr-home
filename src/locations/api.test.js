import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { createLocation, updateLocation, deleteLocation } from './api';

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

describe('createLocation', () => {
  it('posts to /locations/ and returns data', async () => {
    mockClient.post.mockResolvedValue({ data: { id: 'loc1', name: 'Lab' } });
    const result = await createLocation({ name: 'Lab', description: '' });
    expect(mockClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/locations/'),
      { name: 'Lab', description: '' },
    );
    expect(result).toEqual({ id: 'loc1', name: 'Lab' });
  });
});

describe('updateLocation', () => {
  it('patches the location by id', async () => {
    mockClient.patch.mockResolvedValue({ data: { id: 'loc1', name: 'Lab B' } });
    const result = await updateLocation('loc1', { name: 'Lab B' });
    expect(mockClient.patch).toHaveBeenCalledWith(
      expect.stringContaining('/locations/loc1/'),
      { name: 'Lab B' },
    );
    expect(result).toEqual({ id: 'loc1', name: 'Lab B' });
  });
});

describe('deleteLocation', () => {
  it('sends DELETE to the location endpoint', async () => {
    mockClient.delete.mockResolvedValue({});
    await deleteLocation('loc1');
    expect(mockClient.delete).toHaveBeenCalledWith(
      expect.stringContaining('/locations/loc1/'),
    );
  });
});
