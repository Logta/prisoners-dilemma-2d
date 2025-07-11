import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import type React from 'react';
import { Button } from './ui/Button';
import { Slider } from './ui/Slider';

interface ControlPanelProps {
  isRunning: boolean;
  speed: number;
  agentCount: number;
  currentAgentCount?: number; // 現在のシミュレーション内のエージェント数
  strategyComplexityPenalty: boolean;
  strategyComplexityPenaltyRate: number;
  torusField?: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
  onSpeedChange: (speed: number) => void;
  onAgentCountChange: (count: number) => void;
  onStrategyComplexityPenaltyChange: (enabled: boolean) => void;
  onStrategyComplexityPenaltyRateChange: (rate: number) => void;
  onTorusFieldChange?: (enabled: boolean) => void;
  disabled?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  speed,
  agentCount,
  currentAgentCount,
  strategyComplexityPenalty,
  strategyComplexityPenaltyRate,
  torusField = false,
  onStart,
  onPause,
  onReset,
  onStep,
  onSpeedChange,
  onAgentCountChange,
  onStrategyComplexityPenaltyChange,
  onStrategyComplexityPenaltyRateChange,
  onTorusFieldChange,
  disabled = false,
}) => {
  // エージェントが存在しない場合の警告
  const hasNoAgents = currentAgentCount === 0 || currentAgentCount === undefined;
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Simulation Controls</h2>

      <div className="space-y-4">
        {/* エージェントがいない場合の警告 */}
        {hasNoAgents && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  エージェントが配置されていません。「Reset」ボタンを押してエージェントを配置してください。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Play/Pause Controls */}
        <div className="flex gap-2">
          {isRunning ? (
            <Button className="flex items-center gap-2" onClick={onPause} variant="secondary">
              <Pause size={16} />
              Pause
            </Button>
          ) : (
            <Button 
              className="flex items-center gap-2" 
              disabled={disabled || hasNoAgents} 
              onClick={onStart}
              title={hasNoAgents ? "エージェントが配置されていません" : ""}
            >
              <Play size={16} />
              Start
            </Button>
          )}

          <Button
            className="flex items-center gap-2"
            disabled={disabled || isRunning || hasNoAgents}
            onClick={onStep}
            variant="secondary"
            title={hasNoAgents ? "エージェントが配置されていません" : ""}
          >
            <StepForward size={16} />
            Step
          </Button>

          <Button
            className="flex items-center gap-2"
            disabled={disabled}
            onClick={onReset}
            variant="danger"
          >
            <RotateCcw size={16} />
            Reset
          </Button>
        </div>

        {/* Speed Control */}
        <div>
          <Slider
            className="w-full"
            label="Speed (ms)"
            max={2000}
            min={50}
            onChange={onSpeedChange}
            step={50}
            value={speed}
          />
          <div className="text-xs text-gray-500 mt-1">Lower values = faster simulation</div>
        </div>

        {/* Agent Count Control */}
        <div>
          <Slider
            className="w-full"
            label={`Population Size (${agentCount} agents)`}
            max={1000}
            min={10}
            onChange={onAgentCountChange}
            step={10}
            value={agentCount}
          />
          <div className="text-xs text-gray-500 mt-1">
            Number of agents in the simulation (reset required to apply changes)
          </div>
        </div>

        {/* Strategy Complexity Penalty Mode */}
        <div className="border-t pt-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Strategy Complexity Penalty</span>
              <div className="text-xs text-gray-500 mt-1">
                Reduces fitness gain for TitForTat and Pavlov strategies
              </div>
            </div>
            <input
              checked={strategyComplexityPenalty}
              className="ml-4 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              disabled={disabled}
              onChange={(e) => onStrategyComplexityPenaltyChange(e.target.checked)}
              type="checkbox"
            />
          </label>

          {/* Penalty Rate Slider - Only show when penalty is enabled */}
          {strategyComplexityPenalty && (
            <div className="mt-3">
              <Slider
                className="w-full"
                label={`Penalty Rate (${strategyComplexityPenaltyRate}%)`}
                max={100}
                min={0}
                onChange={onStrategyComplexityPenaltyRateChange}
                step={5}
                value={strategyComplexityPenaltyRate}
              />
              <div className="text-xs text-gray-500 mt-1">
                Higher values = stronger penalty for complex strategies
              </div>
            </div>
          )}
        </div>

        {/* Torus Field Mode */}
        <div className="border-t pt-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Torus Field Mode</span>
              <div className="text-xs text-gray-500 mt-1">
                Allow agents to wrap around grid edges (grid becomes a torus)
              </div>
            </div>
            <input
              checked={torusField}
              className="ml-4 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              disabled={disabled}
              onChange={(e) => onTorusFieldChange?.(e.target.checked)}
              type="checkbox"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
