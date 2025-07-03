import { useCallback, useEffect, useRef, useState } from 'react';
import { SimulationEngine } from '../../../pkg/prisoners_dilemma_2d';
import ControlPanel from '../components/ControlPanel';
import GraphPopup from '../components/GraphPopup';
import GridVisualization from '../components/GridVisualization';
import StatisticsPanel from '../components/StatisticsPanel';
import type { AgentData, GridSize, Statistics } from '../types';
import '../App.css';

export default function Index() {
  // シミュレーション状態
  const [engine, setEngine] = useState<SimulationEngine | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const animationIdRef = useRef<number | null>(null);

  // シミュレーションパラメータ
  const [gridSize, setGridSize] = useState<GridSize>({ height: 100, width: 100 });
  const [agentDensity, setAgentDensity] = useState(0.3);
  const [battleRadius, setBattleRadius] = useState(2);
  const [speed, setSpeed] = useState(100); // ms per generation

  // 遺伝的アルゴリズムパラメータ
  const [selectionMethod, setSelectionMethod] = useState('top_percent');
  const [selectionParam, setSelectionParam] = useState(0.5);
  const [crossoverMethod, setCrossoverMethod] = useState('one_point');
  const [crossoverParam, setCrossoverParam] = useState(0.5);
  const [mutationRate, setMutationRate] = useState(0.1);
  const [mutationStrength, setMutationStrength] = useState(0.05);

  // 統計データ
  const [agentData, setAgentData] = useState<AgentData[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    avg_cooperation: 0,
    avg_movement: 0,
    avg_score: 0,
    generation: 0,
    population: 0,
  });
  const [historyData, setHistoryData] = useState<Statistics[]>([]);
  const [showGraph, setShowGraph] = useState(false);

  // データ更新関数
  const updateData = useCallback((engine: SimulationEngine) => {
    setAgentData(Array.from(engine.get_agent_data()));
    const newStats = engine.get_statistics() as Statistics;
    setStatistics(newStats);

    // 履歴データに追加（10世代ごと、または最初の統計）
    if (newStats.generation === 0 || newStats.generation % 10 === 0) {
      setHistoryData((prev) => {
        // 同じ世代のデータが既にある場合は更新、ない場合は追加
        const existingIndex = prev.findIndex((stat) => stat.generation === newStats.generation);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newStats;
          return updated;
        } else {
          return [...prev, newStats];
        }
      });
    }
  }, []);

  // シミュレーションエンジンを初期化（グリッドサイズまたは密度変更時のみ）
  useEffect(() => {
    if (isRunning) return; // 実行中は再初期化しない

    const newEngine = new SimulationEngine(gridSize.width, gridSize.height);
    newEngine.populate_agents(agentDensity);
    setEngine(newEngine);
    updateData(newEngine);
  }, [gridSize, agentDensity, isRunning, updateData]);

  // シミュレーションループ
  const runSimulation = useCallback(() => {
    if (!engine || !isRunning) return;

    // 1世代実行
    engine.run_generation(battleRadius);

    // 進化処理（10世代ごと）
    const generation = engine.get_generation();
    if (generation % 10 === 0) {
      engine.evolve_population(
        selectionMethod,
        selectionParam,
        crossoverMethod,
        crossoverParam,
        mutationRate,
        mutationStrength
      );
    }

    updateData(engine);

    // 次のフレームをスケジュール
    const id = window.setTimeout(() => {
      window.requestAnimationFrame(runSimulation);
    }, speed);
    animationIdRef.current = id as unknown as number;
  }, [
    engine,
    isRunning,
    battleRadius,
    selectionMethod,
    selectionParam,
    crossoverMethod,
    crossoverParam,
    mutationRate,
    mutationStrength,
    speed,
    updateData,
  ]);

  // シミュレーション開始/停止
  const toggleSimulation = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      if (animationIdRef.current !== null) {
        window.clearTimeout(animationIdRef.current);
        animationIdRef.current = null;
      }
    } else {
      setIsRunning(true);
    }
  }, [isRunning]);

  // リセット
  const resetSimulation = useCallback(() => {
    setIsRunning(false);
    if (animationIdRef.current !== null) {
      window.clearTimeout(animationIdRef.current);
      animationIdRef.current = null;
    }

    if (engine) {
      engine.reset();
      engine.populate_agents(agentDensity);
      updateData(engine);
    }

    // 履歴データもリセット
    setHistoryData([]);
  }, [engine, agentDensity, updateData]);

  // シミュレーション開始時の処理
  useEffect(() => {
    if (isRunning) {
      runSimulation();
    }
  }, [isRunning, runSimulation]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationIdRef.current !== null) {
        clearTimeout(animationIdRef.current);
      }
    };
  }, []);

  return (
    <div className="app">
      <div className="main-content">
        <GridVisualization agents={agentData} gridSize={gridSize} />
        <div className="side-panel">
          <ControlPanel
            agentDensity={agentDensity}
            agents={agentData}
            battleRadius={battleRadius}
            crossoverMethod={crossoverMethod}
            crossoverParam={crossoverParam}
            gridSize={gridSize}
            historyData={historyData}
            isRunning={isRunning}
            mutationRate={mutationRate}
            mutationStrength={mutationStrength}
            onReset={resetSimulation}
            onToggle={toggleSimulation}
            selectionMethod={selectionMethod}
            selectionParam={selectionParam}
            setAgentDensity={setAgentDensity}
            setBattleRadius={setBattleRadius}
            setCrossoverMethod={setCrossoverMethod}
            setCrossoverParam={setCrossoverParam}
            setGridSize={setGridSize}
            setMutationRate={setMutationRate}
            setMutationStrength={setMutationStrength}
            setSelectionMethod={setSelectionMethod}
            setSelectionParam={setSelectionParam}
            setSpeed={setSpeed}
            speed={speed}
            statistics={statistics}
          />
          <StatisticsPanel
            agents={agentData}
            onShowGraph={() => setShowGraph(true)}
            statistics={statistics}
          />
        </div>
      </div>
      <GraphPopup
        historyData={historyData}
        isOpen={showGraph}
        onClose={() => setShowGraph(false)}
      />
    </div>
  );
}
