import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Badge } from '@openedx/paragon';

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

// `studioUrl` is set for admins: their program work lives in Studio, so the
// card opens the program there instead of an fbr-home page.
const ProgramCard = ({ program, defaultSlug = 'courses', studioUrl = null }) => {
  const {
    id, name, programType, org, batch, status, startDate, endDate, description, cardImage,
    courseCount, enrolledAt,
  } = program;

  const statusKey = (status || '').toLowerCase();
  const dateRange = [formatDate(startDate), formatDate(endDate)].filter(Boolean).join(' – ');

  const bannerStyle = cardImage
    ? { backgroundImage: `url(${cardImage})` }
    : undefined;

  const cardContent = (
    <>
      <div className="program-card__banner" style={bannerStyle}>
        {!cardImage && (
          <div className="program-card__banner-placeholder">
            {(name || '?').split(' ').slice(0, 2)
              .map((w) => w[0]).join('')
              .toUpperCase()}
          </div>
        )}
        <div className="program-card__badges">
          {org && <span className="program-card__badge">{org}</span>}
          {programType && <span className="program-card__badge">{programType}</span>}
          {batch && <span className="program-card__badge">{batch}</span>}
        </div>
        {statusKey && (
          <div className="program-card__status">
            <Badge variant={STATUS_VARIANTS[statusKey] || 'light'}>
              {STATUS_LABELS[statusKey] || status}
            </Badge>
          </div>
        )}
      </div>

      <div className="program-card__body">
        <h2 className="program-card__title">{name}</h2>
        {dateRange && <p className="program-card__meta">{dateRange}</p>}
        <p className="program-card__stats">
          {`${courseCount} course${courseCount !== 1 ? 's' : ''}`}
          {enrolledAt && ` · Enrolled ${formatDate(enrolledAt)}`}
        </p>
        {description
          ? <p className="program-card__description">{description}</p>
          : <div className="program-card__spacer" />}
      </div>
    </>
  );

  return (
    <div className="program-card">
      {studioUrl ? (
        <a href={studioUrl} className="program-card__link">{cardContent}</a>
      ) : (
        <Link to={`/${id}/${defaultSlug}`} className="program-card__link">{cardContent}</Link>
      )}
    </div>
  );
};

ProgramCard.propTypes = {
  program: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    programType: PropTypes.string,
    org: PropTypes.string,
    batch: PropTypes.string,
    status: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    description: PropTypes.string,
    cardImage: PropTypes.string,
    courseCount: PropTypes.number,
    enrolledAt: PropTypes.string,
  }).isRequired,
  defaultSlug: PropTypes.string,
  studioUrl: PropTypes.string,
};

export default ProgramCard;
