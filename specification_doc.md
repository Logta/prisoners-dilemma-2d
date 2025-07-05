# 2D Prisoner's Dilemma - 仕様書

## 1. 概要

二次元空間で囚人のジレンマゲームを実行し、遺伝的アルゴリズムによってエージェントの形質を進化させるシミュレーションアプリケーション。

## 2. 技術スタック

- Rust (ゲームロジック)
- WebAssembly
- React (UI)
- Vite (ビルドツール)
- Vitest (テストフレームワーク)
- Biome v2 (リンター/フォーマッター)

## 3. 開発方針

- t-wada が提唱する TDD を遵守
- テストが通るたびに git commit

## 4. 機能仕様

### 4.1 グリッド設定

- **サイズ**: 50x50 〜 1000x1000 (可変)
- **エージェント密度**: デフォルト 30% (可変)

### 4.2 エージェント仕様

#### 4.2.1 基本属性

- **協力傾向**: 0〜1.0 (cooperation_tendency)
- **攻撃性**: 0〜1.0 (aggression_level) - 戦略選択に影響
- **学習能力**: 0〜1.0 (learning_ability) - 戦略選択に影響
- **移動傾向**: 0〜1.0 (movement_tendency)
- **スコア**: 対戦結果の累積値
- **エネルギー**: 0〜100 (行動力)
- **年齢**: 生存ターン数
- **適応度**: 自然選択の指標

#### 4.2.2 移動

- **移動モード**: 固定/移動を切り替え可能
- **移動方法**: ランダム移動（将来的に戦略的移動を実装可能な設計）

#### 4.2.3 対戦

- **対戦範囲**: デフォルト隣接 8 マス、最大半径 5 マスまで可変  
- **戦略選択**: エージェントの遺伝的特性に基づく戦略選択
  - **Random**: 攻撃性 < 0.3
  - **TitForTat**: 攻撃性 0.3-0.7 かつ学習能力 > 0.5
  - **Pavlov**: 攻撃性 ≥ 0.7 かつ学習能力 > 0.4
- **対戦履歴**: 過去の対戦結果を記録し戦略決定に活用

### 4.3 囚人のジレンマ

#### 4.3.1 利得行列（デフォルト値）

|              | 相手が協力 | 相手が裏切り |
| ------------ | ---------- | ------------ |
| 自分が協力   | (3, 3)     | (0, 5)       |
| 自分が裏切り | (5, 0)     | (1, 1)       |

※ 利得行列は変更可能

### 4.4 遺伝的アルゴリズム

#### 4.4.1 進化する形質

- 協力傾向 (cooperation_tendency)
- 攻撃性 (aggression_level)  
- 学習能力 (learning_ability)
- 移動傾向 (movement_tendency)

#### 4.4.2 世代交代

- **タイミング**: 一定ターン経過後（ターン数は可変）
- **選択方法** (切り替え可能):
  - スコア上位 ○%選択
  - ルーレット選択
  - トーナメント選択

#### 4.4.3 交叉方法 (切り替え可能)

- 一点交叉
- 二点交叉
- 一様交叉

#### 4.4.4 突然変異

- **突然変異率**: 可変

### 4.5 可視化

#### 4.5.1 エージェント表示

- **色**: 協力確率に応じて色分け
- **サイズ**: スコアに応じて変化

#### 4.5.2 統計情報表示

- 平均協力率
- 最大協力率
- 最低協力率
- 協力率の標準偏差
- 平均スコア
- 最大スコア
- 最低スコア
- スコアの標準偏差
- 世代数

#### 4.5.3 グラフ表示

- 統計情報の履歴をポップアップでグラフ表示

### 4.6 その他の機能

- **実行速度調整**: シミュレーション速度を調整可能
- **プリセット機能**: 設定の保存・読み込み
- **エクスポート機能**: 結果を CSV ファイルで出力

## 5. UI 構成

### 5.1 メイン画面

- グリッド表示エリア
- コントロールパネル
  - 開始/停止/リセットボタン
  - 速度調整スライダー
- 統計情報パネル
- パラメータ設定パネル

### 5.2 設定可能パラメータ

- グリッドサイズ
- エージェント密度
- 移動モード（固定/移動）
- 対戦範囲
- 対戦方式
- 利得行列
- 世代交代ターン数
- 選択方法
- 交叉方法
- 突然変異率

## 6. データ構造（Clean Architecture）

### 6.1 Domain Layer

#### Agent Entity
```rust
pub struct Agent {
    id: AgentId,
    position: Position,
    traits: AgentTraits,
    state: AgentState,
}

pub struct AgentTraits {
    cooperation_tendency: f64,
    aggression_level: f64,
    learning_ability: f64,
    movement_tendency: f64,
}
```

#### World Entity
```rust
pub struct World {
    id: SimulationId,
    grid: Grid,
    config: SimulationConfig,
    generation: u32,
}

pub struct Grid {
    size: WorldSize,
    agents: HashMap<Position, AgentId>,
}
```

#### Simulation Config
```rust
pub struct SimulationConfig {
    world_size: WorldSize,
    initial_population: usize,
    max_generations: u32,
    battles_per_generation: u32,
    neighbor_radius: u32,
    evolution_config: EvolutionConfig,
}
```

### 6.2 Application Layer

#### Use Cases
```rust
pub struct SimulationUseCase;
pub struct BattleUseCase;
pub struct EvolutionUseCase;
```

### 6.3 Infrastructure Layer

#### WASM Bindings
```rust
#[wasm_bindgen]
pub struct WasmSimulationManager;

#[wasm_bindgen]
pub struct WasmBattleManager;
```

## 7. 開発ステップ（TDD）

### Phase 1: 基本構造

1. Agent の基本構造とテスト
2. Grid の初期化とエージェント配置のテスト
3. 囚人のジレンマの利得計算テスト

### Phase 2: ゲームロジック

1. 対戦相手の検索ロジックとテスト
2. 対戦実行とスコア更新のテスト
3. エージェント移動のテスト

### Phase 3: 遺伝的アルゴリズム

1. 選択アルゴリズムのテスト
2. 交叉アルゴリズムのテスト
3. 突然変異のテスト
4. 世代交代のテスト

### Phase 4: WASM 統合

1. Rust → WASM ビルド設定
2. JavaScript/TypeScript バインディング
3. React との統合テスト

### Phase 5: UI 実装

1. グリッド表示コンポーネント
2. コントロールパネル
3. 統計情報表示
4. グラフ表示機能

### Phase 6: Clean Architecture 実装

1. Domain Layer の設計と実装
2. Application Layer のユースケース実装
3. Infrastructure Layer の WASM/シリアライゼーション実装
4. 戦略パターン（Random, TitForTat, Pavlov）の実装
5. 包括的なテストスイート（158テストケース）

### Phase 6: 追加機能

1. プリセット保存/読み込み
2. CSV エクスポート
3. パフォーマンス最適化
