import React from 'react';
import { Button } from './ui/Button';
import { Slider } from './ui/Slider';
import { Play, Pause, RotateCcw, StepForward } from 'lucide-react';

interface ControlPanelProps {
  isRunning: boolean;
  speed: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  speed,
  onStart,
  onPause,
  onReset,
  onStep,
  onSpeedChange,
  disabled = false,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Simulation Controls</h2>
      
      <div className="space-y-4">
        {/* Play/Pause Controls */}
        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              onClick={onStart}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Play size={16} />
              Start
            </Button>
          ) : (
            <Button
              onClick={onPause}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Pause size={16} />
              Pause
            </Button>
          )}
          
          <Button
            onClick={onStep}
            disabled={disabled || isRunning}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <StepForward size={16} />
            Step
          </Button>
          
          <Button
            onClick={onReset}
            disabled={disabled}
            variant="danger"
            className="flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Reset
          </Button>
        </div>

        {/* Speed Control */}
        <div>
          <Slider
            label="Speed (ms)"
            value={speed}
            onChange={onSpeedChange}
            min={50}
            max={2000}
            step={50}
            className="w-full"
          />
          <div className="text-xs text-gray-500 mt-1">
            Lower values = faster simulation
          </div>
        </div>
      </div>
    </div>
  );
};