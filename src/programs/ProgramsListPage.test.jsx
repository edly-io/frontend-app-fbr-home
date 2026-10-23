import React from 'react';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { useConfig, USER_ROLE } from '@edly-io/frontend-component-fbr';
import ProgramsListPage from './ProgramsListPage';

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

const STUDIO = 'http://studio.test';
const PROGRAMS_URL = `${STUDIO}/fbr/api/programs/`;

const programRow = (name) => ({
  program_key: `program-v1:FBR+STP+${name.replace(/\s/g, '')}`,
  name,
  organization: 'FBR',
  program_type: 'STP',
  batch: '2026',
  status: 'active',
});

const listPage = (names, { count = names.length, numPages = 1 } = {}) => ({
  results: names.map(programRow),
  pagination: { count, num_pages: numPages },
});

const mockClient = { get: jest.fn() };

const programRequests = () => mockClient.get.mock.calls.filter(([url]) => url === PROGRAMS_URL);
const lastParams = () => new URLSearchParams(programRequests().at(-1)[1].params);

const renderPage = (role = USER_ROLE.LEARNER) => {
  useConfig.mockReturnValue({ data: { user_role: role } });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProgramsListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  getConfig.mockReturnValue({ STUDIO_BASE_URL: STUDIO });
  getAuthenticatedHttpClient.mockReturnValue(mockClient);
  mockClient.get.mockImplementation((url, { params }) => Promise.resolve({
    data: new URLSearchParams(params).get('page') === '2'
      ? listPage(['Oldest Program'], { count: 21, numPages: 2 })
      : listPage(['Alpha Program'], { count: 21, numPages: 2 }),
  }));
});

describe('ProgramsListPage', () => {
  it('reaches a program on page 2 through the pagination control', async () => {
    renderPage();
    expect(await screen.findByText('Alpha Program')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(await screen.findByText('Oldest Program')).toBeInTheDocument();
    expect(lastParams().get('page')).toBe('2');
    expect(screen.getByText('Showing 21 - 21 of 21.')).toBeInTheDocument();
  });

  it('shows the row status and pagination control even with one page', async () => {
    mockClient.get.mockResolvedValue({ data: listPage(['Alpha Program', 'Bravo Program']) });

    renderPage();

    expect(await screen.findByText('Showing 1 - 2 of 2.')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Programs pagination' })).toBeInTheDocument();
  });

  it('sorts trainees by latest enrollment by default', async () => {
    renderPage(USER_ROLE.LEARNER);
    await screen.findByText('Alpha Program');
    expect(lastParams().toString()).toBe('page=1&page_size=20&ordering=-learner_enrolled_at');
  });

  it('sorts instructors by latest enrollment by default', async () => {
    renderPage(USER_ROLE.INSTRUCTOR);
    await screen.findByText('Alpha Program');
    expect(lastParams().get('ordering')).toBe('-learner_enrolled_at');
  });

  describe('sends search, status and sort to the server and restarts at page 1', () => {
    const openPageTwo = async () => {
      renderPage();
      await screen.findByText('Alpha Program');
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await screen.findByText('Oldest Program');
    };

    it('search', async () => {
      await openPageTwo();
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'tax' } });
      await waitFor(() => expect(lastParams().get('search')).toBe('tax'));
      expect(lastParams().get('page')).toBe('1');
    });

    it('several statuses', async () => {
      await openPageTwo();
      fireEvent.click(screen.getByRole('button', { name: /refine/i }));
      fireEvent.click(screen.getByLabelText('Active'));
      fireEvent.click(screen.getByLabelText('Archived'));
      await waitFor(() => expect(lastParams().getAll('status')).toEqual(['active', 'archived']));
      expect(lastParams().get('page')).toBe('1');
    });

    it('sort', async () => {
      await openPageTwo();
      fireEvent.click(screen.getByRole('button', { name: /refine/i }));
      fireEvent.click(screen.getByLabelText('Name Z–A'));
      await waitFor(() => expect(lastParams().get('ordering')).toBe('-name'));
      expect(lastParams().get('page')).toBe('1');
    });
  });
});

describe('ProgramsListPage cards', () => {
  const cardLink = async () => (await screen.findByText('Alpha Program')).closest('a');
  const KEY = 'program-v1:FBR+STP+AlphaProgram';

  it('opens the program in Studio for an admin', async () => {
    getConfig.mockReturnValue({ STUDIO_BASE_URL: STUDIO, AUTHORING_BASE_URL: 'http://apps.test/' });
    renderPage('admin');

    expect(await cardLink()).toHaveAttribute('href', `http://apps.test/authoring/programs/${KEY}`);
  });

  it('opens the program courses page in fbr-home for a trainee', async () => {
    getConfig.mockReturnValue({ STUDIO_BASE_URL: STUDIO, AUTHORING_BASE_URL: 'http://apps.test/' });
    renderPage(USER_ROLE.LEARNER);

    expect(await cardLink()).toHaveAttribute('href', `/${KEY}/courses`);
  });

  it('opens the program courses page in fbr-home for an instructor', async () => {
    getConfig.mockReturnValue({ STUDIO_BASE_URL: STUDIO, AUTHORING_BASE_URL: 'http://apps.test/' });
    renderPage(USER_ROLE.INSTRUCTOR);

    expect(await cardLink()).toHaveAttribute('href', `/${KEY}/courses`);
  });

  it('falls back to the fbr-home link for an admin when AUTHORING_BASE_URL is unset', async () => {
    renderPage('admin');

    expect(await cardLink()).toHaveAttribute('href', `/${KEY}/courses`);
  });
});
