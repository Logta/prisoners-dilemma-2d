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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-bold text-4xl text-gray-900">2D 囚人のジレンマ</h1>
        <p className="text-gray-600 text-lg">協力戦略の進化シミュレーション</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Simulation Grid - Takes up more space */}
        <div className="lg:col-span-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900 text-xl">
              シミュレーショングリッド
              {statistics && (
                <span className="ml-2 font-normal text-gray-500 text-sm">
                  世代 {statistics.generation || 0} | {statistics.total_agents || 0} 体
                </span>
              )}
            </h2>
            <div className="flex justify-center">
              <SimulationGrid
                agents={agents}
                gridHeight={config.gridHeight}
                gridWidth={config.gridWidth}
              />
            </div>
          </div>
        </div>

        {/* Control Panel and Statistics */}
        <div className="space-y-6 lg:col-span-1">
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
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>React、TypeScript、WebAssembly (Rust) で開発</p>
      </div>
    </div>
  );
};
