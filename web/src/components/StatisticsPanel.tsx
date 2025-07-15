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
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900 text-xl">統計</h2>
        <div className="animate-pulse">
          <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
          <div className="mb-2 h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-4 w-2/3 rounded bg-gray-200" />
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
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-semibold text-gray-900 text-xl">統計</h2>

      <div className="space-y-4">
        {/* Generation Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="font-medium text-blue-600 text-sm">世代</div>
            <div className="font-bold text-2xl text-blue-900">{statistics.generation}</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3">
            <div className="font-medium text-green-600 text-sm">総エージェント数</div>
            <div className="font-bold text-2xl text-green-900">{statistics.total_agents}</div>
          </div>
        </div>

        {/* Strategy Distribution */}
        <div>
          <h3 className="mb-3 font-medium text-gray-900 text-lg">戦略分布</h3>
          <div className="space-y-2">
            {strategyData.map((strategy) => {
              const percentage =
                statistics.total_agents > 0 ? (strategy.count / statistics.total_agents) * 100 : 0;

              return (
                <div className="flex items-center gap-3" key={strategy.type}>
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: strategy.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium text-gray-700 text-sm">
                        {strategy.name}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {strategy.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
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
          <h3 className="mb-3 font-medium text-gray-900 text-lg">移動戦略分布</h3>
          <div className="space-y-2">
            {movementStrategyData.map((strategy) => {
              const percentage =
                statistics.total_agents > 0 ? (strategy.count / statistics.total_agents) * 100 : 0;

              return (
                <div className="flex items-center gap-3" key={strategy.type}>
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: strategy.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium text-gray-700 text-sm">
                        {strategy.name}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {strategy.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
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
          <h3 className="mb-3 font-medium text-gray-900 text-lg">集団平均</h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-lg bg-amber-50 p-3">
              <div className="font-medium text-amber-600 text-sm">協力率</div>
              <div className="font-bold text-amber-900 text-xl">
                {formatPercentage(statistics.average_cooperation_rate)}%
              </div>
            </div>
            <div className="rounded-lg bg-purple-50 p-3">
              <div className="font-medium text-purple-600 text-sm">移動性</div>
              <div className="font-bold text-purple-900 text-xl">
                {formatNumber(statistics.average_mobility)}
              </div>
            </div>
            <div className="rounded-lg bg-indigo-50 p-3">
              <div className="font-medium text-indigo-600 text-sm">平均スコア</div>
              <div className="font-bold text-indigo-900 text-xl">
                {formatNumber(statistics.average_score)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
