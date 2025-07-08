import type React from 'react';
import type { WasmStatistics } from '../types/wasm';
import {
  MOVEMENT_STRATEGY_COLORS,
  MOVEMENT_STRATEGY_NAMES,
  STRATEGY_COLORS,
  STRATEGY_NAMES,
} from '../types/wasm';

interface StatisticsPanelProps {
  statistics: WasmStatistics | null;
  loading?: boolean;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  statistics,
  loading = false,
}) => {
  if (loading || !statistics) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Statistics</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  const strategyData = [
    {
      color: STRATEGY_COLORS[0],
      count: statistics.all_cooperate_count,
      name: STRATEGY_NAMES[0],
      type: 0,
    },
    {
      color: STRATEGY_COLORS[1],
      count: statistics.all_defect_count,
      name: STRATEGY_NAMES[1],
      type: 1,
    },
    {
      color: STRATEGY_COLORS[2],
      count: statistics.tit_for_tat_count,
      name: STRATEGY_NAMES[2],
      type: 2,
    },
    { color: STRATEGY_COLORS[3], count: statistics.pavlov_count, name: STRATEGY_NAMES[3], type: 3 },
  ];

  const movementStrategyData = [
    {
      color: MOVEMENT_STRATEGY_COLORS[0],
      count: statistics.explorer_count,
      name: MOVEMENT_STRATEGY_NAMES[0],
      type: 0,
    },
    {
      color: MOVEMENT_STRATEGY_COLORS[1],
      count: statistics.settler_count,
      name: MOVEMENT_STRATEGY_NAMES[1],
      type: 1,
    },
    {
      color: MOVEMENT_STRATEGY_COLORS[2],
      count: statistics.adaptive_count,
      name: MOVEMENT_STRATEGY_NAMES[2],
      type: 2,
    },
    {
      color: MOVEMENT_STRATEGY_COLORS[3],
      count: statistics.opportunist_count,
      name: MOVEMENT_STRATEGY_NAMES[3],
      type: 3,
    },
    {
      color: MOVEMENT_STRATEGY_COLORS[4],
      count: statistics.social_count,
      name: MOVEMENT_STRATEGY_NAMES[4],
      type: 4,
    },
    {
      color: MOVEMENT_STRATEGY_COLORS[5],
      count: statistics.antisocial_count,
      name: MOVEMENT_STRATEGY_NAMES[5],
      type: 5,
    },
  ];

  const formatPercentage = (value: number) => (value * 100).toFixed(1);
  const formatNumber = (value: number) => value.toFixed(2);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Statistics</h2>

      <div className="space-y-4">
        {/* Generation Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Generation</div>
            <div className="text-2xl font-bold text-blue-900">{statistics.generation}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Total Agents</div>
            <div className="text-2xl font-bold text-green-900">{statistics.total_agents}</div>
          </div>
        </div>

        {/* Strategy Distribution */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-900">Strategy Distribution</h3>
          <div className="space-y-2">
            {strategyData.map((strategy) => {
              const percentage =
                statistics.total_agents > 0 ? (strategy.count / statistics.total_agents) * 100 : 0;

              return (
                <div className="flex items-center gap-3" key={strategy.type}>
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: strategy.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {strategy.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {strategy.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: strategy.color,
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Movement Strategy Distribution */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-900">Movement Strategy Distribution</h3>
          <div className="space-y-2">
            {movementStrategyData.map((strategy) => {
              const percentage =
                statistics.total_agents > 0 ? (strategy.count / statistics.total_agents) * 100 : 0;

              return (
                <div className="flex items-center gap-3" key={strategy.type}>
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: strategy.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {strategy.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {strategy.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: strategy.color,
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Averages */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-900">Population Averages</h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-amber-50 p-3 rounded-lg">
              <div className="text-sm text-amber-600 font-medium">Cooperation Rate</div>
              <div className="text-xl font-bold text-amber-900">
                {formatPercentage(statistics.average_cooperation_rate)}%
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Mobility</div>
              <div className="text-xl font-bold text-purple-900">
                {formatNumber(statistics.average_mobility)}
              </div>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg">
              <div className="text-sm text-indigo-600 font-medium">Average Score</div>
              <div className="text-xl font-bold text-indigo-900">
                {formatNumber(statistics.average_score)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
