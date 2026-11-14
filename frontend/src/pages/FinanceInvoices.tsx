import React from 'react';
import { InvoicesView } from '../features/finance';

export const FinanceInvoices: React.FC = () => {
  return (
    <div className="py-2">
      <InvoicesView />
    </div>
  );
};

export default FinanceInvoices;
