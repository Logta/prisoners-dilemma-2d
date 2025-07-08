import { Provider } from 'jotai';
import type React from 'react';

interface JotaiProviderProps {
  children: React.ReactNode;
}

export const JotaiProvider: React.FC<JotaiProviderProps> = ({ children }) => {
  return <Provider>{children}</Provider>;
};
