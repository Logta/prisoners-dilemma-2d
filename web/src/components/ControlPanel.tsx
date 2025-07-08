import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import type React from 'react';
import { Button } from './ui/Button';
import { Slider } from './ui/Slider';

interface ControlPanelProps {
  isRunning: boolean;
  speed: number;
  strategyComplexityPenalty: boolean;
  strategyComplexityPenaltyRate: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
  onSpeedChange: (speed: number) => void;
  onStrategyComplexityPenaltyChange: (enabled: boolean) => void;
  onStrategyComplexityPenaltyRateChange: (rate: number) => void;
  disabled?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  speed,
  strategyComplexityPenalty,
  strategyComplexityPenaltyRate,
  onStart,
  onPause,
  onReset,
  onStep,
  onSpeedChange,
  onStrategyComplexityPenaltyChange,
  onStrategyComplexityPenaltyRateChange,
  disabled = false,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Simulation Controls</h2>

      <div className="space-y-4">
        {/* Play/Pause Controls */}
        <div className="flex gap-2">
          {!isRunning ? (
            <Button className="flex items-center gap-2" disabled={disabled} onClick={onStart}>
              <Play size={16} />
              Start
            </Button>
          ) : (
            <Button className="flex items-center gap-2" onClick={onPause} variant="secondary">
              <Pause size={16} />
              Pause
            </Button>
          )}

          <Button
            className="flex items-center gap-2"
            disabled={disabled || isRunning}
            onClick={onStep}
            variant="secondary"
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
      </div>
    </div>
  );
};
