// ========================================
// Jotai Provider Component
// ========================================

import React from 'react';
import { Provider } from 'jotai';

interface JotaiProviderProps {
  children: React.ReactNode;
}

export function JotaiProvider({ children }: JotaiProviderProps) {
  return (
    <Provider>
      {children}
    </Provider>
  );
}