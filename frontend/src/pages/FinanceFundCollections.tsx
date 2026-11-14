import React from 'react';
import { FundCollectionsView } from '../features/finance';

export const FinanceFundCollections: React.FC = () => {
  return (
    <div className="py-2">
      <FundCollectionsView />
    </div>
  );
};

export default FinanceFundCollections;
