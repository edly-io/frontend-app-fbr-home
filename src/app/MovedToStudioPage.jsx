import React from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@openedx/paragon';

// What an admin sees on an fbr-home program URL while being sent to the same
// page in Studio. Without a Studio URL (AUTHORING_BASE_URL unset) there is
// nowhere to go, so it only explains where the page went.
const MovedToStudioPage = ({ studioUrl = null }) => (
  <div className="py-5 text-center">
    <h1 className="h3 mb-3">This page has moved to Studio</h1>
    {studioUrl ? (
      <>
        <Spinner animation="border" className="mb-3" screenReaderText="Opening Studio" />
        <p className="text-muted mb-0">
          Opening this page in Studio. If nothing happens,{' '}
          <a href={studioUrl}>open it in Studio</a>.
        </p>
      </>
    ) : (
      <p className="text-muted mb-0">
        Admins now manage programs, calendars, requests and attendance in Studio.
      </p>
    )}
  </div>
);

MovedToStudioPage.propTypes = {
  studioUrl: PropTypes.string,
};

export default MovedToStudioPage;
