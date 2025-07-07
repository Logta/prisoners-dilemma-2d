# WASM API Documentation for prisoners_dilemma_2d

このドキュメントは、2D Prisoner's Dilemma シミュレーションの WASM API の使用方法について説明します。

## 概要

このWASMモジュールは、100×100グリッド上での囚人のジレンマシミュレーションのコア機能を提供します。Clean Architectureに基づいて設計されており、JavaScript/TypeScriptから型安全に利用できるAPIを提供しています。

## セットアップ

### 1. WASMモジュールのビルド

```bash
cd wasm
wasm-pack build --target web --out-dir pkg
```

### 2. JavaScriptでの初期化

```javascript
import init, { 
  WasmSimulation,
  set_panic_hook,
  greet
} from './pkg/prisoners_dilemma_2d.js';

// WASMモジュールの初期化（必須）
await init();

// パニックフックの設定（エラー表示の改善）
set_panic_hook();
```

## 主要クラス

### WasmSimulation

シミュレーション全体を管理するメインクラスです。

#### コンストラクタ
```javascript
// 新しいシミュレーションを作成
const simulation = new WasmSimulation(
  100,   // グリッド幅
  100,   // グリッド高さ
  1000   // エージェント数
);
```

#### メソッド

##### step(): WasmStatistics
1ステップ（1ターン）を実行します。隣接エージェント間の対戦と移動を処理し、100ターンごとに世代交代を行います。

```javascript
const stats = simulation.step();
console.log(`Generation: ${stats.generation}`);
console.log(`Total agents: ${stats.total_agents}`);
```

##### get_agents(): WasmAgent[]
現在のすべてのエージェント情報を取得します。

```javascript
const agents = simulation.get_agents();
agents.forEach(agent => {
  console.log(`Agent at (${agent.x}, ${agent.y}): strategy=${agent.strategy}, score=${agent.score}`);
});
```

##### get_statistics(): WasmStatistics
現在のシミュレーション統計を取得します。

```javascript
const stats = simulation.get_statistics();
console.log(`Average cooperation rate: ${stats.average_cooperation_rate}`);
console.log(`Average mobility: ${stats.average_mobility}`);
console.log(`Average score: ${stats.average_score}`);
```

##### get_grid_width(): number
グリッドの幅を取得します。

```javascript
const width = simulation.get_grid_width(); // 100
```

##### get_grid_height(): number
グリッドの高さを取得します。

```javascript
const height = simulation.get_grid_height(); // 100
```

##### get_generation(): number
現在の世代数を取得します。

```javascript
const generation = simulation.get_generation();
```

##### get_turn(): number
現在の世代内のターン数を取得します（0-99）。

```javascript
const turn = simulation.get_turn();
```

##### reset(agent_count: number): void
シミュレーションをリセットし、新しいエージェント数で再初期化します。

```javascript
simulation.reset(500); // 500エージェントでリセット
```

##### free(): void
WASMオブジェクトのメモリを解放します。

```javascript
simulation.free();
```

## データ型

### WasmAgent

エージェントの状態を表すオブジェクトです。

```typescript
interface WasmAgent {
  readonly id: string;           // エージェントのUUID
  readonly x: number;            // X座標 (0-99)
  readonly y: number;            // Y座標 (0-99)
  readonly strategy: number;     // 戦略タイプ (0-3)
  readonly mobility: number;     // 移動性 (0.0-1.0)
  readonly score: number;        // 累積スコア
  readonly cooperation_rate: number; // 協力率 (0.0-1.0)
}
```

#### 戦略タイプ
- `0`: AllCooperate（常に協力）
- `1`: AllDefect（常に裏切り）
- `2`: TitForTat（しっぺ返し）
- `3`: Pavlov（パブロフ戦略）

### WasmStatistics

シミュレーション統計を表すオブジェクトです。

```typescript
interface WasmStatistics {
  readonly generation: number;              // 現在の世代
  readonly total_agents: number;           // 総エージェント数
  readonly all_cooperate_count: number;    // 常協力戦略の個体数
  readonly all_defect_count: number;       // 常裏切戦略の個体数
  readonly tit_for_tat_count: number;      // しっぺ返し戦略の個体数
  readonly pavlov_count: number;           // パブロフ戦略の個体数
  readonly average_cooperation_rate: number; // 平均協力率
  readonly average_mobility: number;       // 平均移動性
  readonly average_score: number;          // 平均スコア
}
```

## 使用例

### 基本的な使用例

```javascript
import init, { WasmSimulation, set_panic_hook } from './pkg/prisoners_dilemma_2d.js';

async function runBasicSimulation() {
  // 初期化
  await init();
  set_panic_hook();

  // シミュレーション作成
  const simulation = new WasmSimulation(100, 100, 1000);

  // 10ステップ実行
  for (let i = 0; i < 10; i++) {
    const stats = simulation.step();
    console.log(`Step ${i + 1}: Generation ${stats.generation}, Agents: ${stats.total_agents}`);
  }

  // 統計情報表示
  const finalStats = simulation.get_statistics();
  console.log('Final Statistics:', finalStats);

  // エージェント情報の一部を表示
  const agents = simulation.get_agents();
  console.log(`First 5 agents:`, agents.slice(0, 5));

  // メモリ解放
  simulation.free();
}

runBasicSimulation().catch(console.error);
```

### React統合例

```typescript
import React, { useEffect, useState } from 'react';
import { useWasm } from './hooks/useWasm';
import { useSimulation } from './hooks/useSimulation';

export function SimulationComponent() {
  const { wasmModule, loading, error } = useWasm();
  const {
    isRunning,
    statistics,
    agents,
    start,
    pause,
    reset,
    step
  } = useSimulation({
    gridWidth: 100,
    gridHeight: 100,
    agentCount: 1000,
    speed: 100
  });

  if (loading) return <div>Loading WASM...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>2D Prisoner's Dilemma Simulation</h2>
      
      {/* 制御ボタン */}
      <div>
        <button onClick={start} disabled={isRunning}>Start</button>
        <button onClick={pause} disabled={!isRunning}>Pause</button>
        <button onClick={step} disabled={isRunning}>Step</button>
        <button onClick={() => reset()}>Reset</button>
      </div>

      {/* 統計情報 */}
      {statistics && (
        <div>
          <h3>Statistics</h3>
          <p>Generation: {statistics.generation}</p>
          <p>Total Agents: {statistics.total_agents}</p>
          <p>Average Cooperation: {(statistics.average_cooperation_rate * 100).toFixed(1)}%</p>
          <p>AllCooperate: {statistics.all_cooperate_count}</p>
          <p>AllDefect: {statistics.all_defect_count}</p>
          <p>TitForTat: {statistics.tit_for_tat_count}</p>
          <p>Pavlov: {statistics.pavlov_count}</p>
        </div>
      )}

      {/* エージェント数 */}
      <p>Active Agents: {agents.length}</p>
    </div>
  );
}
```

### カスタムフック例

```typescript
// hooks/useWasm.ts
import { useEffect, useState } from 'react';

export const useWasm = () => {
  const [wasmModule, setWasmModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        const wasmModule = await import('../assets/pkg/prisoners_dilemma_2d.js');
        await wasmModule.default();
        wasmModule.set_panic_hook();
        
        setWasmModule(wasmModule);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadWasm();
  }, []);

  return { wasmModule, loading, error };
};
```

## エラーハンドリング

WASMの関数は、エラーが発生した場合にJavaScript例外をスローします。

```javascript
try {
  const simulation = new WasmSimulation(100, 100, 20000); // エージェント数過多
} catch (error) {
  console.error('Simulation creation error:', error);
  // "Agent count exceeds grid capacity" など
}

try {
  const stats = simulation.step();
} catch (error) {
  console.error('Simulation step error:', error);
}
```

## メモリ管理

WASMオブジェクトは手動でメモリを解放する必要があります。

```javascript
// React useEffect での適切なクリーンアップ
useEffect(() => {
  let simulation = null;
  
  const initSimulation = async () => {
    await init();
    simulation = new WasmSimulation(100, 100, 1000);
  };
  
  initSimulation();
  
  // クリーンアップ関数
  return () => {
    if (simulation) {
      simulation.free();
    }
  };
}, []);
```

## パフォーマンスのヒント

### 1. 効率的なデータ取得
```javascript
// 良い例: 必要な時だけ統計を取得
const stats = simulation.step(); // step()が統計を返す

// 避けるべき: 毎回別途統計を取得
simulation.step();
const stats = simulation.get_statistics(); // 不要な呼び出し
```

### 2. バッチ処理
```javascript
// 良い例: 複数ステップをループで処理
for (let i = 0; i < 100; i++) {
  simulation.step();
}

// 良い例: 統計は最後にまとめて取得
const finalStats = simulation.get_statistics();
```

### 3. エージェント情報の効率的な使用
```javascript
// エージェント配列は大きいため、必要な時だけ取得
const agents = simulation.get_agents();

// フィルタリングやマッピングはJavaScript側で実行
const cooperativeAgents = agents.filter(agent => agent.cooperation_rate > 0.7);
```

## ベンチマーク

### 実行時間（リリースビルド）
- **1ステップ**: 約1-2ms（1000エージェント）
- **1世代（100ステップ）**: 約100-200ms
- **世代交代**: 約5-10ms

### メモリ使用量
- **WasmSimulation**: 約2-3MB
- **1000エージェント**: 約200KB
- **統計情報**: 約1KB

## トラブルシューティング

### 「wasm-pack build failed」エラー
```bash
# Rustツールチェーンの更新
rustup update

# wasm-packの再インストール
cargo install wasm-pack --force

# wasm32ターゲットの追加
rustup target add wasm32-unknown-unknown
```

### 「Module not found」エラー
```bash
# ビルドファイルの確認
ls wasm/pkg/

# ファイルのコピー確認
cp -r wasm/pkg/* web/src/assets/pkg/
```

### メモリリーク警告
```javascript
// 必ずfree()を呼ぶ
simulation.free();

// React での適切なクリーンアップ
useEffect(() => {
  return () => {
    simulation?.free();
  };
}, []);
```

### パフォーマンス問題
```javascript
// 頻繁なget_agents()呼び出しを避ける
// 必要な時だけ統計情報を取得
// ブラウザの開発者ツールでメモリ使用量を監視
```

## API変更履歴

### v0.1.0（現在）
- `WasmSimulation`クラスの実装
- 基本的なシミュレーション機能
- 統計情報取得API
- 型安全なTypeScriptバインディング

## 参考リンク

- [wasm-bindgen ドキュメント](https://rustwasm.github.io/docs/wasm-bindgen/)
- [wasm-pack ドキュメント](https://rustwasm.github.io/docs/wasm-pack/)
- [WebAssembly MDN](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [プロジェクトリポジトリ](https://github.com/your-username/2D-Prisoners-Dilemma)