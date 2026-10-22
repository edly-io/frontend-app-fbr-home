import React from 'react';
import { useParams } from 'react-router-dom';
import { ProgramCalendar } from '@edly-io/frontend-component-fbr';

/** The program calendar at `/:programId/calendar`, with links built under `/:programId`. */
const CalendarRoute = () => {
  const { programId } = useParams();
  return <ProgramCalendar programKey={programId} basePath={`/${programId}`} />;
};

export default CalendarRoute;
