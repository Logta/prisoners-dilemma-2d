import React, { useState } from 'react';
import { SimulationGrid } from '../SimulationGrid';
import { ControlPanel } from '../ControlPanel';
import { StatisticsPanel } from '../StatisticsPanel';
import { useSimulation } from '../../hooks/useSimulation';

export const HomePage: React.FC = () => {
  const [speed, setSpeed] = useState(500);
  
  const config = {
    gridWidth: 100,
    gridHeight: 100,
    agentCount: 1000,
    speed,
  };

  const {
    isRunning,
    statistics,
    agents,
    loading,
    error,
    start,
    pause,
    reset,
    step,
  } = useSimulation(config);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading simulation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          2D Prisoner's Dilemma
        </h1>
        <p className="text-lg text-gray-600">
          Evolutionary simulation of cooperation strategies
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Simulation Grid - Takes up more space */}
        <div className="lg:col-span-3">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Simulation Grid
              {statistics && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  Generation {statistics.generation} | {statistics.total_agents} agents
                </span>
              )}
            </h2>
            <div className="flex justify-center">
              <SimulationGrid
                agents={agents}
                gridWidth={config.gridWidth}
                gridHeight={config.gridHeight}
              />
            </div>
          </div>
        </div>

        {/* Control Panel and Statistics */}
        <div className="lg:col-span-1 space-y-6">
          <ControlPanel
            isRunning={isRunning}
            speed={speed}
            onStart={start}
            onPause={pause}
            onReset={reset}
            onStep={step}
            onSpeedChange={setSpeed}
            disabled={loading}
          />
          
          <StatisticsPanel
            statistics={statistics}
            loading={loading}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Built with React, TypeScript, and WebAssembly (Rust)
        </p>
      </div>
    </div>
  );
};