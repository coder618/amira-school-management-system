import React from 'react';
import { DocumentListView } from '../features/documents';

export const Documents: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <DocumentListView />
    </div>
  );
};

export default Documents;
