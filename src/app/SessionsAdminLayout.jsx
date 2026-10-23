import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Navigate,
  Outlet,
  useLocation,
  useParams,
  Link,
} from 'react-router-dom';
import { FooterSlot } from '@edx/frontend-component-footer';
import { Badge, Container } from '@openedx/paragon';
import { useConfig, USER_ROLE } from '@edly-io/frontend-component-fbr';
import HeaderSlot from '../plugin-slots/HeaderSlot';
import MovedToStudioPage from './MovedToStudioPage';
import SectionNav from './SectionNav';
import { getStudioProgramUrl } from './studioUrls';
import { useProgram } from './hooks';

const STATUS_VARIANTS = {
  active: 'success',
  draft: 'secondary',
  archived: 'danger',
  freezed: 'warning',
};

const STATUS_LABELS = {
  active: 'Active',
  draft: 'Draft',
  archived: 'Archived',
  freezed: 'Frozen',
};

const formatDate = (dateStr) => {
  if (!dateStr) { return null; }
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

// `studioOnly` marks a route that exists only to send admins to Studio (the
// removed admin paths): everyone else gets nothing there.
const SessionsAdminLayout = ({ children = null, studioOnly = false }) => {
  const { programId } = useParams();
  const {
    program, loading, error, notFound,
  } = useProgram(programId);
  const { pathname, search } = useLocation();
  const { data: config } = useConfig();
  const isAdmin = config?.user_role === USER_ROLE.ADMIN;

  // Admins do all program work in Studio: send them to the same page there.
  // Read positionally, like SectionNav: `programId` carries `:` and `+`.
  const subPath = pathname.split('/').filter(Boolean).slice(1).join('/');
  const studioUrl = isAdmin ? getStudioProgramUrl(programId, subPath, search) : null;

  useEffect(() => {
    // `replace`, so Back returns to the page before this one rather than
    // bouncing straight back into Studio.
    if (studioUrl) { window.location.replace(studioUrl); }
  }, [studioUrl]);

  if (isAdmin) {
    return (
      <>
        <HeaderSlot />
        <main id="main-content" className="d-flex flex-column flex-grow-1">
          <Container size="xl">
            <MovedToStudioPage studioUrl={studioUrl} />
          </Container>
        </main>
        <FooterSlot />
      </>
    );
  }
  if (studioOnly) { return null; }

  // A program that doesn't exist, or that the caller can't access, sends them back to the list.
  if (notFound) {
    return <Navigate to="/" replace />;
  }

  const statusKey = (program?.status || '').toLowerCase();
  const subtitle = [program?.org, program?.programType, program?.batch].filter(Boolean).join(' · ');
  const dateRange = [
    formatDate(program?.startDate),
    formatDate(program?.endDate),
  ].filter(Boolean).join(' – ');
  const metaLine = [subtitle, dateRange].filter(Boolean).join('  ·  ');

  const renderContent = () => {
    if (loading || error || !program) { return null; }
    return children ?? <Outlet />;
  };

  return (
    <>
      <HeaderSlot />
      <main id="main-content" className="d-flex flex-column flex-grow-1">
        <div className="sessions-program-header">
          <Container size="xl">

            <Link to="/programs" className="sessions-program-header__back">
              <span className="sessions-program-header__back-arrow">&#8592;</span>
              Programs
            </Link>

            {program && (
              <div className="sessions-program-header__info">
                <div className="sessions-program-header__top-row">
                  <h1 className="sessions-program-header__title">{program.name}</h1>
                  <div className="sessions-program-header__top-right">
                    {statusKey && (
                      <Badge variant={STATUS_VARIANTS[statusKey] || 'light'}>
                        {STATUS_LABELS[statusKey] || program.status}
                      </Badge>
                    )}
                  </div>
                </div>
                {metaLine && (
                  <p className="sessions-program-header__meta">{metaLine}</p>
                )}
              </div>
            )}

            <div className="sessions-program-header__nav">
              <SectionNav />
            </div>
          </Container>
        </div>

        <div className="sessions-page-content">
          <Container size="xl">
            {renderContent()}
          </Container>
        </div>
      </main>
      <FooterSlot />
    </>
  );
};

SessionsAdminLayout.propTypes = {
  children: PropTypes.node,
  studioOnly: PropTypes.bool,
};

export default SessionsAdminLayout;
