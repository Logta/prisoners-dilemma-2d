// ========================================
// Control Panel Organism Component
// ========================================

import React, { useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import {
  simulationConfigAtom,
  updateConfigAtom,
  loadPresetConfigAtom,
} from '../../store/atoms/config';
import {
  visualizationModeAtom,
  showGridAtom,
  showCoordinatesAtom,
  autoRunAtom,
  autoRunSpeedAtom,
} from '../../store/atoms/ui';
import {
  isSimulationRunningAtom,
  currentGenerationAtom,
} from '../../store/atoms/simulation';
import { isLoadingAtom } from '../../store/atoms/wasm';
import {
  simulationProgressAtom,
  isSimulationFinishedAtom,
} from '../../store/atoms/derived';
import { useWasmSimulation } from '../../hooks/useWasmSimulation';
import type { ControlPanelProps, PresetType, SimulationConfig, VisualizationMode } from '../../types';

export function ControlPanel({
  className = '',
  'data-testid': testId,
}: ControlPanelProps) {
  // Jotai state
  const [config] = useAtom(simulationConfigAtom);
  const [visualizationMode, setVisualizationMode] = useAtom(visualizationModeAtom);
  const [showGrid, setShowGrid] = useAtom(showGridAtom);
  const [showCoordinates, setShowCoordinates] = useAtom(showCoordinatesAtom);
  const [autoRun, setAutoRun] = useAtom(autoRunAtom);
  const [autoRunSpeed, setAutoRunSpeed] = useAtom(autoRunSpeedAtom);
  
  const isRunning = useAtomValue(isSimulationRunningAtom);
  const isLoading = useAtomValue(isLoadingAtom);
  const currentGeneration = useAtomValue(currentGenerationAtom);
  const progress = useAtomValue(simulationProgressAtom);
  const isFinished = useAtomValue(isSimulationFinishedAtom);
  
  const updateConfig = useSetAtom(updateConfigAtom);
  const loadPreset = useSetAtom(loadPresetConfigAtom);

  // WASM simulation hook
  const {
    startSimulation,
    stopSimulation,
    resetSimulation,
    runStep,
    runGeneration,
    runMultipleGenerations,
  } = useWasmSimulation();

  // Local state for advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [multiGenCount, setMultiGenCount] = useState(10);

  // Handle configuration changes
  const handleConfigChange = (key: keyof SimulationConfig, value: any) => {
    updateConfig({ [key]: value });
  };

  // Handle preset selection
  const handlePresetChange = (preset: PresetType) => {
    loadPreset(preset);
  };

  // Auto-run functionality
  React.useEffect(() => {
    if (!autoRun || !isRunning || isFinished) return;

    const interval = setInterval(() => {
      if (!isLoading) {
        runGeneration();
      }
    }, autoRunSpeed);

    return () => clearInterval(interval);
  }, [autoRun, isRunning, isFinished, isLoading, autoRunSpeed, runGeneration]);

  return (
    <div className={`control-panel ${className}`} data-testid={testId}>
      <div className="control-section">
        <h3 className="section-title">Simulation Control</h3>
        
        {/* Progress Display */}
        <div className="progress-display">
          <div className="progress-info">
            <span>Generation: {currentGeneration} / {config.max_generations}</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Main Control Buttons */}
        <div className="control-buttons">
          {!isRunning ? (
            <Button 
              onClick={startSimulation}
              disabled={isLoading}
              variant="success"
              className="w-full"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : null}
              Start Simulation
            </Button>
          ) : (
            <Button 
              onClick={stopSimulation}
              variant="warning"
              className="w-full"
            >
              Stop Simulation
            </Button>
          )}
          
          <Button 
            onClick={resetSimulation}
            disabled={isLoading}
            variant="secondary"
            className="w-full"
          >
            Reset
          </Button>
        </div>

        {/* Step Controls */}
        <div className="step-controls">
          <Button 
            onClick={runStep}
            disabled={isLoading || isRunning || isFinished}
            size="sm"
          >
            Step
          </Button>
          
          <Button 
            onClick={runGeneration}
            disabled={isLoading || isRunning || isFinished}
            size="sm"
          >
            1 Generation
          </Button>
          
          <div className="multi-gen-control">
            <input
              type="number"
              value={multiGenCount}
              onChange={(e) => setMultiGenCount(Number(e.target.value))}
              min="1"
              max="100"
              className="input"
              style={{ width: '60px', fontSize: 'var(--font-size-sm)' }}
            />
            <Button 
              onClick={() => runMultipleGenerations(multiGenCount)}
              disabled={isLoading || isRunning || isFinished}
              size="sm"
            >
              Run
            </Button>
          </div>
        </div>

        {/* Auto Run Control */}
        <div className="auto-run-control">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoRun}
              onChange={(e) => setAutoRun(e.target.checked)}
              disabled={!isRunning}
            />
            Auto Run
          </label>
          
          {autoRun && (
            <div className="speed-control">
              <label className="label">Speed (ms/gen):</label>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={autoRunSpeed}
                onChange={(e) => setAutoRunSpeed(Number(e.target.value))}
                className="slider"
              />
              <span className="speed-value">{autoRunSpeed}ms</span>
            </div>
          )}
        </div>
      </div>

      {/* Visualization Settings */}
      <div className="control-section">
        <h3 className="section-title">Visualization</h3>
        
        <div className="control-group">
          <label className="label">Color Mode:</label>
          <select
            value={visualizationMode}
            onChange={(e) => setVisualizationMode(e.target.value as VisualizationMode)}
            className="input select"
          >
            <option value="cooperation">Cooperation</option>
            <option value="score">Score</option>
            <option value="movement">Movement</option>
          </select>
        </div>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            Show Grid Lines
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showCoordinates}
              onChange={(e) => setShowCoordinates(e.target.checked)}
            />
            Show Coordinates
          </label>
        </div>
      </div>

      {/* Preset Configuration */}
      <div className="control-section">
        <h3 className="section-title">Presets</h3>
        
        <div className="preset-buttons">
          <Button 
            onClick={() => handlePresetChange('small')}
            disabled={isRunning}
            size="sm"
            variant="secondary"
          >
            Small (30×30)
          </Button>
          <Button 
            onClick={() => handlePresetChange('medium')}
            disabled={isRunning}
            size="sm"
            variant="secondary"
          >
            Medium (50×50)
          </Button>
          <Button 
            onClick={() => handlePresetChange('large')}
            disabled={isRunning}
            size="sm"
            variant="secondary"
          >
            Large (100×100)
          </Button>
        </div>
      </div>

      {/* Basic Configuration */}
      <div className="control-section">
        <h3 className="section-title">Configuration</h3>
        
        <div className="config-grid">
          <div className="control-group">
            <label className="label">World Width:</label>
            <input
              type="number"
              value={config.world_width}
              onChange={(e) => handleConfigChange('world_width', Number(e.target.value))}
              min="10"
              max="200"
              disabled={isRunning}
              className="input"
            />
          </div>
          
          <div className="control-group">
            <label className="label">World Height:</label>
            <input
              type="number"
              value={config.world_height}
              onChange={(e) => handleConfigChange('world_height', Number(e.target.value))}
              min="10"
              max="200"
              disabled={isRunning}
              className="input"
            />
          </div>
          
          <div className="control-group">
            <label className="label">Population:</label>
            <input
              type="number"
              value={config.initial_population}
              onChange={(e) => handleConfigChange('initial_population', Number(e.target.value))}
              min="10"
              max="10000"
              disabled={isRunning}
              className="input"
            />
          </div>
          
          <div className="control-group">
            <label className="label">Max Generations:</label>
            <input
              type="number"
              value={config.max_generations}
              onChange={(e) => handleConfigChange('max_generations', Number(e.target.value))}
              min="1"
              max="10000"
              disabled={isRunning}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Advanced Configuration */}
      <div className="control-section">
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="section-toggle"
        >
          <h3 className="section-title">
            Advanced Settings 
            <span className={`toggle-icon ${showAdvanced ? 'expanded' : ''}`}>▼</span>
          </h3>
        </button>
        
        {showAdvanced && (
          <div className="advanced-config">
            <div className="config-grid">
              <div className="control-group">
                <label className="label">Battles/Gen:</label>
                <input
                  type="number"
                  value={config.battles_per_generation}
                  onChange={(e) => handleConfigChange('battles_per_generation', Number(e.target.value))}
                  min="1"
                  max="1000"
                  disabled={isRunning}
                  className="input"
                />
              </div>
              
              <div className="control-group">
                <label className="label">Neighbor Radius:</label>
                <input
                  type="number"
                  value={config.neighbor_radius}
                  onChange={(e) => handleConfigChange('neighbor_radius', Number(e.target.value))}
                  min="1"
                  max="10"
                  disabled={isRunning}
                  className="input"
                />
              </div>
              
              <div className="control-group">
                <label className="label">Mutation Rate:</label>
                <input
                  type="number"
                  value={config.mutation_rate}
                  onChange={(e) => handleConfigChange('mutation_rate', Number(e.target.value))}
                  min="0"
                  max="1"
                  step="0.01"
                  disabled={isRunning}
                  className="input"
                />
              </div>
              
              <div className="control-group">
                <label className="label">Mutation Strength:</label>
                <input
                  type="number"
                  value={config.mutation_strength}
                  onChange={(e) => handleConfigChange('mutation_strength', Number(e.target.value))}
                  min="0"
                  max="1"
                  step="0.01"
                  disabled={isRunning}
                  className="input"
                />
              </div>
              
              <div className="control-group">
                <label className="label">Elite Ratio:</label>
                <input
                  type="number"
                  value={config.elite_ratio}
                  onChange={(e) => handleConfigChange('elite_ratio', Number(e.target.value))}
                  min="0"
                  max="1"
                  step="0.01"
                  disabled={isRunning}
                  className="input"
                />
              </div>
              
              <div className="control-group">
                <label className="label">Selection Method:</label>
                <select
                  value={config.selection_method}
                  onChange={(e) => handleConfigChange('selection_method', e.target.value)}
                  disabled={isRunning}
                  className="input select"
                >
                  <option value="Tournament">Tournament</option>
                  <option value="Roulette">Roulette</option>
                  <option value="Rank">Rank</option>
                </select>
              </div>
              
              <div className="control-group">
                <label className="label">Crossover Method:</label>
                <select
                  value={config.crossover_method}
                  onChange={(e) => handleConfigChange('crossover_method', e.target.value)}
                  disabled={isRunning}
                  className="input select"
                >
                  <option value="Uniform">Uniform</option>
                  <option value="OnePoint">One Point</option>
                  <option value="TwoPoint">Two Point</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component styles
const styles = `
.control-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  max-height: 80vh;
  overflow-y: auto;
}

.control-section {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
}

.section-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.section-toggle {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.toggle-icon {
  transition: transform var(--transition-fast);
  float: right;
  font-size: var(--font-size-sm);
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

.progress-display {
  margin-bottom: var(--spacing-md);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.progress-bar {
  height: 8px;
  background-color: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  transition: width var(--transition-normal);
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.step-controls {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}

.multi-gen-control {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
}

.auto-run-control {
  padding: var(--spacing-sm);
  background-color: var(--color-background);
  border-radius: var(--border-radius-sm);
}

.speed-control {
  margin-top: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.slider {
  flex: 1;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.speed-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  min-width: 50px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.preset-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
}

.preset-buttons button:last-child {
  grid-column: 1 / -1;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.advanced-config {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

/* Responsive design */
@media (max-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .step-controls {
    flex-direction: column;
  }
  
  .preset-buttons {
    grid-template-columns: 1fr;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('control-panel-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'control-panel-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}