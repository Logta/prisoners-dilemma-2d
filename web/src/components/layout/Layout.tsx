import { Link, Outlet } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { ErrorDisplay } from '../molecules/ErrorDisplay';
import { errorAtom } from '../../store/atoms/error';

export function Layout() {
  const error = useAtomValue(errorAtom);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="app-title">
            <Link to="/" className="app-title-link">
              2D Prisoner's Dilemma Simulation
            </Link>
          </h1>
          <p className="app-subtitle">
            二次元空間での囚人のジレンマと進化シミュレーション
          </p>
        </div>
      </header>

      <main className="app-main">
        <div className="max-w-7xl mx-auto px-4">
          <Outlet />
        </div>
      </main>

      {error && (
        <div className="error-overlay">
          <ErrorDisplay 
            error={error} 
            onRetry={() => window.location.reload()}
            dismissible
          />
        </div>
      )}
    </div>
  );
}