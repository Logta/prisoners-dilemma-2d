import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { SimulationGrid } from '../organisms/SimulationGrid';
import { ControlPanel } from '../organisms/ControlPanel';
import { StatisticsPanel } from '../organisms/StatisticsPanel';
import { ErrorDisplay } from '../molecules/ErrorDisplay';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { useWasmSimulation } from '../../hooks/useWasmSimulation';
import { isWasmInitializedAtom, isLoadingAtom } from '../../store/atoms/wasm';
import { errorAtom } from '../../store/atoms/error';

export function HomePage() {
  const isInitialized = useAtomValue(isWasmInitializedAtom);
  const isLoading = useAtomValue(isLoadingAtom);
  const error = useAtomValue(errorAtom);
  
  const { initializeWasm } = useWasmSimulation();

  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeWasm();
    }
  }, [isInitialized, isLoading, initializeWasm]);

  if (isLoading && !isInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner message="WASMモジュールを初期化中..." />
      </div>
    );
  }

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

  if (isInitialized) {
    return (
      <div className="simulation-layout">
        <aside className="control-panel-container">
          <ControlPanel />
        </aside>

        <section className="grid-container">
          <SimulationGrid />
        </section>

        <aside className="statistics-panel-container">
          <StatisticsPanel />
        </aside>

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

  return (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner message="アプリケーションを読み込み中..." />
    </div>
  );
}