// ========================================
// Control Panel Organism Component
// ========================================

import React, { useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ChevronDown, Play, Square, RotateCcw, SkipForward, Forward } from 'lucide-react';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { cn } from '@/lib/utils';
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
    <div className={cn("space-y-6 p-4 max-h-[80vh] overflow-y-auto", className)} data-testid={testId}>
      <Card>
        <CardHeader>
          <CardTitle>シミュレーション制御</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Display */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>世代: {currentGeneration} / {config.max_generations}</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Main Control Buttons */}
          <div className="space-y-2">
            {!isRunning ? (
              <Button 
                onClick={startSimulation}
                disabled={isLoading}
                className="w-full"
                loading={isLoading}
              >
                <Play className="mr-2 h-4 w-4" />
                開始
              </Button>
            ) : (
              <Button 
                onClick={stopSimulation}
                variant="destructive"
                className="w-full"
              >
                <Square className="mr-2 h-4 w-4" />
                停止
              </Button>
            )}
            
            <Button 
              onClick={resetSimulation}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              リセット
            </Button>
          </div>

          {/* Step Controls */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={runStep}
              disabled={isLoading || isRunning || isFinished}
              size="sm"
              variant="outline"
            >
              <SkipForward className="mr-1 h-3 w-3" />
              ステップ
            </Button>
            
            <Button 
              onClick={runGeneration}
              disabled={isLoading || isRunning || isFinished}
              size="sm"
              variant="outline"
            >
              <Forward className="mr-1 h-3 w-3" />
              1世代
            </Button>
            
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={multiGenCount}
                onChange={(e) => setMultiGenCount(Number(e.target.value))}
                min={1}
                max={100}
                className="w-16 h-8 text-xs"
              />
              <Button 
                onClick={() => runMultipleGenerations(multiGenCount)}
                disabled={isLoading || isRunning || isFinished}
                size="sm"
                variant="outline"
              >
                実行
              </Button>
            </div>
          </div>

          {/* Auto Run Control */}
          <div className="p-3 bg-muted rounded-md space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-run"
                checked={autoRun}
                onChange={(e) => setAutoRun(e.target.checked)}
                disabled={!isRunning}
                className="h-4 w-4"
              />
              <Label htmlFor="auto-run" className="text-sm">自動実行</Label>
            </div>
            
            {autoRun && (
              <div className="space-y-2">
                <Label className="text-xs">速度: {autoRunSpeed}ms/世代</Label>
                <input
                  type="range"
                  min={50}
                  max={2000}
                  step={50}
                  value={autoRunSpeed}
                  onChange={(e) => setAutoRunSpeed(Number(e.target.value))}
                  className="w-full h-2 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visualization Settings */}
      <Card>
        <CardHeader>
          <CardTitle>表示設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>色モード</Label>
            <Select
              value={visualizationMode}
              onChange={(e) => setVisualizationMode(e.target.value as VisualizationMode)}
            >
              <option value="cooperation">協力</option>
              <option value="score">スコア</option>
              <option value="movement">移動</option>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-grid"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="show-grid" className="text-sm">グリッド線表示</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-coordinates"
                checked={showCoordinates}
                onChange={(e) => setShowCoordinates(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="show-coordinates" className="text-sm">座標表示</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preset Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>プリセット</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => handlePresetChange('small')}
              disabled={isRunning}
              size="sm"
              variant="outline"
            >
              小 (30×30)
            </Button>
            <Button 
              onClick={() => handlePresetChange('medium')}
              disabled={isRunning}
              size="sm"
              variant="outline"
            >
              中 (50×50)
            </Button>
            <Button 
              onClick={() => handlePresetChange('large')}
              disabled={isRunning}
              size="sm"
              variant="outline"
              className="col-span-2"
            >
              大 (100×100)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>基本設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>世界幅</Label>
              <Input
                type="number"
                value={config.world_width}
                onChange={(e) => handleConfigChange('world_width', Number(e.target.value))}
                min={10}
                max={200}
                disabled={isRunning}
              />
            </div>
            
            <div className="space-y-2">
              <Label>世界高</Label>
              <Input
                type="number"
                value={config.world_height}
                onChange={(e) => handleConfigChange('world_height', Number(e.target.value))}
                min={10}
                max={200}
                disabled={isRunning}
              />
            </div>
            
            <div className="space-y-2">
              <Label>初期個体数</Label>
              <Input
                type="number"
                value={config.initial_population}
                onChange={(e) => handleConfigChange('initial_population', Number(e.target.value))}
                min={10}
                max={10000}
                disabled={isRunning}
              />
            </div>
            
            <div className="space-y-2">
              <Label>最大世代数</Label>
              <Input
                type="number"
                value={config.max_generations}
                onChange={(e) => handleConfigChange('max_generations', Number(e.target.value))}
                min={1}
                max={10000}
                disabled={isRunning}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Configuration */}
      <Card>
        <CardHeader>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between p-0 text-left"
          >
            <CardTitle>高度な設定</CardTitle>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              showAdvanced && "rotate-180"
            )} />
          </button>
        </CardHeader>
        
        {showAdvanced && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>戦闘数/世代</Label>
                <Input
                  type="number"
                  value={config.battles_per_generation}
                  onChange={(e) => handleConfigChange('battles_per_generation', Number(e.target.value))}
                  min={1}
                  max={1000}
                  disabled={isRunning}
                />
              </div>
              
              <div className="space-y-2">
                <Label>近隣半径</Label>
                <Input
                  type="number"
                  value={config.neighbor_radius}
                  onChange={(e) => handleConfigChange('neighbor_radius', Number(e.target.value))}
                  min={1}
                  max={10}
                  disabled={isRunning}
                />
              </div>
              
              <div className="space-y-2">
                <Label>突然変異率</Label>
                <Input
                  type="number"
                  value={config.mutation_rate}
                  onChange={(e) => handleConfigChange('mutation_rate', Number(e.target.value))}
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={isRunning}
                />
              </div>
              
              <div className="space-y-2">
                <Label>突然変異強度</Label>
                <Input
                  type="number"
                  value={config.mutation_strength}
                  onChange={(e) => handleConfigChange('mutation_strength', Number(e.target.value))}
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={isRunning}
                />
              </div>
              
              <div className="space-y-2">
                <Label>エリート比率</Label>
                <Input
                  type="number"
                  value={config.elite_ratio}
                  onChange={(e) => handleConfigChange('elite_ratio', Number(e.target.value))}
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={isRunning}
                />
              </div>
              
              <div className="space-y-2">
                <Label>選択方法</Label>
                <Select
                  value={config.selection_method}
                  onChange={(e) => handleConfigChange('selection_method', e.target.value)}
                  disabled={isRunning}
                >
                  <option value="Tournament">トーナメント</option>
                  <option value="Roulette">ルーレット</option>
                  <option value="Rank">ランク</option>
                </Select>
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label>交叉方法</Label>
                <Select
                  value={config.crossover_method}
                  onChange={(e) => handleConfigChange('crossover_method', e.target.value)}
                  disabled={isRunning}
                >
                  <option value="Uniform">一様</option>
                  <option value="OnePoint">一点</option>
                  <option value="TwoPoint">二点</option>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

