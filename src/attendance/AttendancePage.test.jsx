import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
// eslint-disable-next-line import/no-extraneous-dependencies
import { IntlProvider } from 'react-intl';
import AttendancePage from './AttendancePage';

const jestDomMatchers = require('@testing-library/jest-dom/matchers');

expect.extend(jestDomMatchers);

jest.mock('@edly-io/frontend-component-fbr', () => ({
  ...jest.requireActual('@edly-io/frontend-component-fbr'),
  useConfig: jest.fn(),
}));

const { useConfig } = require('@edly-io/frontend-component-fbr');

const wrap = (userRole) => {
  useConfig.mockReturnValue({ data: { user_role: userRole } });
  return render(
    <MemoryRouter initialEntries={['/test-prog/attendance/me']}>
      <Routes>
        <Route
          path="/:programId/attendance"
          element={(
            <IntlProvider locale="en" messages={{}}>
              <AttendancePage />
            </IntlProvider>
          )}
        >
          <Route path="me" element={<div>My Attendance Outlet</div>} />
        </Route>
        <Route path="/:programId/calendar" element={<div>Calendar</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

beforeEach(() => jest.clearAllMocks());

it('does not render sub-nav for learner', () => {
  wrap('learner');
  expect(screen.queryByRole('navigation', { name: /attendance sub-sections/i })).not.toBeInTheDocument();
});

it('renders the outlet content for a learner', () => {
  wrap('learner');
  expect(screen.getByText('My Attendance Outlet')).toBeInTheDocument();
});

it('sends an instructor to the calendar', () => {
  wrap('instructor');
  expect(screen.getByText('Calendar')).toBeInTheDocument();
});

it('has no audit log toggle', () => {
  wrap('learner');
  expect(screen.queryByRole('button', { name: /audit log/i })).not.toBeInTheDocument();
});
