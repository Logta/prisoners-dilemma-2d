// ========================================
// ControlPanel Organism Component
// ========================================

import React, { useState } from 'react';
import { useTheme } from '../../contexts/ApplicationContext';
import { useSimulationController } from '../../hooks/useSimulationController';
import type { GridDimensions, SimulationConfig } from '../../types';
import { ControlButton } from '../molecules/ControlButton';
import { FormField } from '../molecules/FormField';

export interface ControlPanelProps {
  className?: string;
  'data-testid'?: string;
}

export function ControlPanel({ className = '', 'data-testid': testId }: ControlPanelProps) {
  const controller = useSimulationController();
  const { theme } = useTheme();

  const [config, setConfig] = useState<SimulationConfig>({
    crossover_rate: 0.8,
    elitism_rate: 0.1,
    min_population_size: 10,
    mutation_rate: 0.1,
    population_size: 100,
    selection_pressure: 2.0,
  });

  const [gridDimensions, setGridDimensions] = useState<GridDimensions>({
    height: 50,
    width: 50,
  });

  const [autoRunInterval, setAutoRunInterval] = useState<number>(1000);

  const panelStyle = {
    backgroundColor: theme.backgroundColor,
    border: `1px solid ${theme.mode === 'dark' ? '#444' : '#e0e0e0'}`,
    borderRadius: '8px',
    boxShadow:
      theme.mode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
  };

  const sectionStyle = {
    borderBottom: `1px solid ${theme.mode === 'dark' ? '#333' : '#f0f0f0'}`,
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
  };

  const sectionTitleStyle = {
    alignItems: 'center',
    color: theme.textColor,
    display: 'flex',
    fontSize: '1.125rem',
    fontWeight: '600',
    gap: '0.5rem',
    marginBottom: '1rem',
  };

  const buttonGroupStyle = {
    display: 'grid',
    gap: '0.75rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    marginBottom: '1rem',
  };

  const handleConfigChange = (field: keyof SimulationConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleGridChange = (field: keyof GridDimensions, value: number) => {
    setGridDimensions((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateNew = async () => {
    try {
      await controller.createNew(config, gridDimensions);
    } catch (error) {
      console.error('Failed to create simulation:', error);
    }
  };

  const handleUpdateConfig = async () => {
    try {
      await controller.updateConfiguration(config);
    } catch (error) {
      console.error('Failed to update configuration:', error);
    }
  };

  const handleAutoRunIntervalChange = (value: number) => {
    setAutoRunInterval(value);
    if (controller.isAutoRunning) {
      controller.setAutoRunInterval(value);
    }
  };

  return (
    <div className={className} data-testid={testId} style={panelStyle}>
      {/* シミュレーション制御 */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          <span>🎮</span>
          シミュレーション制御
        </h3>

        <div style={buttonGroupStyle}>
          <ControlButton
            disabled={controller.isRunning}
            icon="▶️"
            keyboard="Space"
            loading={controller.isRunning && !controller.isPaused}
            onClick={controller.start}
            tooltip="シミュレーションを開始"
            variant="success"
          >
            開始
          </ControlButton>

          <ControlButton
            disabled={!controller.isRunning || controller.isPaused}
            icon="⏸️"
            keyboard="P"
            onClick={controller.pause}
            tooltip="シミュレーションを一時停止"
            variant="warning"
          >
            一時停止
          </ControlButton>

          <ControlButton
            disabled={!controller.isPaused}
            icon="▶️"
            keyboard="R"
            onClick={controller.resume}
            tooltip="シミュレーションを再開"
            variant="primary"
          >
            再開
          </ControlButton>

          <ControlButton
            disabled={!controller.isRunning}
            icon="⏹️"
            keyboard="S"
            onClick={controller.stop}
            tooltip="シミュレーションを停止"
            variant="danger"
          >
            停止
          </ControlButton>
        </div>

        <div style={buttonGroupStyle}>
          <ControlButton
            disabled={controller.isRunning}
            icon="⏭️"
            keyboard="→"
            onClick={controller.step}
            tooltip="1世代だけ進める"
            variant="outline"
          >
            ステップ
          </ControlButton>

          <ControlButton
            disabled={controller.isRunning}
            icon="🔄"
            onClick={controller.reset}
            tooltip="シミュレーションをリセット"
            variant="secondary"
          >
            リセット
          </ControlButton>

          <ControlButton
            badge={controller.isAutoRunning ? 'ON' : 'OFF'}
            badgeVariant={controller.isAutoRunning ? 'success' : 'secondary'}
            icon={controller.isAutoRunning ? '⏹️' : '🔄'}
            onClick={() =>
              controller.isAutoRunning
                ? controller.stopAutoRun()
                : controller.startAutoRun(autoRunInterval)
            }
            tooltip="自動実行の切り替え"
            variant={controller.isAutoRunning ? 'danger' : 'primary'}
          >
            自動実行
          </ControlButton>
        </div>

        {/* 実行状況 */}
        <div
          style={{
            backgroundColor: theme.mode === 'dark' ? '#222' : '#f8f9fa',
            borderRadius: '4px',
            display: 'grid',
            fontSize: '0.875rem',
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            padding: '1rem',
          }}
        >
          <div>
            <strong>世代:</strong> {controller.generation}
          </div>
          <div>
            <strong>FPS:</strong> {controller.fps.toFixed(1)}
          </div>
          <div>
            <strong>前回実行時間:</strong> {controller.lastGenerationTime.toFixed(1)}ms
          </div>
          <div>
            <strong>状態:</strong>{' '}
            {controller.isRunning ? (controller.isPaused ? '一時停止' : '実行中') : '停止'}
          </div>
        </div>
      </div>

      {/* 自動実行設定 */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          <span>⚡</span>
          自動実行設定
        </h3>

        <FormField
          helperText="自動実行時の世代間隔（ミリ秒）"
          id="auto-run-interval"
          label="実行間隔 (ms)"
          max={10000}
          min={100}
          onChange={(value) => handleAutoRunIntervalChange(Number(value))}
          step={100}
          type="number"
          value={autoRunInterval}
        />
      </div>

      {/* グリッド設定 */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          <span>🔧</span>
          グリッド設定
        </h3>

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
          <FormField
            id="grid-width"
            label="幅"
            max={200}
            min={10}
            onChange={(value) => handleGridChange('width', Number(value))}
            type="number"
            value={gridDimensions.width}
          />

          <FormField
            id="grid-height"
            label="高さ"
            max={200}
            min={10}
            onChange={(value) => handleGridChange('height', Number(value))}
            type="number"
            value={gridDimensions.height}
          />
        </div>
      </div>

      {/* 進化パラメータ */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          <span>🧬</span>
          進化パラメータ
        </h3>

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
          <FormField
            id="population-size"
            label="人口サイズ"
            max={1000}
            min={10}
            onChange={(value) => handleConfigChange('population_size', Number(value))}
            type="number"
            value={config.population_size}
          />

          <FormField
            id="mutation-rate"
            label="突然変異率"
            max={0.5}
            min={0.01}
            onChange={(value) => handleConfigChange('mutation_rate', Number(value))}
            step={0.01}
            type="number"
            value={config.mutation_rate}
          />

          <FormField
            id="crossover-rate"
            label="交叉率"
            max={1.0}
            min={0.1}
            onChange={(value) => handleConfigChange('crossover_rate', Number(value))}
            step={0.1}
            type="number"
            value={config.crossover_rate}
          />

          <FormField
            id="selection-pressure"
            label="選択圧"
            max={5.0}
            min={1.0}
            onChange={(value) => handleConfigChange('selection_pressure', Number(value))}
            step={0.1}
            type="number"
            value={config.selection_pressure}
          />

          <FormField
            id="elitism-rate"
            label="エリート率"
            max={0.5}
            min={0.0}
            onChange={(value) => handleConfigChange('elitism_rate', Number(value))}
            step={0.05}
            type="number"
            value={config.elitism_rate}
          />

          <FormField
            id="min-population"
            label="最小人口"
            max={100}
            min={5}
            onChange={(value) => handleConfigChange('min_population_size', Number(value))}
            type="number"
            value={config.min_population_size}
          />
        </div>

        <div style={buttonGroupStyle}>
          <ControlButton
            disabled={controller.isRunning}
            icon="🆕"
            onClick={handleCreateNew}
            tooltip="新しいシミュレーションを作成"
            variant="success"
          >
            新規作成
          </ControlButton>

          <ControlButton
            disabled={controller.isRunning}
            icon="🔄"
            onClick={handleUpdateConfig}
            tooltip="現在の設定を更新"
            variant="primary"
          >
            設定更新
          </ControlButton>
        </div>
      </div>
    </div>
  );
}
