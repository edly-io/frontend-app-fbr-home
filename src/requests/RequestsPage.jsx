import React from 'react';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';

import { useConfig, USER_ROLE } from '@edly-io/frontend-component-fbr';
import InstructorRequestsView from './InstructorRequestsView';
import LearnerRequestsView from './LearnerRequestsView';
import RequestsSubNav from './RequestsSubNav';

// Renders the role-appropriate view for a single request type tab.
// Used as the element for /:programId/requests/leaves and /remote-sessions.
// Admins never get here: they manage requests in Studio.
export const RequestsTabPage = ({ lockedType }) => {
  const { data: config } = useConfig();
  if (config?.user_role === USER_ROLE.INSTRUCTOR) {
    return <InstructorRequestsView lockedType={lockedType} />;
  }
  return <LearnerRequestsView lockedType={lockedType} />;
};

RequestsTabPage.propTypes = {
  lockedType: PropTypes.string.isRequired,
};

// Layout route: renders the sub-nav tabs above whichever tab is active.
const RequestsPage = () => (
  <>
    <RequestsSubNav />
    <Outlet />
  </>
);

export default RequestsPage;
