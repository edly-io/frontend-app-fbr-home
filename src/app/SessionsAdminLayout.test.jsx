import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  MemoryRouter, Route, Routes,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { useConfig, USER_ROLE } from '@edly-io/frontend-component-fbr';
import SessionsAdminLayout from './SessionsAdminLayout';

jest.mock('@edx/frontend-platform/auth');
jest.mock('@edx/frontend-platform', () => ({
  ...jest.requireActual('@edx/frontend-platform'),
  getConfig: jest.fn(),
}));
jest.mock('@edly-io/frontend-component-fbr', () => ({
  ...jest.requireActual('@edly-io/frontend-component-fbr'),
  useConfig: jest.fn(),
}));
jest.mock('@edx/frontend-component-footer', () => ({ FooterSlot: () => null }));
jest.mock('../plugin-slots/HeaderSlot', () => () => null);
jest.mock('./SectionNav', () => () => null);

const STUDIO = 'http://studio.test';
// A program that is not on the first page of the program list.
const PROGRAM_KEY = 'program-v1:FBR+STP+2025-A';
const DETAIL_URL = `${STUDIO}/fbr/api/programs/${encodeURIComponent(PROGRAM_KEY)}/`;

const mockClient = { get: jest.fn() };

const renderLayout = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/${PROGRAM_KEY}/courses`]}>
        <Routes>
          <Route path="/" element={<span>Programs list</span>} />
          <Route
            path="/:programId/courses"
            element={<SessionsAdminLayout><span>Courses page</span></SessionsAdminLayout>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  getConfig.mockReturnValue({ STUDIO_BASE_URL: STUDIO });
  getAuthenticatedHttpClient.mockReturnValue(mockClient);
  useConfig.mockReturnValue({ data: { user_role: USER_ROLE.LEARNER } });
});

describe('SessionsAdminLayout', () => {
  it('loads the program by key, whatever page of the list it is on', async () => {
    mockClient.get.mockImplementation((url) => (url === DETAIL_URL
      ? Promise.resolve({ data: { program_key: PROGRAM_KEY, name: 'Income Tax Assessment', status: 'archived' } })
      : Promise.reject(new Error(`unexpected GET ${url}`))));

    renderLayout();

    expect(await screen.findByText('Income Tax Assessment')).toBeInTheDocument();
    expect(screen.getByText('Courses page')).toBeInTheDocument();
  });

  it('sends the user back to the programs list when the program is not found', async () => {
    mockClient.get.mockRejectedValue({ response: { status: 404 } });

    renderLayout();

    expect(await screen.findByText('Programs list')).toBeInTheDocument();
  });
});
