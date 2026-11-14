import React from 'react';
import { Navigate } from 'react-router-dom';

export const Finance: React.FC = () => {
  return <Navigate to="/finance/invoices" replace />;
};

export default Finance;

