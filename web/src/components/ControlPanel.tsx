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
  isInitialized: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
  onInitialize: () => void;
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
  isInitialized,
  onStart,
  onPause,
  onReset,
  onStep,
  onInitialize,
  onSpeedChange,
  onAgentCountChange,
  onStrategyComplexityPenaltyChange,
  onStrategyComplexityPenaltyRateChange,
  onTorusFieldChange,
  disabled = false,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This component handles complex UI state management
}) => {
  // エージェントが存在しない場合の警告
  const hasNoAgents = currentAgentCount === 0 || currentAgentCount === undefined;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold text-gray-900 text-lg">シミュレーション制御</h2>

      <div className="space-y-3">
        {/* 初期化されていない場合の警告 */}
        {!isInitialized && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  aria-label="Info icon"
                  className="h-5 w-5 text-blue-400"
                  fill="currentColor"
                  role="img"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-blue-800 text-sm">
                  シミュレーションが初期化されていません。「初期配置」ボタンを押してエージェントを配置してください。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* エージェントがいない場合の警告 */}
        {isInitialized && hasNoAgents && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  aria-label="Warning icon"
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  role="img"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  エージェントが配置されていません。「初期配置」ボタンを押し直してください。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Initialization Controls */}
        <div className="flex flex-wrap gap-2">
          <Button
            className="flex items-center gap-2"
            disabled={disabled}
            onClick={onInitialize}
            variant={isInitialized ? 'secondary' : 'primary'}
          >
            <RotateCcw size={16} />
            初期配置
          </Button>
        </div>

        {/* Play/Pause Controls */}
        <div className="flex flex-wrap gap-2">
          {isRunning ? (
            <Button className="flex items-center gap-2" onClick={onPause} variant="secondary">
              <Pause size={16} />
              一時停止
            </Button>
          ) : (
            <Button
              className="flex items-center gap-2"
              disabled={disabled || !isInitialized || hasNoAgents}
              onClick={onStart}
              title={
                isInitialized
                  ? hasNoAgents
                    ? // biome-ignore lint/nursery/noSecrets: This is a Japanese tooltip message, not a secret
                      'エージェントが配置されていません'
                    : ''
                  : // biome-ignore lint/nursery/noSecrets: This is a Japanese tooltip message, not a secret
                    'まず初期配置を行ってください'
              }
            >
              <Play size={16} />
              開始
            </Button>
          )}

          <Button
            className="flex items-center gap-2"
            disabled={disabled || isRunning || !isInitialized || hasNoAgents}
            onClick={onStep}
            title={
              isInitialized
                ? hasNoAgents
                  ? // biome-ignore lint/nursery/noSecrets: This is a Japanese tooltip message, not a secret
                    'エージェントが配置されていません'
                  : ''
                : // biome-ignore lint/nursery/noSecrets: This is a Japanese tooltip message, not a secret
                  'まず初期配置を行ってください'
            }
            variant="secondary"
          >
            <StepForward size={16} />
            ステップ
          </Button>

          <Button
            className="flex items-center gap-2"
            disabled={disabled || !isInitialized}
            onClick={onReset}
            // biome-ignore lint/nursery/noSecrets: This is a Japanese tooltip message, not a secret
            title={isInitialized ? '' : 'まず初期配置を行ってください'}
            variant="danger"
          >
            <RotateCcw size={16} />
            リセット
          </Button>
        </div>

        {/* Speed Control */}
        <div>
          <Slider
            className="w-full"
            label="速度 (ms)"
            max={2000}
            min={50}
            onChange={onSpeedChange}
            step={50}
            value={speed}
          />
          <div className="mt-1 text-gray-500 text-xs">値が小さいほど高速</div>
        </div>

        {/* Agent Count Control */}
        <div>
          <Slider
            className="w-full"
            label={`エージェント数 (${agentCount} 体)`}
            max={1000}
            min={10}
            onChange={onAgentCountChange}
            step={10}
            value={agentCount}
          />
          <div className="mt-1 text-gray-500 text-xs">
            シミュレーション内のエージェント数（変更にはリセットが必要）
          </div>
        </div>

        {/* Strategy Complexity Penalty Mode */}
        <div className="border-t pt-4">
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <span className="font-medium text-gray-700 text-sm">戦略複雑度ペナルティ</span>
              <div className="mt-1 text-gray-500 text-xs">
                しっぺ返し戦略とパブロフ戦略の適応度上昇を抑制
              </div>
            </div>
            <input
              checked={strategyComplexityPenalty}
              className="ml-4 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
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
                label={`ペナルティ率 (${strategyComplexityPenaltyRate}%)`}
                max={100}
                min={0}
                onChange={onStrategyComplexityPenaltyRateChange}
                step={5}
                value={strategyComplexityPenaltyRate}
              />
              <div className="mt-1 text-gray-500 text-xs">
                値が大きいほど複雑な戦略への強いペナルティ
              </div>
            </div>
          )}
        </div>

        {/* Torus Field Mode */}
        <div className="border-t pt-4">
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <span className="font-medium text-gray-700 text-sm">トーラスフィールドモード</span>
              <div className="mt-1 text-gray-500 text-xs">
                エージェントがグリッドの端を越えて移動可能（トーラス状）
              </div>
            </div>
            <input
              checked={torusField}
              className="ml-4 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
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
