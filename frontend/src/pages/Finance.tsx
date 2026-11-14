import React from 'react';
import { InvoiceList } from '../features/finance';

export const Finance: React.FC = () => {
  return (
    <div className="py-2">
      <InvoiceList />
    </div>
  );
};

