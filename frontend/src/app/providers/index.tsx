import React from 'react';
import { AuthProvider } from '../../context/AuthContext';

export interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Global App Providers:
 * Wraps the application with AuthContext, Theme, and Future QueryClient providers.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

