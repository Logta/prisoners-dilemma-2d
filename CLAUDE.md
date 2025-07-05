# CLAUDE.md

## プロジェクト概要

このプロジェクトは「2D Prisoner's Dilemma」という、二次元空間で囚人のジレンマゲームを実行し、遺伝的アルゴリズムによってエージェントの形質を進化させるシミュレーションアプリケーションです。

## 技術スタック

- **Rust**: ゲームロジックの実装
- **WebAssembly**: Rust コードを Web ブラウザで実行
- **React**: UI ライブラリ
- **Vite**: ビルドツール
- **Vitest**: Vite ベースのテストフレームワーク
- **Biome v2**: 高速なリンター/フォーマッター

## 開発方針

### TDD (テスト駆動開発)

- t-wada が提唱する TDD の原則を厳守します
- Red → Green → Refactor のサイクルを回します
- 各テストが通るたびに必ず git commit を行います
- テストファースト：実装前に必ずテストを書きます

### コミットルール

- テストが通るたびに即座にコミット
- コミットメッセージは変更内容を簡潔に表現
- 例: `test: Add Agent struct creation test`, `feat: Implement Agent struct`

## アーキテクチャ

### Clean Architecture 構成

プロジェクトは Clean Architecture の原則に従って、以下の3層で構成されています：

#### Domain Layer (ドメイン層)
- **Entity**: Agent, World, Grid 等の主要エンティティ
- **Value Object**: AgentId, Position, AgentTraits 等の値オブジェクト
- **Service**: BattleService, EvolutionService 等のドメインサービス
- **Repository Trait**: データ永続化の抽象化

#### Application Layer (アプリケーション層)  
- **Use Case**: SimulationUseCase, BattleUseCase, EvolutionUseCase
- **Command/Query**: 操作要求とデータ取得の定義
- **Result**: ユースケース実行結果の型定義

#### Infrastructure Layer (インフラストラクチャ層)
- **WASM Bindings**: JavaScript との連携機能
- **Serialization**: JSON/CSV/バイナリ形式での入出力
- **Persistence**: プリセット管理・データエクスポート

### React フロントエンド

- UI コンポーネント（React hooks ベース）
- グリッドの可視化
- ユーザーインタラクション
- 統計情報の表示
- レスポンシブデザイン対応

### データフロー

1. React UI → WASM Bindings → Application Layer → Domain Layer
2. Domain Layer での計算処理
3. Infrastructure Layer でのシリアライゼーション
4. WASM Bindings → React UI への結果返却

## 主要機能

### シミュレーション機能

- 50x50〜1000x1000 の可変グリッドサイズ
- エージェントの4つの形質（協力傾向、攻撃性、学習能力、移動性）の進化
- 戦略パターン（Random、TitForTat、Pavlov）による囚人のジレンマ対戦
- 遺伝的アルゴリズムによる世代交代（3種類の選択・交叉アルゴリズム）

### 可視化機能

- エージェントの協力確率による色分け表示
- スコアによるサイズ変更
- リアルタイムな統計情報表示
- 履歴グラフのポップアップ表示

### 設定機能

- 全パラメータの動的な変更
- プリセットの保存/読み込み
- シミュレーション結果の CSV エクスポート

## 開発フェーズ

### Phase 1: 基本構造 (Rust)

- [x] Agent の基本構造実装
- [x] Grid の初期化とエージェント配置
- [x] 囚人のジレンマの利得計算

### Phase 2: ゲームロジック (Rust)

- [x] 対戦相手の検索ロジック
- [x] 対戦実行とスコア更新
- [x] エージェント移動

### Phase 3: 遺伝的アルゴリズム (Rust)

- [x] 選択アルゴリズム（3 種類）
- [x] 交叉アルゴリズム（3 種類）
- [x] 突然変異
- [x] 世代交代

### Phase 4: WASM 統合

- [x] wasm-bindgen 設定
- [x] TypeScript 型定義
- [x] React との統合

### Phase 5: UI 実装 (React)

- [x] グリッド表示コンポーネント
- [x] コントロールパネル
- [x] 統計情報表示
- [x] グラフ表示機能

### Phase 6: Clean Architecture 移行

- [x] Domain Layer の実装（エンティティ、値オブジェクト、サービス）
- [x] Application Layer の実装（ユースケース、コマンド、結果型）
- [x] Infrastructure Layer の実装（WASM、シリアライゼーション、永続化）
- [x] 戦略パターンの実装（Random、TitForTat、Pavlov）
- [x] プリセット機能とCSVエクスポート機能
- [x] 158のテストケースによる品質保証
- [ ] パフォーマンス最適化

## テスト戦略

### Rust テスト

```rust
// 単体テスト例
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_creation() {
        // Red: テストを書く
        // Green: 最小限の実装
        // Refactor: コードを改善
    }
}
```

### React テスト

```typescript
// Vitestを使用したコンポーネントテスト
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
```

## 開発環境セットアップ

### mise を使用した環境構築

```bash
# miseのインストール (まだの場合)
curl https://mise.run | sh

# プロジェクトディレクトリで必要なツールをインストール
mise install

# 環境をアクティベート
mise use
```

### .mise.toml の内容

```toml
[tools]
node = "24"
rust = "latest"
bun = "latest"  # 高速なパッケージマネージャーとして使用

[env]
RUST_LOG = "debug"

[tasks.setup]
description = "開発環境の初期セットアップ"
run = [
  "cargo install wasm-pack",
  "cargo install cargo-watch",
  "bun install",
  "bun run biome:init"
]

[tasks.test]
description = "全てのテストを実行"
run = [
  "cargo test",
  "bun test"
]

[tasks.dev]
description = "Vite開発サーバーを起動"
run = "bun run dev"

[tasks.build-wasm]
description = "WASMをビルド"
run = "wasm-pack build --target web --out-dir pkg"

[tasks.watch]
description = "ファイル変更を監視してテストを実行"
run = "cargo watch -x test"
```

## ビルドコマンド

```bash
# 開発環境セットアップ（初回のみ）
mise run setup

# Rustのテスト実行（TDD用）
mise run test
# または監視モードで
mise run watch

# WASMビルド
mise run build-wasm

# Vite開発サーバー
mise run dev

# 全テスト実行
mise run test

# 個別実行
cargo test          # Rustテストのみ
bun test           # Vitestテストのみ
```

## コーディング規約

### Rust

- 変数名は snake_case
- 構造体名は PascalCase
- 定数は UPPER_SNAKE_CASE
- `cargo fmt`と`cargo clippy`を使用

### TypeScript/JavaScript

- 変数名は camelCase
- コンポーネント名は PascalCase
- Biome v2 の設定に従う

## パフォーマンス考慮事項

- 大規模グリッド（1000x1000）でも 60FPS を維持
- WASM と JavaScript 間のデータ転送を最小化
- 必要に応じて Web Workers を使用
- メモリ効率的なデータ構造の選択

## プロジェクト構造

```
2d-prisoners-dilemma/
├── .mise.toml              # mise設定ファイル
├── Cargo.toml              # Rustプロジェクト設定
├── package.json            # Node.jsプロジェクト設定
├── biome.jsonc             # Biome設定
├── vite.config.ts          # Vite設定
├── vitest.config.ts        # Vitest設定
├── src/
│   ├── lib.rs              # Rust WASMエントリーポイント
│   ├── domain/             # ドメイン層
│   │   ├── shared/         # 共有値オブジェクト
│   │   │   ├── id.rs       # AgentId, SimulationId
│   │   │   └── mod.rs
│   │   ├── world/          # ワールド関連
│   │   │   ├── entity.rs   # World, Grid エンティティ
│   │   │   ├── value.rs    # WorldSize, Position
│   │   │   └── mod.rs
│   │   ├── agent/          # エージェント関連
│   │   │   ├── entity.rs   # Agent エンティティ
│   │   │   ├── value.rs    # AgentTraits, AgentState
│   │   │   └── mod.rs
│   │   ├── battle/         # 戦闘関連
│   │   │   ├── service.rs  # BattleService, 戦略パターン
│   │   │   ├── value.rs    # PayoffMatrix, BattleConfig
│   │   │   └── mod.rs
│   │   ├── evolution/      # 進化関連
│   │   │   ├── service.rs  # EvolutionService
│   │   │   ├── value.rs    # EvolutionConfig, SelectionMethod
│   │   │   └── mod.rs
│   │   ├── simulation/     # シミュレーション関連
│   │   │   ├── aggregate.rs # Simulation アグリゲート
│   │   │   ├── value.rs    # SimulationConfig, SimulationStats
│   │   │   └── mod.rs
│   │   └── mod.rs
│   ├── application/        # アプリケーション層
│   │   ├── simulation.rs   # SimulationUseCase
│   │   ├── battle.rs       # BattleUseCase
│   │   ├── evolution.rs    # EvolutionUseCase
│   │   └── mod.rs
│   ├── infrastructure/     # インフラストラクチャ層
│   │   ├── wasm.rs         # WASM バインディング
│   │   ├── serialization.rs # シリアライゼーション
│   │   ├── persistence.rs  # 永続化・エクスポート
│   │   └── mod.rs
├── pkg/                    # WASMビルド出力 (自動生成)
├── web/                    # Reactフロントエンド
│   ├── index.html
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── GridVisualization.tsx
│   │   │   ├── StatisticsPanel.tsx
│   │   │   ├── GraphPopup.tsx
│   │   │   ├── PresetManager.tsx
│   │   │   └── CSVExporter.tsx
│   │   ├── types.ts
│   │   └── routes/
│   └── tests/
├── specification_doc.md    # 仕様書
└── CLAUDE.md               # このファイル
```
