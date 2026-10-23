import React from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';

import { useConfig, USER_ROLE } from '@edly-io/frontend-component-fbr';

// Layout route for a learner's own attendance. Instructors have no attendance
// section here, so they go to the calendar. Admins manage attendance in Studio.
const AttendancePage = () => {
  const { programId } = useParams();
  const { data: config } = useConfig();

  if (config?.user_role === USER_ROLE.INSTRUCTOR) {
    return <Navigate replace to={`/${programId}/calendar`} />;
  }

  return <Outlet />;
};

export default AttendancePage;
