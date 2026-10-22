import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
// eslint-disable-next-line import/no-extraneous-dependencies
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

import CalendarRoute from './CalendarRoute';
import { SESSIONS_CALENDAR_PATH } from '../app/routes';

const jestDomMatchers = require('@testing-library/jest-dom/matchers');

expect.extend(jestDomMatchers);

jest.mock('@edx/frontend-platform/auth');

const PROGRAM_KEY = 'program-v1:FBR+STP+2026-A';
const COURSE_ID = 'course-v1:FBR+PY101+2026';
const session = {
  id: 5,
  title: 'Python Workshop',
  status: 'scheduled',
  course_id: COURSE_ID,
  course_name: 'Intro to Python',
  scheduled_start_time: '2026-10-20T10:00:00Z',
  scheduled_end_time: '2026-10-20T11:00:00Z',
};

// One GET handler for every endpoint the calendar page reads, as an admin.
const routeGet = (url) => {
  if (url.includes('/config/')) { return Promise.resolve({ data: { user_role: 'admin', session_types: [] } }); }
  if (url.includes('/calendar-sessions/')) { return Promise.resolve({ data: { results: [], user_role: 'admin' } }); }
  if (url.includes('/program-dates/')) { return Promise.resolve({ data: { courses: [] } }); }
  if (url.includes('/public-holidays/')) { return Promise.resolve({ data: { count: 0, results: [] } }); }
  if (url.includes('/sessions/5/')) { return Promise.resolve({ data: session }); }
  return Promise.resolve({ data: {} });
};

// The deep link that admin notifications and the Home dashboard open.
const renderDeepLink = () => render(
  <IntlProvider locale="en" messages={{}}>
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[`/${PROGRAM_KEY}/calendar?modal=session&id=5`]}>
        <Routes>
          <Route path={SESSIONS_CALENDAR_PATH} element={<CalendarRoute />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </IntlProvider>,
);

beforeEach(() => {
  getAuthenticatedHttpClient.mockReturnValue({
    get: jest.fn(routeGet), post: jest.fn(), patch: jest.fn(), delete: jest.fn(),
  });
});

it('opens the session modal from an admin deep link', async () => {
  renderDeepLink();

  expect(await screen.findByText('Python Workshop')).toBeInTheDocument();
});

it("links the modal's roster to fbr-home's attendance page for the session's course", async () => {
  renderDeepLink();

  const rosterLink = await screen.findByRole('link', { name: 'View roster →' });
  expect(rosterLink).toHaveAttribute(
    'href',
    `/${PROGRAM_KEY}/attendance/sessions/5?course_id=${encodeURIComponent(COURSE_ID)}`,
  );
});
