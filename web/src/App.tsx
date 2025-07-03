import { createSignal, createEffect, onCleanup } from 'solid-js';
import { SimulationEngine } from '../../pkg/prisoners_dilemma_2d';
import ControlPanel from './components/ControlPanel';
import GridVisualization from './components/GridVisualization';
import StatisticsPanel from './components/StatisticsPanel';
import type { AgentData, Statistics, GridSize } from './types';
import './App.css';

export default function App() {
  // シミュレーション状態
  const [engine, setEngine] = createSignal<SimulationEngine | null>(null);
  const [isRunning, setIsRunning] = createSignal(false);
  const [animationId, setAnimationId] = createSignal<number | null>(null);
  
  // シミュレーションパラメータ
  const [gridSize, setGridSize] = createSignal<GridSize>({ height: 100, width: 100 });
  const [agentDensity, setAgentDensity] = createSignal(0.3);
  const [battleRadius, setBattleRadius] = createSignal(2);
  const [speed, setSpeed] = createSignal(100); // ms per generation

  // 遺伝的アルゴリズムパラメータ
  const [selectionMethod, setSelectionMethod] = createSignal('top_percent');
  const [selectionParam, setSelectionParam] = createSignal(0.5);
  const [crossoverMethod, setCrossoverMethod] = createSignal('one_point');
  const [crossoverParam, setCrossoverParam] = createSignal(0.5);
  const [mutationRate, setMutationRate] = createSignal(0.1);
  const [mutationStrength, setMutationStrength] = createSignal(0.05);

  // 統計データ
  const [agentData, setAgentData] = createSignal<AgentData[]>([]);
  const [statistics, setStatistics] = createSignal<Statistics>({
    generation: 0,
    population: 0,
    avg_cooperation: 0,
    avg_movement: 0,
    avg_score: 0,
  });

  // シミュレーションエンジンを初期化
  createEffect(() => {
    const size = gridSize();
    const newEngine = new SimulationEngine(size.width, size.height);
    newEngine.populate_agents(agentDensity());
    setEngine(newEngine);
    updateData(newEngine);
  });

  // データ更新関数
  const updateData = (engine: SimulationEngine) => {
    setAgentData(Array.from(engine.get_agent_data()));
    setStatistics(engine.get_statistics());
  };

  // シミュレーションループ
  const runSimulation = () => {
    const currentEngine = engine();
    if (!currentEngine || !isRunning()) return;

    // 1世代実行
    currentEngine.run_generation(battleRadius());
    
    // 進化処理（10世代ごと）
    const generation = currentEngine.get_generation();
    if (generation % 10 === 0) {
      currentEngine.evolve_population(
        selectionMethod(),
        selectionParam(),
        crossoverMethod(),
        crossoverParam(),
        mutationRate(),
        mutationStrength()
      );
    }

    updateData(currentEngine);

    // 次のフレームをスケジュール
    const id = setTimeout(() => {
      requestAnimationFrame(runSimulation);
    }, speed());
    setAnimationId(id);
  };

  // シミュレーション開始/停止
  const toggleSimulation = () => {
    if (isRunning()) {
      setIsRunning(false);
      const id = animationId();
      if (id !== null) {
        clearTimeout(id);
        setAnimationId(null);
      }
    } else {
      setIsRunning(true);
      runSimulation();
    }
  };

  // リセット
  const resetSimulation = () => {
    setIsRunning(false);
    const id = animationId();
    if (id !== null) {
      clearTimeout(id);
      setAnimationId(null);
    }
    
    const currentEngine = engine();
    if (currentEngine) {
      currentEngine.reset();
      currentEngine.populate_agents(agentDensity());
      updateData(currentEngine);
    }
  };

  // クリーンアップ
  onCleanup(() => {
    const id = animationId();
    if (id !== null) {
      clearTimeout(id);
    }
  });

  return (
    <div class="app">
      <div class="main-content">
        <GridVisualization
          agents={agentData()}
          gridSize={gridSize()}
        />
        <div class="side-panel">
          <ControlPanel
            isRunning={isRunning()}
            onToggle={toggleSimulation}
            onReset={resetSimulation}
            gridSize={gridSize()}
            setGridSize={setGridSize}
            agentDensity={agentDensity()}
            setAgentDensity={setAgentDensity}
            battleRadius={battleRadius()}
            setBattleRadius={setBattleRadius}
            speed={speed()}
            setSpeed={setSpeed}
            selectionMethod={selectionMethod()}
            setSelectionMethod={setSelectionMethod}
            selectionParam={selectionParam()}
            setSelectionParam={setSelectionParam}
            crossoverMethod={crossoverMethod()}
            setCrossoverMethod={setCrossoverMethod}
            crossoverParam={crossoverParam()}
            setCrossoverParam={setCrossoverParam}
            mutationRate={mutationRate()}
            setMutationRate={setMutationRate}
            mutationStrength={mutationStrength()}
            setMutationStrength={setMutationStrength}
          />
          <StatisticsPanel
            statistics={statistics()}
            agents={agentData()}
          />
        </div>
      </div>
    </div>
  );
}