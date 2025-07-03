import { useState } from 'react';
import type { AgentData, GridSize, Statistics } from '../types';
import CSVExporter from './CSVExporter';
import PresetManager from './PresetManager';

interface ControlPanelProps {
  agentDensity: number;
  agents: AgentData[];
  battleRadius: number;
  crossoverMethod: string;
  crossoverParam: number;
  gridSize: GridSize;
  historyData: Statistics[];
  isRunning: boolean;
  mutationRate: number;
  mutationStrength: number;
  onReset: () => void;
  onToggle: () => void;
  selectionMethod: string;
  selectionParam: number;
  setAgentDensity: (value: number) => void;
  setBattleRadius: (value: number) => void;
  setCrossoverMethod: (value: string) => void;
  setCrossoverParam: (value: number) => void;
  setGridSize: (value: GridSize) => void;
  setMutationRate: (value: number) => void;
  setMutationStrength: (value: number) => void;
  setSelectionMethod: (value: string) => void;
  setSelectionParam: (value: number) => void;
  setSpeed: (value: number) => void;
  speed: number;
  statistics: Statistics;
}

export default function ControlPanel(props: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'controls' | 'presets' | 'export'>('controls');

  const loadPreset = (preset: any) => {
    props.setGridSize(preset.gridSize);
    props.setAgentDensity(preset.agentDensity);
    props.setBattleRadius(preset.battleRadius);
    props.setSpeed(preset.speed);
    props.setSelectionMethod(preset.selectionMethod);
    props.setSelectionParam(preset.selectionParam);
    props.setCrossoverMethod(preset.crossoverMethod);
    props.setCrossoverParam(preset.crossoverParam);
    props.setMutationRate(preset.mutationRate);
    props.setMutationStrength(preset.mutationStrength);
  };

  const getCurrentPreset = () => ({
    agentDensity: props.agentDensity,
    battleRadius: props.battleRadius,
    crossoverMethod: props.crossoverMethod,
    crossoverParam: props.crossoverParam,
    gridSize: props.gridSize,
    mutationRate: props.mutationRate,
    mutationStrength: props.mutationStrength,
    name: '',
    selectionMethod: props.selectionMethod,
    selectionParam: props.selectionParam,
    speed: props.speed,
  });

  return (
    <div className="control-panel">
      <h2>シミュレーション制御</h2>

      <div className="control-tabs">
        <button
          className={`tab-button ${activeTab === 'controls' ? 'active' : ''}`}
          onClick={() => setActiveTab('controls')}
        >
          制御
        </button>
        <button
          className={`tab-button ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          プリセット
        </button>
        <button
          className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          エクスポート
        </button>
      </div>

      {activeTab === 'controls' && (
        <>
          <div className="control-section">
            <div className="control-buttons">
              <button
                className={`button ${props.isRunning ? 'danger' : ''}`}
                onClick={props.onToggle}
              >
                {props.isRunning ? '停止' : '開始'}
              </button>
              <button className="button" disabled={props.isRunning} onClick={props.onReset}>
                リセット
              </button>
            </div>
          </div>

          <div className="control-section">
            <h3>基本設定</h3>

            <div className="control-group">
              <label>グリッドサイズ</label>
              <div className="grid-size-controls">
                <input
                  disabled={props.isRunning}
                  max="1000"
                  min="10"
                  onChange={(e) =>
                    props.setGridSize({
                      ...props.gridSize,
                      width: Number(e.target.value),
                    })
                  }
                  step="10"
                  type="number"
                  value={props.gridSize.width}
                />
                <span>×</span>
                <input
                  disabled={props.isRunning}
                  max="1000"
                  min="10"
                  onChange={(e) =>
                    props.setGridSize({
                      ...props.gridSize,
                      height: Number(e.target.value),
                    })
                  }
                  step="10"
                  type="number"
                  value={props.gridSize.height}
                />
              </div>
            </div>

            <div className="control-group">
              <label>エージェント密度: {Math.round(props.agentDensity * 100)}%</label>
              <input
                disabled={props.isRunning}
                max="0.8"
                min="0.1"
                onChange={(e) => props.setAgentDensity(Number(e.target.value))}
                step="0.05"
                type="range"
                value={props.agentDensity}
              />
            </div>

            <div className="control-group">
              <label>対戦半径: {props.battleRadius}</label>
              <input
                max="10"
                min="1"
                onChange={(e) => props.setBattleRadius(Number(e.target.value))}
                step="1"
                type="range"
                value={props.battleRadius}
              />
            </div>

            <div className="control-group">
              <label>実行速度: {props.speed}ms</label>
              <input
                max="1000"
                min="10"
                onChange={(e) => props.setSpeed(Number(e.target.value))}
                step="10"
                type="range"
                value={props.speed}
              />
            </div>
          </div>

          <div className="control-section">
            <h3>遺伝的アルゴリズム</h3>

            <div className="control-group">
              <label>選択方法</label>
              <select
                onChange={(e) => props.setSelectionMethod(e.target.value)}
                value={props.selectionMethod}
              >
                <option value="top_percent">上位パーセント選択</option>
                <option value="roulette">ルーレット選択</option>
                <option value="tournament">トーナメント選択</option>
              </select>
            </div>

            <div className="control-group">
              <label>
                {props.selectionMethod === 'top_percent'
                  ? '選択割合'
                  : props.selectionMethod === 'tournament'
                    ? 'トーナメントサイズ'
                    : '選択パラメータ'}
                : {props.selectionParam}
              </label>
              <input
                max={props.selectionMethod === 'tournament' ? '10' : '1.0'}
                min={props.selectionMethod === 'tournament' ? '2' : '0.1'}
                onChange={(e) => props.setSelectionParam(Number(e.target.value))}
                step={props.selectionMethod === 'tournament' ? '1' : '0.05'}
                type="range"
                value={props.selectionParam}
              />
            </div>

            <div className="control-group">
              <label>交叉方法</label>
              <select
                onChange={(e) => props.setCrossoverMethod(e.target.value)}
                value={props.crossoverMethod}
              >
                <option value="one_point">一点交叉</option>
                <option value="two_point">二点交叉</option>
                <option value="uniform">一様交叉</option>
              </select>
            </div>

            {props.crossoverMethod === 'uniform' && (
              <div className="control-group">
                <label>交叉確率: {props.crossoverParam}</label>
                <input
                  max="0.9"
                  min="0.1"
                  onChange={(e) => props.setCrossoverParam(Number(e.target.value))}
                  step="0.05"
                  type="range"
                  value={props.crossoverParam}
                />
              </div>
            )}

            <div className="control-group">
              <label>突然変異率: {Math.round(props.mutationRate * 100)}%</label>
              <input
                max="0.5"
                min="0.01"
                onChange={(e) => props.setMutationRate(Number(e.target.value))}
                step="0.01"
                type="range"
                value={props.mutationRate}
              />
            </div>

            <div className="control-group">
              <label>突然変異強度: {props.mutationStrength}</label>
              <input
                max="0.2"
                min="0.01"
                onChange={(e) => props.setMutationStrength(Number(e.target.value))}
                step="0.005"
                type="range"
                value={props.mutationStrength}
              />
            </div>
          </div>
        </>
      )}

      {activeTab === 'presets' && (
        <PresetManager currentPreset={getCurrentPreset()} onLoadPreset={loadPreset} />
      )}

      {activeTab === 'export' && (
        <CSVExporter
          agents={props.agents}
          historyData={props.historyData}
          statistics={props.statistics}
        />
      )}
    </div>
  );
}
