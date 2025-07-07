# WASM シミュレーションエンジン

Rust で実装された2D Prisoner's Dilemma のシミュレーションエンジンです。WebAssembly としてコンパイルし、ブラウザで高速実行を実現します。

## アーキテクチャ

Clean Architecture の3層構造で実装：

### Domain Layer (`src/domain/`)
- **agent/**: エージェントエンティティ、戦略、移動ロジック
- **game/**: 囚人のジレンマの利得行列と対戦処理
- **grid/**: 100×100グリッドの管理とエージェント配置

### Application Layer (`src/application/`)
- **simulation/**: シミュレーション実行とターン管理
- **evolution/**: 遺伝的アルゴリズムによる世代交代

### Infrastructure Layer (`src/infrastructure/`)
- **wasm_bindings/**: JavaScript との型安全なインターフェース

## 主要機能

### エージェント
- **戦略**: AllCooperate, AllDefect, TitForTat, Pavlov
- **移動性**: 0.0〜1.0 の移動確率
- **履歴管理**: 直近10回の対戦結果を記録
- **適応的移動**: 戦績に応じて移動確率が変動

### シミュレーション
- **グリッドサイズ**: 100×100 固定
- **ターン制**: 各ターンで隣接エージェントと対戦・移動
- **世代交代**: 100ターンごとに遺伝的アルゴリズム実行

### 進化メカニズム
- **選択**: ルーレット選択（スコア比例確率）
- **交叉**: 戦略は片親継承、移動性は両親の平均
- **突然変異**: 5%確率で戦略変更・移動性±0.2変化

## API

### WasmSimulation
メインのシミュレーション制御クラス

```rust
// 作成
let simulation = WasmSimulation::new(100, 100, 1000);

// 1ステップ実行
let stats = simulation.step();

// エージェント一覧取得
let agents = simulation.get_agents();

// 統計情報取得
let stats = simulation.get_statistics();

// リセット
simulation.reset(1000);

// メモリ解放
simulation.free();
```

### WasmAgent
エージェント情報

```typescript
interface WasmAgent {
  id: string;           // UUID
  x: number;            // X座標
  y: number;            // Y座標  
  strategy: number;     // 戦略タイプ (0-3)
  mobility: number;     // 移動性 (0.0-1.0)
  score: number;        // 累積スコア
  cooperation_rate: number; // 協力率 (0.0-1.0)
}
```

### WasmStatistics
統計情報

```typescript
interface WasmStatistics {
  generation: number;              // 現在の世代
  total_agents: number;           // 総エージェント数
  all_cooperate_count: number;    // 常協力戦略の個体数
  all_defect_count: number;       // 常裏切戦略の個体数  
  tit_for_tat_count: number;      // しっぺ返し戦略の個体数
  pavlov_count: number;           // パブロフ戦略の個体数
  average_cooperation_rate: number; // 平均協力率
  average_mobility: number;       // 平均移動性
  average_score: number;          // 平均スコア
}
```

## ビルド

### 前提条件
- Rust 1.70+
- wasm-pack

### コマンド

```bash
# WASM ビルド
wasm-pack build --target web --out-dir pkg

# 開発ビルド（デバッグ情報付き）
wasm-pack build --target web --out-dir pkg --dev

# リリースビルド（最適化）
wasm-pack build --target web --out-dir pkg --release
```

### 出力ファイル
- `pkg/prisoners_dilemma_2d.js`: JavaScript バインディング
- `pkg/prisoners_dilemma_2d_bg.wasm`: WASM バイナリ
- `pkg/prisoners_dilemma_2d.d.ts`: TypeScript 型定義

## テスト

```bash
# 単体テスト
cargo test

# リント
cargo clippy

# フォーマット
cargo fmt
```

## パフォーマンス

- **1000エージェント**: 1ステップ約1-2ms（リリースビルド）
- **メモリ使用量**: 約2-3MB
- **並列処理**: 対戦・移動処理を並列化
- **最適化**: wasm-opt による追加最適化

## エラーハンドリング

WASM 境界でのエラーは JsValue として伝播されます：

```rust
// Rust側でのエラー
Err("Agent count exceeds grid capacity".to_string())

// JavaScript側での受け取り
try {
  simulation.reset(20000); // 過多なエージェント数
} catch (error) {
  console.error(error); // "Agent count exceeds grid capacity"
}
```

## 制限事項

- グリッドサイズは100×100固定
- 最大エージェント数は10,000（グリッドサイズによる制限）
- 戦略タイプは4種類固定
- シングルスレッド実行（Web Workers 未対応）