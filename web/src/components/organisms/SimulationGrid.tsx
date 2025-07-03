// ========================================
// SimulationGrid Organism Component
// ========================================

import React, { useCallback, useMemo } from 'react';
import { useTheme } from '../../contexts/ApplicationContext';
import { useSimulationContext } from '../../contexts/SimulationContext';
import type { AgentData } from '../../types';

export interface SimulationGridProps {
  width?: number;
  height?: number;
  cellSize?: number;
  showGrid?: boolean;
  showCoordinates?: boolean;
  colorMode?: 'cooperation' | 'score' | 'movement';
  className?: string;
  'data-testid'?: string;
}

export function SimulationGrid({
  width = 800,
  height = 600,
  cellSize = 8,
  showGrid = true,
  showCoordinates = false,
  colorMode = 'cooperation',
  className = '',
  'data-testid': testId,
}: SimulationGridProps) {
  const { simulation } = useSimulationContext();
  const { theme } = useTheme();

  const agents = simulation.currentSimulation?.agents || [];
  const gridDimensions = simulation.currentSimulation?.gridDimensions || { height: 50, width: 50 };

  // グリッドの実際のサイズ計算
  const actualCellSize = useMemo(() => {
    const maxCellWidth = width / gridDimensions.width;
    const maxCellHeight = height / gridDimensions.height;
    return Math.min(cellSize, maxCellWidth, maxCellHeight);
  }, [width, height, cellSize, gridDimensions]);

  const actualWidth = gridDimensions.width * actualCellSize;
  const actualHeight = gridDimensions.height * actualCellSize;

  // エージェントの色計算
  const getAgentColor = useCallback(
    (agent: AgentData): string => {
      switch (colorMode) {
        case 'cooperation': {
          const cooperationHue = agent.cooperation_rate * 120; // 0-120度 (赤から緑)
          return `hsl(${cooperationHue}, 70%, 50%)`;
        }

        case 'score': {
          // スコアの正規化（仮定：0-100の範囲）
          const normalizedScore = Math.min(1, Math.max(0, agent.score / 100));
          const scoreHue = normalizedScore * 240; // 0-240度 (赤から青)
          return `hsl(${scoreHue}, 70%, 50%)`;
        }

        case 'movement': {
          const movementHue = agent.movement_rate * 300; // 0-300度
          return `hsl(${movementHue}, 60%, 60%)`;
        }

        default:
          return theme.primaryColor;
      }
    },
    [colorMode, theme.primaryColor]
  );

  // エージェントのサイズ計算
  const getAgentSize = useCallback(
    (agent: AgentData): number => {
      // スコアに基づいてサイズを調整（0.5倍から1.5倍の範囲）
      const sizeMultiplier = 0.5 + agent.score / 100;
      return Math.min(
        actualCellSize,
        Math.max(actualCellSize * 0.3, actualCellSize * sizeMultiplier)
      );
    },
    [actualCellSize]
  );

  // グリッドライン描画
  const renderGridLines = () => {
    if (!showGrid) return null;

    const lines = [];
    const gridColor = theme.mode === 'dark' ? '#444' : '#e0e0e0';

    // 縦線
    for (let x = 0; x <= gridDimensions.width; x++) {
      lines.push(
        <line
          key={`v-${x}`}
          opacity={0.5}
          stroke={gridColor}
          strokeWidth={0.5}
          x1={x * actualCellSize}
          x2={x * actualCellSize}
          y1={0}
          y2={actualHeight}
        />
      );
    }

    // 横線
    for (let y = 0; y <= gridDimensions.height; y++) {
      lines.push(
        <line
          key={`h-${y}`}
          opacity={0.5}
          stroke={gridColor}
          strokeWidth={0.5}
          x1={0}
          x2={actualWidth}
          y1={y * actualCellSize}
          y2={y * actualCellSize}
        />
      );
    }

    return lines;
  };

  // 座標表示
  const renderCoordinates = () => {
    if (!showCoordinates) return null;

    const coordinates = [];
    const step = Math.max(1, Math.floor(gridDimensions.width / 10));

    for (let x = 0; x < gridDimensions.width; x += step) {
      coordinates.push(
        <text
          fill={theme.textColor}
          fontSize={Math.min(10, actualCellSize * 0.6)}
          key={`coord-x-${x}`}
          opacity={0.7}
          textAnchor="middle"
          x={x * actualCellSize + actualCellSize / 2}
          y={-5}
        >
          {x}
        </text>
      );
    }

    for (let y = 0; y < gridDimensions.height; y += step) {
      coordinates.push(
        <text
          dominantBaseline="middle"
          fill={theme.textColor}
          fontSize={Math.min(10, actualCellSize * 0.6)}
          key={`coord-y-${y}`}
          opacity={0.7}
          textAnchor="end"
          x={-5}
          y={y * actualCellSize + actualCellSize / 2}
        >
          {y}
        </text>
      );
    }

    return coordinates;
  };

  // エージェント描画
  const renderAgents = () => {
    return agents.map((agent) => {
      const x = agent.x * actualCellSize + actualCellSize / 2;
      const y = agent.y * actualCellSize + actualCellSize / 2;
      const size = getAgentSize(agent);
      const color = getAgentColor(agent);

      return (
        <g key={agent.id}>
          <circle
            cx={x}
            cy={y}
            fill={color}
            opacity={0.9}
            r={size / 2}
            stroke={theme.backgroundColor}
            strokeWidth={0.5}
          >
            <title>
              {`Agent ${agent.id}\n` +
                `Position: (${agent.x}, ${agent.y})\n` +
                `Cooperation: ${(agent.cooperation_rate * 100).toFixed(1)}%\n` +
                `Movement: ${(agent.movement_rate * 100).toFixed(1)}%\n` +
                `Score: ${agent.score.toFixed(2)}`}
            </title>
          </circle>

          {/* 協力度を示すインナーサークル */}
          {colorMode === 'cooperation' && (
            <circle
              cx={x}
              cy={y}
              fill={agent.cooperation_rate > 0.5 ? '#ffffff' : '#000000'}
              opacity={0.8}
              r={size / 4}
            />
          )}
        </g>
      );
    });
  };

  const containerStyle = {
    backgroundColor: theme.backgroundColor,
    border: `1px solid ${theme.mode === 'dark' ? '#444' : '#e0e0e0'}`,
    borderRadius: '8px',
    overflow: 'auto',
    padding: '1rem',
    position: 'relative' as const,
  };

  const svgStyle = {
    display: 'block',
    height: 'auto',
    margin: '0 auto',
    maxWidth: '100%',
  };

  return (
    <div className={className} data-testid={testId} style={containerStyle}>
      {/* ヘッダー情報 */}
      <div
        style={{
          alignItems: 'center',
          color: theme.mode === 'dark' ? '#b0b0b0' : '#6c757d',
          display: 'flex',
          fontSize: '0.875rem',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <div>
          Grid: {gridDimensions.width} × {gridDimensions.height} | Agents: {agents.length} | Mode:{' '}
          {colorMode}
        </div>

        <div style={{ display: 'flex', fontSize: '0.75rem', gap: '1rem' }}>
          {colorMode === 'cooperation' && (
            <div style={{ alignItems: 'center', display: 'flex', gap: '0.5rem' }}>
              <div
                style={{
                  backgroundColor: 'hsl(0, 70%, 50%)',
                  borderRadius: '50%',
                  height: '12px',
                  width: '12px',
                }}
              />
              <span>Low Coop</span>
              <div
                style={{
                  backgroundColor: 'hsl(120, 70%, 50%)',
                  borderRadius: '50%',
                  height: '12px',
                  width: '12px',
                }}
              />
              <span>High Coop</span>
            </div>
          )}

          {colorMode === 'score' && (
            <div style={{ alignItems: 'center', display: 'flex', gap: '0.5rem' }}>
              <div
                style={{
                  backgroundColor: 'hsl(0, 70%, 50%)',
                  borderRadius: '50%',
                  height: '12px',
                  width: '12px',
                }}
              />
              <span>Low Score</span>
              <div
                style={{
                  backgroundColor: 'hsl(240, 70%, 50%)',
                  borderRadius: '50%',
                  height: '12px',
                  width: '12px',
                }}
              />
              <span>High Score</span>
            </div>
          )}
        </div>
      </div>

      {/* SVGグリッド */}
      <svg
        height={actualHeight}
        style={svgStyle}
        viewBox={`${showCoordinates ? -20 : 0} ${showCoordinates ? -20 : 0} ${actualWidth + (showCoordinates ? 40 : 0)} ${actualHeight + (showCoordinates ? 40 : 0)}`}
        width={actualWidth}
      >
        {/* 座標 */}
        {renderCoordinates()}

        {/* グリッドライン */}
        {renderGridLines()}

        {/* エージェント */}
        {renderAgents()}
      </svg>

      {/* 統計情報 */}
      {agents.length > 0 && (
        <div
          style={{
            color: theme.mode === 'dark' ? '#888' : '#6c757d',
            display: 'grid',
            fontSize: '0.75rem',
            gap: '0.5rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            marginTop: '1rem',
          }}
        >
          <div>
            Avg Cooperation:{' '}
            {(
              (agents.reduce((sum, a) => sum + a.cooperation_rate, 0) / agents.length) *
              100
            ).toFixed(1)}
            %
          </div>
          <div>
            Avg Movement:{' '}
            {((agents.reduce((sum, a) => sum + a.movement_rate, 0) / agents.length) * 100).toFixed(
              1
            )}
            %
          </div>
          <div>
            Avg Score: {(agents.reduce((sum, a) => sum + a.score, 0) / agents.length).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
