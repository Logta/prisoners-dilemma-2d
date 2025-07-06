// ========================================
// Main Application Component
// ========================================

import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { SimulationGrid } from './components/organisms/SimulationGrid';
import { ControlPanel } from './components/organisms/ControlPanel';
import { StatisticsPanel } from './components/organisms/StatisticsPanel';
import { ErrorDisplay } from './components/molecules/ErrorDisplay';
import { LoadingSpinner } from './components/atoms/LoadingSpinner';
import { useWasmSimulation } from './hooks/useWasmSimulation';
import { 
  isWasmInitializedAtom, 
  isLoadingAtom, 
  errorAtom 
} from './store/atoms';

export function App() {
  const isInitialized = useAtomValue(isWasmInitializedAtom);
  const isLoading = useAtomValue(isLoadingAtom);
  const error = useAtomValue(errorAtom);
  
  const { initializeWasm } = useWasmSimulation();

  // Initialize WASM on app start
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeWasm();
    }
  }, [isInitialized, isLoading, initializeWasm]);

  // Show loading state
  if (isLoading && !isInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner message="WASMモジュールを初期化中..." />
      </div>
    );
  }

  // Show error state
  if (error && !isInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <ErrorDisplay 
          error={error} 
          onRetry={initializeWasm}
          title="初期化エラー"
        />
      </div>
    );
  }

  // Show main application
  if (isInitialized) {
    return (
      <div className="app-layout">
        <header className="app-header">
          <div className="container">
            <h1 className="app-title">2D Prisoner's Dilemma Simulation</h1>
            <p className="app-subtitle">
              二次元空間での囚人のジレンマと進化シミュレーション
            </p>
          </div>
        </header>

        <main className="app-main">
          <div className="container">
            <div className="simulation-layout">
              {/* Left Panel - Controls */}
              <aside className="control-panel-container">
                <ControlPanel />
              </aside>

              {/* Center - Grid Visualization */}
              <section className="grid-container">
                <SimulationGrid />
              </section>

              {/* Right Panel - Statistics */}
              <aside className="statistics-panel-container">
                <StatisticsPanel />
              </aside>
            </div>
          </div>
        </main>

        {/* Global Error Display */}
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

  // Fallback loading state
  return (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner message="アプリケーションを読み込み中..." />
    </div>
  );
}

// Inline styles for layout (can be moved to separate CSS file later)
const styles = `
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  padding: var(--spacing-lg) 0;
  box-shadow: var(--shadow-md);
}

.app-title {
  margin: 0;
  font-size: var(--font-size-xxl);
  font-weight: 600;
}

.app-subtitle {
  margin: var(--spacing-sm) 0 0 0;
  font-size: var(--font-size-md);
  opacity: 0.9;
}

.app-main {
  flex: 1;
  padding: var(--spacing-lg) 0;
}

.simulation-layout {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: var(--spacing-lg);
  min-height: 600px;
}

.control-panel-container,
.statistics-panel-container {
  display: flex;
  flex-direction: column;
}

.grid-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-surface);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-md);
}

.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Responsive design */
@media (max-width: 1200px) {
  .simulation-layout {
    grid-template-columns: 280px 1fr 280px;
    gap: var(--spacing-md);
  }
}

@media (max-width: 992px) {
  .simulation-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    gap: var(--spacing-md);
  }
  
  .control-panel-container {
    order: 1;
  }
  
  .grid-container {
    order: 2;
    min-height: 400px;
  }
  
  .statistics-panel-container {
    order: 3;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: var(--spacing-md) 0;
  }
  
  .app-title {
    font-size: var(--font-size-xl);
  }
  
  .app-subtitle {
    font-size: var(--font-size-sm);
  }
  
  .simulation-layout {
    gap: var(--spacing-sm);
  }
}
`;

// Inject styles (in a real app, this would be in a separate CSS file)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}