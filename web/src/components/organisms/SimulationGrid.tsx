// ========================================
// Simulation Grid Organism Component
// ========================================

import { useState, useMemo, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  agentsAtom,
  gridDimensionsAtom,
  visualizationModeAtom,
  showGridAtom,
  showCoordinatesAtom,
  selectedAgentAtom,
  selectedPositionAtom,
} from '../../store/atoms';
import { useWasmSimulation } from '../../hooks/useWasmSimulation';
import type { AgentData, GridComponentProps } from '../../types';

export function SimulationGrid({
  width = 800,
  height = 600,
  cellSize = 8,
  className = '',
  'data-testid': testId,
  onAgentClick,
  onCellClick,
}: GridComponentProps) {
  // Jotai state
  const agents = useAtomValue(agentsAtom);
  const gridDimensions = useAtomValue(gridDimensionsAtom);
  const visualizationMode = useAtomValue(visualizationModeAtom);
  const showGrid = useAtomValue(showGridAtom);
  const showCoordinates = useAtomValue(showCoordinatesAtom);
  const setSelectedAgent = useSetAtom(selectedAgentAtom);
  const setSelectedPosition = useSetAtom(selectedPositionAtom);

  // WASM hook for data fetching
  const { getAgentAt } = useWasmSimulation();

  // Local state for hover effects
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  // Calculate actual cell size based on container constraints
  const actualCellSize = useMemo(() => {
    const maxCellWidth = width / gridDimensions.width;
    const maxCellHeight = height / gridDimensions.height;
    return Math.min(cellSize, maxCellWidth, maxCellHeight);
  }, [width, height, cellSize, gridDimensions]);

  const actualWidth = gridDimensions.width * actualCellSize;
  const actualHeight = gridDimensions.height * actualCellSize;

  // Color calculation based on visualization mode
  const getAgentColor = useCallback(
    (agent: AgentData): string => {
      if (!agent.is_alive) {
        return '#666666'; // Gray for dead agents
      }

      switch (visualizationMode) {
        case 'cooperation': {
          const cooperationHue = agent.cooperation_tendency * 120; // 0-120度 (red to green)
          return `hsl(${cooperationHue}, 70%, 50%)`;
        }
        case 'score': {
          // Normalize score to 0-1 range (assuming max score around 1000)
          const normalizedScore = Math.min(1, Math.max(0, agent.score / 1000));
          const scoreHue = normalizedScore * 240; // 0-240度 (red to blue)
          return `hsl(${scoreHue}, 70%, 50%)`;
        }
        case 'movement': {
          const movementHue = agent.movement_tendency * 300; // 0-300度
          return `hsl(${movementHue}, 60%, 60%)`;
        }
        default:
          return '#1976d2';
      }
    },
    [visualizationMode]
  );

  // Agent size calculation based on score
  const getAgentSize = useCallback(
    (agent: AgentData): number => {
      if (!agent.is_alive) {
        return actualCellSize * 0.3; // Smaller for dead agents
      }
      
      // Size based on score (0.5x to 1.5x cell size)
      const sizeMultiplier = 0.5 + Math.min(1, agent.score / 500);
      return Math.min(
        actualCellSize * 0.9,
        Math.max(actualCellSize * 0.3, actualCellSize * sizeMultiplier)
      );
    },
    [actualCellSize]
  );

  // Handle cell click
  const handleCellClick = useCallback(
    async (x: number, y: number) => {
      setSelectedPosition({ x, y });
      
      // Get agent at position
      const agent = await getAgentAt(x, y);
      setSelectedAgent(agent);
      
      // Call external handlers
      if (agent && onAgentClick) {
        onAgentClick(agent);
      }
      if (onCellClick) {
        onCellClick(x, y);
      }
    },
    [getAgentAt, setSelectedAgent, setSelectedPosition, onAgentClick, onCellClick]
  );

  // Render grid lines
  const renderGridLines = () => {
    if (!showGrid) return null;

    const lines = [];
    const gridColor = '#e0e0e0';

    // Vertical lines
    for (let x = 0; x <= gridDimensions.width; x++) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x * actualCellSize}
          x2={x * actualCellSize}
          y1={0}
          y2={actualHeight}
          stroke={gridColor}
          strokeWidth={0.5}
          opacity={0.5}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= gridDimensions.height; y++) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          x2={actualWidth}
          y1={y * actualCellSize}
          y2={y * actualCellSize}
          stroke={gridColor}
          strokeWidth={0.5}
          opacity={0.5}
        />
      );
    }

    return lines;
  };

  // Render coordinate labels
  const renderCoordinates = () => {
    if (!showCoordinates) return null;

    const coordinates = [];
    const step = Math.max(1, Math.floor(gridDimensions.width / 10));

    // X-axis labels
    for (let x = 0; x < gridDimensions.width; x += step) {
      coordinates.push(
        <text
          key={`coord-x-${x}`}
          x={x * actualCellSize + actualCellSize / 2}
          y={-5}
          textAnchor="middle"
          fontSize={Math.min(10, actualCellSize * 0.6)}
          fill="var(--color-text-secondary)"
          opacity={0.7}
        >
          {x}
        </text>
      );
    }

    // Y-axis labels
    for (let y = 0; y < gridDimensions.height; y += step) {
      coordinates.push(
        <text
          key={`coord-y-${y}`}
          x={-5}
          y={y * actualCellSize + actualCellSize / 2}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={Math.min(10, actualCellSize * 0.6)}
          fill="var(--color-text-secondary)"
          opacity={0.7}
        >
          {y}
        </text>
      );
    }

    return coordinates;
  };

  // Render interactive cells
  const renderInteractiveCells = () => {
    const cells = [];
    
    for (let x = 0; x < gridDimensions.width; x++) {
      for (let y = 0; y < gridDimensions.height; y++) {
        const isHovered = hoveredCell && hoveredCell.x === x && hoveredCell.y === y;
        
        cells.push(
          <rect
            key={`cell-${x}-${y}`}
            x={x * actualCellSize}
            y={y * actualCellSize}
            width={actualCellSize}
            height={actualCellSize}
            fill="transparent"
            stroke={isHovered ? 'var(--color-primary)' : 'transparent'}
            strokeWidth={1}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredCell({ x, y })}
            onMouseLeave={() => setHoveredCell(null)}
            onClick={() => handleCellClick(x, y)}
          />
        );
      }
    }
    
    return cells;
  };

  // Render agents
  const renderAgents = () => {
    if (!agents || agents.length === 0) return null;

    return agents.map((agent) => {
      // Validate agent data
      if (typeof agent.x !== 'number' || typeof agent.y !== 'number') {
        console.warn('Invalid agent data:', agent);
        return null;
      }

      const x = agent.x * actualCellSize + actualCellSize / 2;
      const y = agent.y * actualCellSize + actualCellSize / 2;
      const size = getAgentSize(agent);
      const color = getAgentColor(agent);

      return (
        <g key={agent.id}>
          {/* Main agent circle */}
          <circle
            cx={x}
            cy={y}
            r={size / 2}
            fill={color}
            stroke="var(--color-surface)"
            strokeWidth={0.5}
            opacity={agent.is_alive ? 0.9 : 0.5}
            style={{ cursor: 'pointer' }}
            onClick={() => handleCellClick(agent.x, agent.y)}
          >
            <title>
              {`Agent ${agent.id}\n` +
                `Position: (${agent.x}, ${agent.y})\n` +
                `Cooperation: ${(agent.cooperation_tendency * 100).toFixed(1)}%\n` +
                `Movement: ${(agent.movement_tendency * 100).toFixed(1)}%\n` +
                `Score: ${agent.score.toFixed(2)}\n` +
                `Energy: ${agent.energy.toFixed(1)}\n` +
                `Age: ${agent.age}\n` +
                `Alive: ${agent.is_alive ? 'Yes' : 'No'}`}
            </title>
          </circle>

          {/* Cooperation indicator (inner circle) */}
          {visualizationMode === 'cooperation' && agent.is_alive && (
            <circle
              cx={x}
              cy={y}
              r={size / 4}
              fill={agent.cooperation_tendency > 0.5 ? '#ffffff' : '#000000'}
              opacity={0.8}
            />
          )}

          {/* Score indicator (for high-scoring agents) */}
          {visualizationMode === 'score' && agent.score > 500 && (
            <circle
              cx={x}
              cy={y}
              r={size / 6}
              fill="#ffffff"
              opacity={0.9}
            />
          )}
        </g>
      );
    });
  };

  // Render legend
  const renderLegend = () => {
    const legendItems = [];
    
    switch (visualizationMode) {
      case 'cooperation':
        legendItems.push(
          <div key="coop-legend" className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'hsl(0, 70%, 50%)' }}></div>
            <span>Low Cooperation</span>
            <div className="legend-color" style={{ backgroundColor: 'hsl(120, 70%, 50%)' }}></div>
            <span>High Cooperation</span>
          </div>
        );
        break;
      case 'score':
        legendItems.push(
          <div key="score-legend" className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'hsl(0, 70%, 50%)' }}></div>
            <span>Low Score</span>
            <div className="legend-color" style={{ backgroundColor: 'hsl(240, 70%, 50%)' }}></div>
            <span>High Score</span>
          </div>
        );
        break;
      case 'movement':
        legendItems.push(
          <div key="movement-legend" className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'hsl(0, 60%, 60%)' }}></div>
            <span>Low Movement</span>
            <div className="legend-color" style={{ backgroundColor: 'hsl(300, 60%, 60%)' }}></div>
            <span>High Movement</span>
          </div>
        );
        break;
    }

    return legendItems;
  };

  return (
    <div className={`simulation-grid ${className}`} data-testid={testId}>
      {/* Header with grid info and legend */}
      <div className="grid-header">
        <div className="grid-info">
          <span>Grid: {gridDimensions.width} × {gridDimensions.height}</span>
          <span>Agents: {agents.length}</span>
          <span>Mode: {visualizationMode}</span>
        </div>
        <div className="grid-legend">
          {renderLegend()}
        </div>
      </div>

      {/* SVG Grid */}
      <div className="grid-container">
        <svg
          width={actualWidth}
          height={actualHeight}
          viewBox={`${showCoordinates ? -20 : 0} ${showCoordinates ? -20 : 0} ${
            actualWidth + (showCoordinates ? 40 : 0)
          } ${actualHeight + (showCoordinates ? 40 : 0)}`}
          style={{ maxWidth: '100%', height: 'auto' }}
        >
          {/* Coordinate labels */}
          {renderCoordinates()}

          {/* Grid lines */}
          {renderGridLines()}

          {/* Interactive cells */}
          {renderInteractiveCells()}

          {/* Agents */}
          {renderAgents()}
        </svg>
      </div>

      {/* Footer with statistics */}
      {agents.length > 0 && (
        <div className="grid-footer">
          <div className="grid-stats">
            <span>
              Avg Cooperation: {
                ((agents.reduce((sum, a) => sum + a.cooperation_tendency, 0) / agents.length) * 100).toFixed(1)
              }%
            </span>
            <span>
              Avg Movement: {
                ((agents.reduce((sum, a) => sum + a.movement_tendency, 0) / agents.length) * 100).toFixed(1)
              }%
            </span>
            <span>
              Avg Score: {(agents.reduce((sum, a) => sum + a.score, 0) / agents.length).toFixed(2)}
            </span>
            <span>
              Alive: {agents.filter(a => a.is_alive).length}/{agents.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Component styles
const styles = `
.simulation-grid {
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.grid-info {
  display: flex;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.grid-legend {
  display: flex;
  gap: var(--spacing-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
}

.grid-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-md);
  min-height: 400px;
  overflow: auto;
}

.grid-footer {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-background);
  border-top: 1px solid var(--color-border);
}

.grid-stats {
  display: flex;
  justify-content: space-around;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  flex-wrap: wrap;
}

/* Responsive design */
@media (max-width: 768px) {
  .grid-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .grid-info,
  .grid-legend {
    flex-wrap: wrap;
  }
  
  .grid-stats {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('simulation-grid-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'simulation-grid-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}