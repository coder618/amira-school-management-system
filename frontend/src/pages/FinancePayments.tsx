import React from 'react';
import { PaymentsView } from '../features/finance';

export const FinancePayments: React.FC = () => {
  return (
    <div className="py-2">
      <PaymentsView />
    </div>
  );
};

export default FinancePayments;
