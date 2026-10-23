import React from 'react';
import PropTypes from 'prop-types';
import {
  Navigate,
  Outlet,
  useParams,
  Link,
} from 'react-router-dom';
import { FooterSlot } from '@edx/frontend-component-footer';
import { Badge, Container } from '@openedx/paragon';
import { getConfig } from '@edx/frontend-platform';
import { useConfig, USER_ROLE } from '@edly-io/frontend-component-fbr';
import HeaderSlot from '../plugin-slots/HeaderSlot';
import SectionNav from './SectionNav';
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

const SessionsAdminLayout = ({ children = null }) => {
  const { programId } = useParams();
  const {
    program, loading, error, notFound,
  } = useProgram(programId);
  const { data: config } = useConfig();
  const isAdmin = config?.user_role === USER_ROLE.ADMIN;
  const authoringBaseUrl = getConfig().AUTHORING_BASE_URL || null;

  // A program that doesn't exist, or that the caller can't access, sends them back to the list.
  if (notFound) {
    return <Navigate to="/" replace />;
  }

  const statusKey = (program?.status || '').toLowerCase();
  const studioUrl = isAdmin && authoringBaseUrl && programId
    ? `${authoringBaseUrl.replace(/\/$/, '')}/authoring/programs/${programId}`
    : null;
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
                    {studioUrl && (
                      <a
                        href={studioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="sessions-program-header__studio-link"
                      >
                        Manage in Studio ↗
                      </a>
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
};

export default SessionsAdminLayout;
