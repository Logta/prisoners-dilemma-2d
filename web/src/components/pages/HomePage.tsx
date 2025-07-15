import type React from 'react';
import { useState } from 'react';
import { useSimulation } from '../../hooks/useSimulation';
import { ControlPanel } from '../ControlPanel';
import { SimulationGrid } from '../SimulationGrid';
import { StatisticsPanel } from '../StatisticsPanel';

export const HomePage: React.FC = () => {
  const [speed, setSpeed] = useState(500);
  const [agentCount, setAgentCount] = useState(200);
  const [strategyComplexityPenalty, setStrategyComplexityPenalty] = useState(false);
  const [strategyComplexityPenaltyRate, setStrategyComplexityPenaltyRate] = useState(15); // percentage 0-100
  const [torusField, setTorusField] = useState(false);

  const config = {
    agentCount,
    gridHeight: 100,
    gridWidth: 100,
    speed,
    strategyComplexityPenalty,
    strategyComplexityPenaltyRate: strategyComplexityPenaltyRate / 100, // convert to 0.0-1.0
    torusField,
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
    initializeSimulation,
    isInitialized,
    setStrategyComplexityPenalty: setSimulationPenalty,
    setStrategyComplexityPenaltyRate: setSimulationPenaltyRate,
    setTorusField: setSimulationTorusField,
  } = useSimulation(config);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 font-semibold text-lg text-red-800">エラー</h2>
          <p className="text-red-700">{error}</p>
          <button
            className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            onClick={() => window.location.reload()}
            type="button"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
          <p className="text-gray-600">シミュレーションを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 shadow-sm">
        <div className="container mx-auto text-center">
          <h1 className="mb-2 font-bold text-3xl text-gray-900">2D 囚人のジレンマ</h1>
          <p className="text-gray-600">協力戦略の進化シミュレーション</p>
          {statistics && (
            <div className="mt-2 text-gray-500 text-sm">
              世代 {statistics.generation || 0} | {statistics.total_agents || 0} 体
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row min-h-0 flex-1">
        {/* Simulation Grid - Sticky on larger screens */}
        <div className="flex-1 lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <h2 className="font-semibold text-gray-900 text-lg">シミュレーショングリッド</h2>
            </div>
            <div className="flex-1 flex items-center justify-center bg-white p-4">
              <SimulationGrid
                agents={agents}
                gridHeight={config.gridHeight}
                gridWidth={config.gridWidth}
              />
            </div>
          </div>
        </div>

        {/* Control Panel and Statistics - Scrollable sidebar */}
        <div className="lg:w-80 lg:min-w-80 bg-gray-50 border-l border-gray-200 lg:overflow-y-auto">
          <div className="p-4 space-y-4">
            <ControlPanel
              agentCount={agentCount}
              currentAgentCount={statistics?.total_agents || 0}
              disabled={loading}
              isInitialized={isInitialized}
              isRunning={isRunning}
              onAgentCountChange={setAgentCount}
              onInitialize={initializeSimulation}
              onPause={pause}
              onReset={reset}
              onSpeedChange={setSpeed}
              onStart={start}
              onStep={step}
              onStrategyComplexityPenaltyChange={(enabled) => {
                setStrategyComplexityPenalty(enabled);
                setSimulationPenalty(enabled);
              }}
              onStrategyComplexityPenaltyRateChange={(rate) => {
                setStrategyComplexityPenaltyRate(rate);
                setSimulationPenaltyRate(rate / 100);
              }}
              onTorusFieldChange={(enabled) => {
                setTorusField(enabled);
                setSimulationTorusField(enabled);
              }}
              speed={speed}
              strategyComplexityPenalty={strategyComplexityPenalty}
              strategyComplexityPenaltyRate={strategyComplexityPenaltyRate}
              torusField={torusField}
            />

            <StatisticsPanel loading={loading} statistics={statistics} />

            {/* Footer */}
            <div className="pt-4 border-t border-gray-200 text-center text-gray-500 text-xs">
              <p>React、TypeScript、WebAssembly (Rust) で開発</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
