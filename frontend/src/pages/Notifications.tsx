import React from 'react';
import { NotificationCenter } from '../features/notification';

export const Notifications: React.FC = () => {
  return (
    <div className="py-2">
      <NotificationCenter />
    </div>
  );
};
