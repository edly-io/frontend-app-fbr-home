import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@openedx/paragon';

/**
 * The "View below" control on a dashboard stat card. It is the card's only
 * interactive element: its ::after covers the whole card, so a click anywhere
 * on the card activates it, while the card keeps its heading for screen readers.
 */
const StatCardAction = ({ label, onClick }) => (
  <Button
    variant="link"
    size="inline"
    className="dashboard-stat-scroll-arrow dashboard-stat-card__action"
    onClick={onClick}
    aria-label={`View below: ${label}`}
  >
    <span className="dashboard-stat-card__action-text">↓ View below</span>
  </Button>
);

StatCardAction.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default StatCardAction;
