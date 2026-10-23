import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { PageWrap } from '@edx/frontend-platform/react';

import { REQUEST_TYPE } from '@edly-io/frontend-component-fbr';
import CalendarRoute from '../calendar/CalendarRoute';
import AuthGate from './AuthGate';
import SessionsAdminLayout from './SessionsAdminLayout';
import SessionsLanding from './SessionsLanding';
import RequestsPage, { RequestsTabPage } from '../requests/RequestsPage';
import AttendancePage from '../attendance/AttendancePage';
import AttendanceIndexRedirect from '../attendance/AttendanceIndexRedirect';
import MyAttendanceView from '../attendance/MyAttendanceView';
import ProgramCoursesPage from '../programs/ProgramCoursesPage';
import ProgramCertificatePage from '../programs/ProgramCertificatePage';
import CertificateVerifyPage from '../programs/CertificateVerifyPage';
import DashboardPage from '../dashboard/DashboardPage';

/**
 * Route paths owned by the sessions-admin area. Importing from here keeps
 * top-level `src/constants.ts` and `src/index.jsx` free of sessions-admin
 * specifics — the area owns its own paths.
 *
 * Paths are relative to the MFE basename (`PUBLIC_PATH=/fbr-home/`) which
 * `AppProvider`'s `<BrowserRouter basename>` strips before matching. So a
 * route declared `/` matches the URL `/fbr-home`, `/:programId/calendar`
 * matches `/fbr-home/<id>/calendar`, etc.
 */
// Deprecated alias — old `/fbr-home/calendar` bookmarks (relative `/calendar`
// under the MFE basename) redirect to the root programs list.
export const LEGACY_CALENDAR_PATH = '/calendar';
// Root: redirects to /dashboard.
export const FBR_HOME_ROOT_PATH = '/';
// Programs list (moved from root).
export const SESSIONS_PROGRAMS_PATH = '/programs';
// Unified top-level dashboard (all roles).
export const SESSIONS_DASHBOARD_PATH = '/dashboard';
// Program-scoped sections.
export const SESSIONS_CALENDAR_PATH = '/:programId/calendar';
export const SESSIONS_REQUESTS_PATH = '/:programId/requests';
export const SESSIONS_ATTENDANCE_PATH = '/:programId/attendance';
export const SESSIONS_COURSES_PATH = '/:programId/courses';
export const SESSIONS_CERTIFICATE_PATH = '/:programId/certificate';
// Public certificate page: what a scanned certificate QR code opens.
export const SESSIONS_CERTIFICATE_VERIFY_PATH = '/verify/:certificateNumber';

const Shell = SessionsAdminLayout as React.FC<{ children?: React.ReactNode }>;

const wrapInShell = (Component: React.ComponentType) => (
  <PageWrap>
    <AuthGate>
      <Shell>
        <Component />
      </Shell>
    </AuthGate>
  </PageWrap>
);

// Fragment children render correctly as direct children of `<Routes>` in
// React Router 6 — the router walks through the fragment when collecting
// route definitions.
export const sessionsAdminRoutes = (
  <>
    <Route
      path={LEGACY_CALENDAR_PATH}
      element={<Navigate to={FBR_HOME_ROOT_PATH} replace />}
    />
    <Route
      path={FBR_HOME_ROOT_PATH}
      element={<Navigate to={SESSIONS_DASHBOARD_PATH} replace />}
    />
    <Route
      path={SESSIONS_PROGRAMS_PATH}
      element={<PageWrap><AuthGate><SessionsLanding /></AuthGate></PageWrap>}
    />
    <Route path={SESSIONS_COURSES_PATH} element={wrapInShell(ProgramCoursesPage)} />
    <Route path={SESSIONS_CERTIFICATE_PATH} element={wrapInShell(ProgramCertificatePage)} />
    {/* No AuthGate: public page opened from a certificate's QR code. */}
    <Route path={SESSIONS_CERTIFICATE_VERIFY_PATH} element={<PageWrap><CertificateVerifyPage /></PageWrap>} />
    <Route path={SESSIONS_CALENDAR_PATH} element={wrapInShell(CalendarRoute)} />
    <Route path={SESSIONS_REQUESTS_PATH} element={wrapInShell(RequestsPage)}>
      <Route index element={<Navigate to="leaves" replace />} />
      <Route path="leaves" element={<RequestsTabPage lockedType={REQUEST_TYPE.LEAVE} />} />
      <Route path="remote-sessions" element={<RequestsTabPage lockedType={REQUEST_TYPE.REMOTE_SESSION} />} />
    </Route>
    <Route
      path={SESSIONS_DASHBOARD_PATH}
      element={<PageWrap><AuthGate><DashboardPage /></AuthGate></PageWrap>}
    />
    {/* Attendance tab is a layout route — children render inside the
        AttendancePage shell's <Outlet />. Learner: my attendance only.
        Instructor: redirected away. Admins manage attendance in Studio. */}
    <Route path={SESSIONS_ATTENDANCE_PATH} element={wrapInShell(AttendancePage)}>
      <Route index element={<AttendanceIndexRedirect />} />
      <Route path="me" element={<MyAttendanceView />} />
    </Route>
  </>
);
