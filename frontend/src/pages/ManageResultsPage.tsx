import React from 'react';
import { ExamResultsView } from '../features/examination';

export const ManageResultsPage: React.FC = () => {
  return (
    <div className="py-2">
      <ExamResultsView />
    </div>
  );
};

export default ManageResultsPage;
