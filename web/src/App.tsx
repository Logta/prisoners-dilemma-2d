// ========================================
// Main Application Component
// ========================================

import { RouterProvider } from 'react-router-dom';
import { JotaiProvider } from './components/providers/JotaiProvider';
import { router } from './router';

export function App() {
  return (
    <JotaiProvider>
      <RouterProvider router={router} />
    </JotaiProvider>
  );
}
