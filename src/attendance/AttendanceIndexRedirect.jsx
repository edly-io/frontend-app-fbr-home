import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const AttendanceIndexRedirect = () => {
  const { programId } = useParams();
  return <Navigate replace to={`/${programId}/attendance/me`} />;
};

export default AttendanceIndexRedirect;
