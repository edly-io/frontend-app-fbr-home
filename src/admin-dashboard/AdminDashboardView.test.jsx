import React from 'react';
import { render, screen, within } from '@testing-library/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { getConfig } from '@edx/frontend-platform';

import AdminDashboardView from './AdminDashboardView';
import useAdminDashboard from './useAdminDashboard';

const jestDomMatchers = require('@testing-library/jest-dom/matchers');

expect.extend(jestDomMatchers);

jest.mock('./useAdminDashboard');
jest.mock('../dashboard/useFeedback', () => () => ({
  feedback: null, isLoading: false, loadError: null, submit: jest.fn(),
}));
jest.mock('@edx/frontend-platform/auth', () => ({
  getAuthenticatedUser: () => ({ username: 'admin' }),
}));
jest.mock('@edx/frontend-platform', () => ({
  getConfig: jest.fn(),
}));

const feedbackItem = (id) => ({
  id,
  feedback_name: `Feedback ${id}`,
  form_name: 'Form',
  type: 'trainee',
  subject: { id, full_name: `Trainee ${id}` },
  deadline: '2026-12-01',
  status: 'pending',
  urgent: false,
  submitted_at: null,
  can_submit: true,
});

const data = {
  state: 'ready',
  admin: { full_name: 'Sara Khan', role: 'Super Admin' },
  summary: {
    pending_attendance_sessions: 12,
    pending_leave_requests: 7,
    pending_remote_requests: 2,
    pending_substitute_requests: 0,
    pending_feedback: 6,
    upcoming_sessions: 3,
  },
  pending_attendance: [
    {
      session_id: '7',
      program_key: 'K',
      program_name: 'Programme K',
      course_id: 'C',
      session_start: '2026-10-14T10:00:00Z',
      title: 'Roster session',
      trainee_count: 10,
      unmarked_count: 4,
      age_days: 1,
      can_mark: true,
    },
  ],
  pending_requests: {
    leave_count: 7,
    remote_session_count: 2,
    substitute_count: 0,
    leave_by_program: [{ program_key: 'prog-a', program_name: 'Programme A', count: 7 }],
    remote_by_program: [{ program_key: 'prog-b', program_name: 'Programme B', count: 2 }],
    substitute_by_program: [],
  },
  feedback: [1, 2, 3, 4, 5, 6].map(feedbackItem),
  holidays: [],
  upcoming_sessions: [
    {
      session_id: '7', program_key: 'K', program_name: 'Programme K', title: 'Session 1', session_start: '2026-10-14T10:00:00Z',
    },
  ],
};

const renderView = () => render(
  <MemoryRouter>
    <IntlProvider locale="en" messages={{}}><AdminDashboardView /></IntlProvider>
  </MemoryRouter>,
);

beforeEach(() => {
  useAdminDashboard.mockReturnValue({ data, isLoading: false, isError: false });
  getConfig.mockReturnValue({ AUTHORING_BASE_URL: 'http://apps.test/' });
});

const statValue = (label) => screen
  .getByText(label, { selector: '.admin-dashboard__stat-label' })
  .closest('div').querySelector('strong').textContent;

it('takes every stat card count from the summary', () => {
  renderView();
  expect(statValue('Sessions to mark')).toBe('12');
  expect(statValue('Pending requests')).toBe('9');
  expect(statValue('Feedback to submit')).toBe('6');
  expect(statValue('Upcoming sessions (next 7 days)')).toBe('3');
});

it('shows per-programme request counts from the backend', () => {
  renderView();
  const row = screen.getByText('Programme A', { selector: '.admin-dashboard__request-program-name' }).parentElement;
  expect(within(row).getByText('7 pending')).toBeInTheDocument();
});

it('lists every feedback item without a View all toggle', () => {
  renderView();
  expect(screen.getAllByRole('button', { name: /fill form/i })).toHaveLength(6);
  expect(screen.queryByRole('button', { name: /view all/i })).not.toBeInTheDocument();
});

it('opens an upcoming session in the Studio calendar session popup', () => {
  renderView();
  expect(screen.getByRole('link', { name: /^view/i })).toHaveAttribute(
    'href',
    'http://apps.test/authoring/programs/K/calendar?modal=session&id=7',
  );
});

it('opens a session roster in Studio attendance', () => {
  renderView();
  expect(screen.getByRole('link', { name: /^mark/i })).toHaveAttribute(
    'href',
    'http://apps.test/authoring/programs/K/attendance/sessions/7?course_id=C',
  );
});

it('links pending requests to Studio', () => {
  renderView();
  const row = screen.getByText('Programme A', { selector: '.admin-dashboard__request-program-name' }).parentElement;
  expect(within(row).getByRole('link', { name: /review/i })).toHaveAttribute(
    'href',
    'http://apps.test/authoring/programs/prog-a/requests/leaves',
  );
});

it('renders no broken links when AUTHORING_BASE_URL is unset', () => {
  getConfig.mockReturnValue({});
  renderView();
  expect(screen.queryByRole('link', { name: /^view/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /^mark/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /review/i })).not.toBeInTheDocument();
  // The work itself is still listed.
  expect(screen.getByText('Roster session')).toBeInTheDocument();
  expect(screen.getByText('Session 1')).toBeInTheDocument();
});
