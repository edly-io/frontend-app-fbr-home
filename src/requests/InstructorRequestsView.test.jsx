import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import InstructorRequestsView from './InstructorRequestsView';

const jestDomMatchers = require('@testing-library/jest-dom/matchers');

expect.extend(jestDomMatchers);

jest.mock('@edly-io/frontend-component-fbr', () => ({
  ...jest.requireActual('@edly-io/frontend-component-fbr'),
  getLeaveUsage: jest.fn(),
  useConfig: jest.fn().mockReturnValue({ data: { user_role: 'instructor' } }),
  // The panel's own data and table are tested in the library.
  SessionLeavesPanel: function MockSessionLeavesPanel() { return <div>Sessions & Approved Leaves</div>; },
}));
jest.mock('./api', () => ({
  getMyRequests: jest.fn(),
  deleteRequest: jest.fn(),
  withdrawRequest: jest.fn(),
}));

const { getLeaveUsage } = require('@edly-io/frontend-component-fbr');
const { getMyRequests } = require('./api');

const wrap = (lockedType = null) => render(
  <IntlProvider locale="en" messages={{}}>
    <MemoryRouter initialEntries={['/test-program/requests']}>
      <Routes>
        <Route
          path="/:programId/requests"
          element={<InstructorRequestsView lockedType={lockedType} />}
        />
      </Routes>
    </MemoryRouter>
  </IntlProvider>,
);

beforeEach(() => {
  jest.clearAllMocks();
  getMyRequests.mockResolvedValue({ results: [], count: 0 });
  getLeaveUsage.mockResolvedValue({ threshold: 0, leaves: [] });
});

describe('InstructorRequestsView', () => {
  it('renders the requests table', async () => {
    wrap();
    await waitFor(() => expect(getMyRequests).toHaveBeenCalled());
  });

  it('renders SessionLeavesPanel when lockedType is leave', async () => {
    wrap('leave');
    await waitFor(() => expect(screen.getByText('Sessions & Approved Leaves')).toBeInTheDocument());
  });

  it('does NOT render SessionLeavesPanel when lockedType is remote_session', async () => {
    wrap('remote_session');
    await waitFor(() => expect(getMyRequests).toHaveBeenCalled());
    expect(screen.queryByText('Sessions & Approved Leaves')).not.toBeInTheDocument();
  });
});
