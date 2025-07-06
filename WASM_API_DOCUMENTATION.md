# WASM API Documentation for prisoners_dilemma_2d_bg.wasm

このドキュメントは、`pkg/prisoners_dilemma_2d_bg.wasm` モジュールの使用方法について説明します。

## 概要

このWASMモジュールは、2D囚人のジレンマシミュレーションのコア機能を提供します。Clean Architectureに基づいて設計されており、JavaScript/TypeScriptから簡単に利用できるAPIを提供しています。

## セットアップ

### 1. WASMモジュールのビルド

```bash
wasm-pack build --target web --out-dir pkg
```

### 2. JavaScriptでの初期化

```javascript
import init, { 
  WasmSimulationManager, 
  WasmSimulationConfig,
  WasmBattleManager,
  create_standard_config 
} from './pkg/prisoners_dilemma_2d.js';

// WASMモジュールの初期化（必須）
await init();
```

## 主要クラス

### WasmSimulationManager

シミュレーション全体を管理するメインクラスです。

#### コンストラクタ
```javascript
const manager = new WasmSimulationManager();
```

#### メソッド

##### initialize(config: WasmSimulationConfig): string
シミュレーションを初期化します。
```javascript
const config = new WasmSimulationConfig(50, 50, 100, 1000, 100, 2, 0.1, 0.05, 0.1, "Tournament", "Uniform");
const result = manager.initialize(config);
const initData = JSON.parse(result);
```

##### run_simulation(config: WasmSimulationConfig, generations: number): string
指定した世代数だけシミュレーションを実行します。
```javascript
const result = manager.run_simulation(config, 10);
const runData = JSON.parse(result);
```

##### step(): string
1ステップ（1回の戦闘）を実行します。
```javascript
const result = manager.step();
const stepData = JSON.parse(result);
```

##### run_generation(): string
1世代を完全に実行します（戦闘、移動、進化を含む）。
```javascript
const result = manager.run_generation();
const generationData = JSON.parse(result);
```

##### get_current_stats(): string
現在のシミュレーション統計を取得します。
```javascript
const stats = JSON.parse(manager.get_current_stats());
console.log(stats);
// {
//   current_generation: 10,
//   total_agents: 95,
//   average_cooperation_probability: 0.65,
//   average_score: 120.5,
//   cooperators: 60,
//   defectors: 35
// }
```

##### get_current_agents(): string
全エージェントの情報を取得します。
```javascript
const agents = JSON.parse(manager.get_current_agents());
// エージェントの配列が返される
```

##### get_agent_at(x: number, y: number): string | undefined
指定位置のエージェントを取得します。
```javascript
const agent = manager.get_agent_at(10, 20);
if (agent) {
  const agentData = JSON.parse(agent);
}
```

##### is_finished(): boolean
シミュレーションが終了したかチェックします。
```javascript
if (manager.is_finished()) {
  console.log("Simulation completed");
}
```

##### reset()
シミュレーションをリセットします。
```javascript
manager.reset();
```

### WasmSimulationConfig

シミュレーションの設定を管理するクラスです。

#### コンストラクタ
```javascript
const config = new WasmSimulationConfig(
  world_width,           // ワールドの幅
  world_height,          // ワールドの高さ
  initial_population,    // 初期人口
  max_generations,       // 最大世代数
  battles_per_generation,// 世代あたりの戦闘回数
  neighbor_radius,       // 近隣探索半径
  mutation_rate,         // 突然変異率 (0.0-1.0)
  mutation_strength,     // 突然変異の強度 (0.0-1.0)
  elite_ratio,          // エリート保存率 (0.0-1.0)
  selection_method,      // 選択方法 ("Tournament", "Roulette", "Rank")
  crossover_method       // 交叉方法 ("Uniform", "OnePoint", "TwoPoint")
);
```

#### プロパティ（ゲッター）
```javascript
config.world_width         // number
config.world_height        // number
config.initial_population  // number
config.max_generations     // number
config.battles_per_generation // number
config.neighbor_radius     // number
config.mutation_rate       // number
config.mutation_strength   // number
config.elite_ratio        // number
config.selection_method    // string
config.crossover_method    // string
```

#### セッター
```javascript
config.set_selection_method("Roulette");
config.set_crossover_method("TwoPoint");
```

### WasmBattleManager

個別の戦闘を管理するクラスです。

#### コンストラクタ
```javascript
// デフォルトの利得行列で作成
const battleManager = new WasmBattleManager();

// カスタム利得行列で作成
const battleManager = WasmBattleManager.with_payoff_matrix(
  3,  // 相互協力の利得
  1,  // 相互裏切りの利得
  0,  // 協力して搾取された場合の利得
  5   // 裏切って搾取した場合の利得
);
```

#### メソッド

##### execute_battle(agent1_id: bigint, agent2_id: bigint, agents_json: string): string
2つのエージェント間で戦闘を実行します。
```javascript
const agents = manager.get_current_agents();
const battleResult = battleManager.execute_battle(1n, 2n, agents);
const result = JSON.parse(battleResult);
```

##### get_battle_history(agent_id: bigint, opponent_id?: bigint, limit?: number): string
戦闘履歴を取得します。
```javascript
const history = JSON.parse(battleManager.get_battle_history(1n, 2n, 10));
```

##### current_round(): number
現在のラウンド数を取得します。
```javascript
const round = battleManager.current_round();
```

##### advance_round()
次のラウンドに進みます。
```javascript
battleManager.advance_round();
```

##### clear_history()
戦闘履歴をクリアします。
```javascript
battleManager.clear_history();
```

## ユーティリティ関数

### create_standard_config(): WasmSimulationConfig
標準的な設定でConfigオブジェクトを作成します。
```javascript
const config = create_standard_config();
// デフォルト値:
// - ワールドサイズ: 50x50
// - 初期人口: 100
// - 最大世代数: 1000
// - 選択方法: Tournament
// - 交叉方法: Uniform
```

## 完全な使用例

```javascript
import init, { 
  WasmSimulationManager, 
  WasmSimulationConfig,
  create_standard_config 
} from './pkg/prisoners_dilemma_2d.js';

async function runSimulation() {
  // WASMモジュールの初期化
  await init();

  // 設定の作成
  const config = new WasmSimulationConfig(
    100, 100,    // 100x100のワールド
    500,         // 初期人口500
    100,         // 最大100世代
    200,         // 世代あたり200回の戦闘
    3,           // 半径3の近隣探索
    0.1,         // 10%の突然変異率
    0.05,        // 5%の突然変異強度
    0.15,        // 15%のエリート保存
    "Tournament", // トーナメント選択
    "Uniform"     // 一様交叉
  );

  // マネージャーの作成と初期化
  const manager = new WasmSimulationManager();
  const initResult = JSON.parse(manager.initialize(config));
  console.log(`Initial population: ${initResult.initial_population}`);

  // 10世代実行
  const runResult = JSON.parse(manager.run_simulation(config, 10));
  console.log(`Generations run: ${runResult.generations_run}`);

  // 現在の統計を取得
  const stats = JSON.parse(manager.get_current_stats());
  console.log(`Average cooperation: ${stats.average_cooperation_probability}`);

  // 特定位置のエージェントを確認
  const agent = manager.get_agent_at(50, 50);
  if (agent) {
    const agentData = JSON.parse(agent);
    console.log(`Agent at (50,50):`, agentData);
  }

  // メモリクリーンアップ
  manager.free();
  config.free();
}

runSimulation().catch(console.error);
```

## React統合例

```typescript
import { useEffect, useState } from 'react';
import init, { WasmSimulationManager, WasmSimulationConfig } from '../pkg/prisoners_dilemma_2d';

export function useSimulation() {
  const [manager, setManager] = useState<WasmSimulationManager | null>(null);
  const [config, setConfig] = useState<WasmSimulationConfig | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mgr: WasmSimulationManager | null = null;
    let cfg: WasmSimulationConfig | null = null;

    const initialize = async () => {
      await init();
      
      cfg = new WasmSimulationConfig(
        50, 50, 100, 1000, 100, 2, 0.1, 0.05, 0.1,
        "Tournament", "Uniform"
      );
      
      mgr = new WasmSimulationManager();
      mgr.initialize(cfg);
      
      setManager(mgr);
      setConfig(cfg);
      setIsInitialized(true);
    };

    initialize();

    // クリーンアップ
    return () => {
      mgr?.free();
      cfg?.free();
    };
  }, []);

  return { manager, config, isInitialized };
}
```

## エラーハンドリング

WASMの関数は、エラーが発生した場合にJavaScript例外をスローします。

```javascript
try {
  const result = manager.run_simulation(config, 1000);
  const data = JSON.parse(result);
} catch (error) {
  console.error('Simulation error:', error);
  // エラーメッセージは文字列として渡される
}
```

## メモリ管理

WASMオブジェクトは手動でメモリを解放する必要があります。

```javascript
// 使用後は必ずfree()を呼ぶ
manager.free();
config.free();
battleManager.free();
```

## パフォーマンスのヒント

1. **バッチ処理**: 複数のステップを実行する場合は、`step()`を繰り返すより`run_generation()`や`run_simulation()`を使用する。

2. **メモリ管理**: 不要になったオブジェクトは速やかに`free()`を呼んで解放する。

3. **データ転送**: JSON文字列のパース/シリアライズはコストがかかるため、必要な時だけデータを取得する。

4. **設定の再利用**: `WasmSimulationConfig`オブジェクトは再利用可能。

## トラブルシューティング

### 「wasm-pack build failed」エラー
- Rustツールチェーンが最新か確認: `rustup update`
- wasm-packが最新か確認: `cargo install wasm-pack --force`

### 「Module not found」エラー
- ビルドが成功しているか確認: `ls pkg/`
- インポートパスが正しいか確認

### メモリリークの警告
- すべてのWASMオブジェクトで`free()`を呼んでいるか確認
- React使用時は、useEffectのクリーンアップ関数で解放しているか確認

## 参考リンク

- [wasm-bindgen ドキュメント](https://rustwasm.github.io/docs/wasm-bindgen/)
- [wasm-pack ドキュメント](https://rustwasm.github.io/docs/wasm-pack/)
- [プロジェクトのソースコード](https://github.com/your-repo/2d-prisoners-dilemma)