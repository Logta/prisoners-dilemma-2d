// ========================================
// Statistics Panel Organism Component
// ========================================

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { Button } from '../atoms/Button';
import {
  statisticsAtom,
  generationHistoryAtom,
  agentStatsByTypeAtom,
  selectedAgentAtom,
  currentGenerationAtom,
  simulationProgressAtom,
} from '../../store/atoms';
import type { StatisticsPanelProps, Statistics } from '../../types';

export function StatisticsPanel({
  className = '',
  'data-testid': testId,
  showHistory = true,
}: StatisticsPanelProps) {
  // Jotai state
  const statistics = useAtomValue(statisticsAtom);
  const generationHistory = useAtomValue(generationHistoryAtom);
  const agentStats = useAtomValue(agentStatsByTypeAtom);
  const selectedAgent = useAtomValue(selectedAgentAtom);
  const currentGeneration = useAtomValue(currentGenerationAtom);
  const progress = useAtomValue(simulationProgressAtom);

  // Local state
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'agent'>('current');
  const [historyRange, setHistoryRange] = useState(20); // Show last N generations

  // Calculate trends from history
  const getTrend = (key: keyof Statistics): string => {
    if (generationHistory.length < 2) return '—';
    
    const recent = generationHistory.slice(-5);
    if (recent.length < 2) return '—';
    
    const first = recent[0][key] as number;
    const last = recent[recent.length - 1][key] as number;
    
    if (Math.abs(last - first) < 0.001) return '→';
    return last > first ? '↗' : '↘';
  };

  // Format number with appropriate precision
  const formatNumber = (value: number, precision: number = 2): string => {
    if (value === 0) return '0';
    if (Math.abs(value) < 0.001) return '~0';
    return value.toFixed(precision);
  };

  // Format percentage
  const formatPercent = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Export statistics as CSV
  const exportStatistics = () => {
    if (generationHistory.length === 0) return;

    const csvHeaders = [
      'Generation',
      'Population',
      'Average Score',
      'Max Score',
      'Min Score',
      'Average Cooperation',
      'Total Battles'
    ].join(',');

    const csvData = generationHistory
      .map(stats => [
        stats.generation,
        stats.population,
        stats.average_score,
        stats.max_score,
        stats.min_score,
        stats.average_cooperation,
        stats.total_battles
      ].join(','))
      .join('\n');

    const csvContent = `${csvHeaders}\n${csvData}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation_statistics_gen${currentGeneration}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`statistics-panel ${className}`} data-testid={testId}>
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('current')}
          className={`tab-button ${activeTab === 'current' ? 'active' : ''}`}
        >
          Current
        </button>
        {showHistory && (
          <button
            onClick={() => setActiveTab('history')}
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          >
            History
          </button>
        )}
        {selectedAgent && (
          <button
            onClick={() => setActiveTab('agent')}
            className={`tab-button ${activeTab === 'agent' ? 'active' : ''}`}
          >
            Agent
          </button>
        )}
      </div>

      {/* Current Statistics Tab */}
      {activeTab === 'current' && (
        <div className="stats-content">
          <div className="stats-section">
            <h4 className="stats-title">Simulation Status</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Generation:</span>
                <span className="stat-value">{currentGeneration}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Progress:</span>
                <span className="stat-value">{formatPercent(progress / 100)}</span>
              </div>
            </div>
          </div>

          <div className="stats-section">
            <h4 className="stats-title">Population</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total:</span>
                <span className="stat-value">{agentStats.total}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Alive:</span>
                <span className="stat-value">{agentStats.alive}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Cooperators:</span>
                <span className="stat-value">{agentStats.cooperators}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Defectors:</span>
                <span className="stat-value">{agentStats.defectors}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Cooperation Rate:</span>
                <span className="stat-value">{formatPercent(agentStats.cooperationRate)}</span>
              </div>
            </div>
          </div>

          <div className="stats-section">
            <h4 className="stats-title">Performance Metrics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Avg Score:</span>
                <span className="stat-value">
                  {formatNumber(statistics.average_score)}
                  <span className="trend">{getTrend('average_score')}</span>
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Max Score:</span>
                <span className="stat-value">
                  {formatNumber(statistics.max_score)}
                  <span className="trend">{getTrend('max_score')}</span>
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Min Score:</span>
                <span className="stat-value">
                  {formatNumber(statistics.min_score)}
                  <span className="trend">{getTrend('min_score')}</span>
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Avg Cooperation:</span>
                <span className="stat-value">
                  {formatPercent(statistics.average_cooperation)}
                  <span className="trend">{getTrend('average_cooperation')}</span>
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Battles:</span>
                <span className="stat-value">{statistics.total_battles}</span>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="stats-actions">
            <Button
              onClick={exportStatistics}
              size="sm"
              variant="secondary"
              disabled={generationHistory.length === 0}
            >
              Export CSV
            </Button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && showHistory && (
        <div className="stats-content">
          <div className="history-controls">
            <label className="label">
              Show last:
              <select
                value={historyRange}
                onChange={(e) => setHistoryRange(Number(e.target.value))}
                className="input select"
              >
                <option value={10}>10 generations</option>
                <option value={20}>20 generations</option>
                <option value={50}>50 generations</option>
                <option value={100}>100 generations</option>
                <option value={-1}>All</option>
              </select>
            </label>
          </div>

          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Gen</th>
                  <th>Pop</th>
                  <th>Avg Score</th>
                  <th>Coop %</th>
                  <th>Battles</th>
                </tr>
              </thead>
              <tbody>
                {(historyRange === -1 
                  ? generationHistory 
                  : generationHistory.slice(-historyRange)
                ).map((stats) => (
                  <tr key={stats.generation}>
                    <td>{stats.generation}</td>
                    <td>{stats.population}</td>
                    <td>{formatNumber(stats.average_score, 1)}</td>
                    <td>{formatPercent(stats.average_cooperation)}</td>
                    <td>{stats.total_battles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {generationHistory.length === 0 && (
            <div className="empty-state">
              <p>No generation history available.</p>
              <p>Start a simulation to see historical data.</p>
            </div>
          )}
        </div>
      )}

      {/* Selected Agent Tab */}
      {activeTab === 'agent' && selectedAgent && (
        <div className="stats-content">
          <div className="agent-info">
            <h4 className="stats-title">Agent #{selectedAgent.id}</h4>
            
            <div className="agent-status">
              <span className={`status-badge ${selectedAgent.is_alive ? 'alive' : 'dead'}`}>
                {selectedAgent.is_alive ? 'Alive' : 'Dead'}
              </span>
            </div>

            <div className="stats-section">
              <h5 className="subsection-title">Position & Basic Info</h5>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Position:</span>
                  <span className="stat-value">({selectedAgent.x}, {selectedAgent.y})</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Age:</span>
                  <span className="stat-value">{selectedAgent.age}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Energy:</span>
                  <span className="stat-value">{formatNumber(selectedAgent.energy, 1)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Battles Fought:</span>
                  <span className="stat-value">{selectedAgent.battles_fought}</span>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <h5 className="subsection-title">Traits</h5>
              <div className="traits-display">
                <div className="trait-bar">
                  <span className="trait-label">Cooperation:</span>
                  <div className="trait-bar-container">
                    <div 
                      className="trait-bar-fill cooperation"
                      style={{ width: `${selectedAgent.cooperation_tendency * 100}%` }}
                    ></div>
                  </div>
                  <span className="trait-value">{formatPercent(selectedAgent.cooperation_tendency)}</span>
                </div>

                <div className="trait-bar">
                  <span className="trait-label">Aggression:</span>
                  <div className="trait-bar-container">
                    <div 
                      className="trait-bar-fill aggression"
                      style={{ width: `${selectedAgent.aggression_level * 100}%` }}
                    ></div>
                  </div>
                  <span className="trait-value">{formatPercent(selectedAgent.aggression_level)}</span>
                </div>

                <div className="trait-bar">
                  <span className="trait-label">Learning:</span>
                  <div className="trait-bar-container">
                    <div 
                      className="trait-bar-fill learning"
                      style={{ width: `${selectedAgent.learning_ability * 100}%` }}
                    ></div>
                  </div>
                  <span className="trait-value">{formatPercent(selectedAgent.learning_ability)}</span>
                </div>

                <div className="trait-bar">
                  <span className="trait-label">Movement:</span>
                  <div className="trait-bar-container">
                    <div 
                      className="trait-bar-fill movement"
                      style={{ width: `${selectedAgent.movement_tendency * 100}%` }}
                    ></div>
                  </div>
                  <span className="trait-value">{formatPercent(selectedAgent.movement_tendency)}</span>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <h5 className="subsection-title">Performance</h5>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Score:</span>
                  <span className="stat-value">{formatNumber(selectedAgent.score)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Fitness:</span>
                  <span className="stat-value">{formatNumber(selectedAgent.fitness)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No agent selected state */}
      {activeTab === 'agent' && !selectedAgent && (
        <div className="stats-content">
          <div className="empty-state">
            <p>No agent selected.</p>
            <p>Click on an agent in the grid to view details.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Component styles
const styles = `
.statistics-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  max-height: 80vh;
}

.tab-navigation {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-background);
}

.tab-button {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.tab-button:hover {
  background-color: var(--color-border);
}

.tab-button.active {
  color: var(--color-primary);
  background-color: var(--color-surface);
  border-bottom: 2px solid var(--color-primary);
}

.stats-content {
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
}

.stats-section {
  margin-bottom: var(--spacing-lg);
}

.stats-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.subsection-title {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-sm);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-border);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.trend {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.stats-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.history-controls {
  margin-bottom: var(--spacing-md);
}

.history-table-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.history-table th,
.history-table td {
  padding: var(--spacing-xs) var(--spacing-sm);
  text-align: right;
  border-bottom: 1px solid var(--color-border);
}

.history-table th {
  background-color: var(--color-background);
  font-weight: 600;
  color: var(--color-text);
  position: sticky;
  top: 0;
}

.history-table td {
  color: var(--color-text-secondary);
}

.history-table tr:hover {
  background-color: var(--color-background);
}

.agent-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.agent-status {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.status-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.alive {
  background-color: var(--color-success);
  color: white;
}

.status-badge.dead {
  background-color: var(--color-error);
  color: white;
}

.traits-display {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.trait-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.trait-label {
  min-width: 80px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.trait-bar-container {
  flex: 1;
  height: 8px;
  background-color: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.trait-bar-fill {
  height: 100%;
  transition: width var(--transition-normal);
}

.trait-bar-fill.cooperation {
  background: linear-gradient(90deg, #f44336 0%, #4caf50 100%);
}

.trait-bar-fill.aggression {
  background: linear-gradient(90deg, #2196f3 0%, #f44336 100%);
}

.trait-bar-fill.learning {
  background: linear-gradient(90deg, #9c27b0 0%, #ffeb3b 100%);
}

.trait-bar-fill.movement {
  background: linear-gradient(90deg, #607d8b 0%, #ff9800 100%);
}

.trait-value {
  min-width: 50px;
  text-align: right;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.empty-state p {
  margin: var(--spacing-sm) 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .stats-grid {
    gap: var(--spacing-xs);
  }
  
  .trait-label {
    min-width: 70px;
    font-size: var(--font-size-xs);
  }
  
  .history-table {
    font-size: var(--font-size-xs);
  }
  
  .history-table th,
  .history-table td {
    padding: var(--spacing-xs);
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('statistics-panel-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'statistics-panel-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}