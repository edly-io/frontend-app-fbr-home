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
// Mock without requireActual: the real module loads env.config.js, which
// imports @edx/frontend-platform back while it is still initialising.
jest.mock('@edx/frontend-platform', () => ({
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

const renderLayout = (url = `/${PROGRAM_KEY}/courses`, { studioOnly = false } = {}) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/" element={<span>Programs list</span>} />
          <Route
            path="/:programId/*"
            element={(
              <SessionsAdminLayout studioOnly={studioOnly}>
                <span>Courses page</span>
              </SessionsAdminLayout>
            )}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

// jsdom's window.location cannot be spied on, so swap in a stub.
const realLocation = window.location;
const replace = jest.fn();

beforeAll(() => {
  delete window.location;
  window.location = { ...realLocation, replace };
});

afterAll(() => {
  window.location = realLocation;
});

beforeEach(() => {
  jest.clearAllMocks();
  getConfig.mockReturnValue({ STUDIO_BASE_URL: STUDIO, AUTHORING_BASE_URL: 'http://apps.test/' });
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

const programDetail = () => mockClient.get.mockImplementation((url) => (url === DETAIL_URL
  ? Promise.resolve({ data: { program_key: PROGRAM_KEY, name: 'Income Tax Assessment', status: 'archived' } })
  : Promise.reject(new Error(`unexpected GET ${url}`))));

const asRole = (role) => useConfig.mockReturnValue({ data: { user_role: role } });

describe('SessionsAdminLayout for admins', () => {
  beforeEach(programDetail);

  it('redirects an admin to the same path in Studio', () => {
    asRole('admin');
    renderLayout(`/${PROGRAM_KEY}/requests/leaves`);

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(`http://apps.test/authoring/programs/${PROGRAM_KEY}/requests/leaves`);
    expect(screen.queryByText('Courses page')).not.toBeInTheDocument();
  });

  it('keeps the query string', () => {
    asRole('admin');
    renderLayout(`/${PROGRAM_KEY}/calendar?modal=session&id=5`);

    expect(replace).toHaveBeenCalledWith(
      `http://apps.test/authoring/programs/${PROGRAM_KEY}/calendar?modal=session&id=5`,
    );
  });

  it('shows a fallback link while the redirect happens', () => {
    asRole('admin');
    renderLayout(`/${PROGRAM_KEY}/requests/leaves`);

    expect(screen.getByRole('link', { name: 'open it in Studio' }))
      .toHaveAttribute('href', `http://apps.test/authoring/programs/${PROGRAM_KEY}/requests/leaves`);
  });

  it('stays put with no link when AUTHORING_BASE_URL is unset', () => {
    asRole('admin');
    getConfig.mockReturnValue({ STUDIO_BASE_URL: STUDIO });
    renderLayout(`/${PROGRAM_KEY}/requests/leaves`);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'This page has moved to Studio' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('redirects from a removed admin-only path', () => {
    asRole('admin');
    renderLayout(`/${PROGRAM_KEY}/attendance/dashboard`, { studioOnly: true });

    expect(replace).toHaveBeenCalledWith(`http://apps.test/authoring/programs/${PROGRAM_KEY}/attendance/dashboard`);
  });
});

describe('SessionsAdminLayout for trainees and instructors', () => {
  beforeEach(programDetail);

  it('shows an instructor the normal page', async () => {
    asRole(USER_ROLE.INSTRUCTOR);
    renderLayout(`/${PROGRAM_KEY}/calendar`);

    expect(await screen.findByText('Courses page')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('has no "Manage in Studio" link', async () => {
    asRole(USER_ROLE.LEARNER);
    renderLayout(`/${PROGRAM_KEY}/calendar`);

    expect(await screen.findByText('Income Tax Assessment')).toBeInTheDocument();
    expect(screen.queryByText(/Manage in Studio/)).not.toBeInTheDocument();
  });

  it('renders nothing for a non-admin on a removed admin-only path', () => {
    asRole(USER_ROLE.LEARNER);
    const { container } = renderLayout(`/${PROGRAM_KEY}/locations`, { studioOnly: true });

    expect(container).toBeEmptyDOMElement();
  });
});
