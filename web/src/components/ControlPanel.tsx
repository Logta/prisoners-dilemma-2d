import { createSignal } from 'solid-js';
import type { GridSize, AgentData, Statistics } from '../types';
import PresetManager from './PresetManager';
import CSVExporter from './CSVExporter';

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
  const [activeTab, setActiveTab] = createSignal<'controls' | 'presets' | 'export'>('controls');

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
    name: '',
    gridSize: props.gridSize,
    agentDensity: props.agentDensity,
    battleRadius: props.battleRadius,
    speed: props.speed,
    selectionMethod: props.selectionMethod,
    selectionParam: props.selectionParam,
    crossoverMethod: props.crossoverMethod,
    crossoverParam: props.crossoverParam,
    mutationRate: props.mutationRate,
    mutationStrength: props.mutationStrength,
  });

  return (
    <div class="control-panel">
      <h2>シミュレーション制御</h2>
      
      <div class="control-tabs">
        <button
          class={`tab-button ${activeTab() === 'controls' ? 'active' : ''}`}
          onClick={() => setActiveTab('controls')}
        >
          制御
        </button>
        <button
          class={`tab-button ${activeTab() === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          プリセット
        </button>
        <button
          class={`tab-button ${activeTab() === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          エクスポート
        </button>
      </div>

      {activeTab() === 'controls' && (
        <>
          <div class="control-section">
        <div class="control-buttons">
          <button
            class={`button ${props.isRunning ? 'danger' : ''}`}
            onClick={props.onToggle}
          >
            {props.isRunning ? '停止' : '開始'}
          </button>
          <button
            class="button"
            onClick={props.onReset}
            disabled={props.isRunning}
          >
            リセット
          </button>
        </div>
      </div>

      <div class="control-section">
        <h3>基本設定</h3>
        
        <div class="control-group">
          <label>グリッドサイズ</label>
          <div class="grid-size-controls">
            <input
              type="number"
              value={props.gridSize.width}
              min="10"
              max="1000"
              step="10"
              onChange={(e) => props.setGridSize({
                ...props.gridSize,
                width: Number(e.target.value)
              })}
              disabled={props.isRunning}
            />
            <span>×</span>
            <input
              type="number"
              value={props.gridSize.height}
              min="10"
              max="1000"
              step="10"
              onChange={(e) => props.setGridSize({
                ...props.gridSize,
                height: Number(e.target.value)
              })}
              disabled={props.isRunning}
            />
          </div>
        </div>

        <div class="control-group">
          <label>エージェント密度: {Math.round(props.agentDensity * 100)}%</label>
          <input
            type="range"
            min="0.1"
            max="0.8"
            step="0.05"
            value={props.agentDensity}
            onChange={(e) => props.setAgentDensity(Number(e.target.value))}
            disabled={props.isRunning}
          />
        </div>

        <div class="control-group">
          <label>対戦半径: {props.battleRadius}</label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={props.battleRadius}
            onChange={(e) => props.setBattleRadius(Number(e.target.value))}
          />
        </div>

        <div class="control-group">
          <label>実行速度: {props.speed}ms</label>
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={props.speed}
            onChange={(e) => props.setSpeed(Number(e.target.value))}
          />
        </div>
      </div>

      <div class="control-section">
        <h3>遺伝的アルゴリズム</h3>
        
        <div class="control-group">
          <label>選択方法</label>
          <select
            value={props.selectionMethod}
            onChange={(e) => props.setSelectionMethod(e.target.value)}
          >
            <option value="top_percent">上位パーセント選択</option>
            <option value="roulette">ルーレット選択</option>
            <option value="tournament">トーナメント選択</option>
          </select>
        </div>

        <div class="control-group">
          <label>
            {props.selectionMethod === 'top_percent' ? '選択割合' :
             props.selectionMethod === 'tournament' ? 'トーナメントサイズ' :
             '選択パラメータ'}: {props.selectionParam}
          </label>
          <input
            type="range"
            min={props.selectionMethod === 'tournament' ? '2' : '0.1'}
            max={props.selectionMethod === 'tournament' ? '10' : '1.0'}
            step={props.selectionMethod === 'tournament' ? '1' : '0.05'}
            value={props.selectionParam}
            onChange={(e) => props.setSelectionParam(Number(e.target.value))}
          />
        </div>

        <div class="control-group">
          <label>交叉方法</label>
          <select
            value={props.crossoverMethod}
            onChange={(e) => props.setCrossoverMethod(e.target.value)}
          >
            <option value="one_point">一点交叉</option>
            <option value="two_point">二点交叉</option>
            <option value="uniform">一様交叉</option>
          </select>
        </div>

        {props.crossoverMethod === 'uniform' && (
          <div class="control-group">
            <label>交叉確率: {props.crossoverParam}</label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={props.crossoverParam}
              onChange={(e) => props.setCrossoverParam(Number(e.target.value))}
            />
          </div>
        )}

        <div class="control-group">
          <label>突然変異率: {Math.round(props.mutationRate * 100)}%</label>
          <input
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={props.mutationRate}
            onChange={(e) => props.setMutationRate(Number(e.target.value))}
          />
        </div>

        <div class="control-group">
          <label>突然変異強度: {props.mutationStrength}</label>
          <input
            type="range"
            min="0.01"
            max="0.2"
            step="0.005"
            value={props.mutationStrength}
            onChange={(e) => props.setMutationStrength(Number(e.target.value))}
          />
        </div>
      </div>
        </>
      )}

      {activeTab() === 'presets' && (
        <PresetManager
          currentPreset={getCurrentPreset()}
          onLoadPreset={loadPreset}
        />
      )}

      {activeTab() === 'export' && (
        <CSVExporter
          agents={props.agents}
          historyData={props.historyData}
          statistics={props.statistics}
        />
      )}
    </div>
  );
}