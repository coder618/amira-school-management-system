import React from 'react';
import { Navigate } from 'react-router-dom';

export const Examinations: React.FC = () => {
  return <Navigate to="/exams/manage" replace />;
};

export default Examinations;

