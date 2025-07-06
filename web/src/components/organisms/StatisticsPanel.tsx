import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { TrendingUp, TrendingDown, Minus, Download, BarChart3 } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';
import {
  statisticsAtom,
  generationHistoryAtom,
  selectedAgentAtom,
  currentGenerationAtom,
} from '../../store/atoms/simulation';
import {
  agentStatsByTypeAtom,
  simulationProgressAtom,
} from '../../store/atoms/derived';
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

  const getTrendIcon = (key: keyof Statistics) => {
    const trend = getTrend(key);
    if (trend === '↗') return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend === '↘') return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <div className={cn("space-y-4 p-4", className)} data-testid={testId}>
      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('current')}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'current' 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          現在の統計
        </button>
        {showHistory && (
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'history' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            履歴
          </button>
        )}
        {selectedAgent && (
          <button
            onClick={() => setActiveTab('agent')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'agent' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            エージェント
          </button>
        )}
      </div>

      {/* Current Statistics Tab */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          {/* Simulation Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                シミュレーション状況
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">世代</div>
                  <div className="text-2xl font-bold">{currentGeneration}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">進捗</div>
                  <div className="text-2xl font-bold">{formatPercent(progress / 100)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Population Statistics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>個体群統計</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">総個体数</span>
                  <span className="font-medium">{agentStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">平均スコア</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{formatNumber(statistics.average_score)}</span>
                    {getTrendIcon('average_score')}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">協力率</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{formatPercent(statistics.average_cooperation)}</span>
                    {getTrendIcon('average_cooperation')}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">総戦闘数</span>
                  <span className="font-medium">{statistics.total_battles}</span>
                </div>
              </div>
              
              {/* Export Button */}
              <div className="mt-4 pt-4 border-t">
                <Button 
                  onClick={exportStatistics}
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={generationHistory.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV出力
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* History and Agent tabs would go here */}
      {/* For now, keeping it simple with just the current tab */}
    </div>
  );
}