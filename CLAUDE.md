# CLAUDE.md

## プロジェクト概要

このプロジェクトは「2D Prisoner's Dilemma」という、二次元空間で囚人のジレンマゲームを実行し、遺伝的アルゴリズムによってエージェントの形質を進化させるシミュレーションアプリケーションです。

## 技術スタック

- **Rust**: ゲームロジックの実装
- **WebAssembly**: Rust コードを Web ブラウザで実行
- **Solid.js**: リアクティブな UI フレームワーク
- **Vite**: 高速なビルドツール
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

### Rust コア (WebAssembly)

- ゲームロジック全般
- 遺伝的アルゴリズムの実装
- パフォーマンスクリティカルな計算処理

### Solid.js フロントエンド

- UI コンポーネント
- グリッドの可視化
- ユーザーインタラクション
- 統計情報の表示

### データフロー

1. ユーザーが UI でパラメータを設定
2. Solid.js が WASM モジュールの関数を呼び出し
3. Rust でシミュレーションを実行
4. 結果を Solid.js に返して表示

## 主要機能

### シミュレーション機能

- 50x50〜1000x1000 の可変グリッドサイズ
- エージェントの協力確率と移動頻度の進化
- 囚人のジレンマによる対戦
- 遺伝的アルゴリズムによる世代交代

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

- [ ] Agent の基本構造実装
- [ ] Grid の初期化とエージェント配置
- [ ] 囚人のジレンマの利得計算

### Phase 2: ゲームロジック (Rust)

- [ ] 対戦相手の検索ロジック
- [ ] 対戦実行とスコア更新
- [ ] エージェント移動

### Phase 3: 遺伝的アルゴリズム (Rust)

- [ ] 選択アルゴリズム（3 種類）
- [ ] 交叉アルゴリズム（3 種類）
- [ ] 突然変異
- [ ] 世代交代

### Phase 4: WASM 統合

- [ ] wasm-bindgen 設定
- [ ] TypeScript 型定義
- [ ] Solid.js との統合

### Phase 5: UI 実装 (Solid.js)

- [ ] グリッド表示コンポーネント
- [ ] コントロールパネル
- [ ] 統計情報表示
- [ ] グラフ表示機能

### Phase 6: 追加機能

- [ ] プリセット機能
- [ ] CSV エクスポート
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

### Solid.js テスト

```typescript
// Vitestを使用したコンポーネントテスト
import { render } from "@solidjs/testing-library";
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
description = "開発サーバーを起動"
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

# Solid.js開発サーバー
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
├── biome.json              # Biome設定
├── vite.config.ts          # Vite設定
├── vitest.config.ts        # Vitest設定
├── src/
│   ├── lib.rs              # Rust WASMエントリーポイント
│   ├── agent.rs            # エージェント実装
│   ├── grid.rs             # グリッド実装
│   ├── game.rs             # ゲームロジック
│   └── genetic.rs          # 遺伝的アルゴリズム
├── tests/                  # Rustテスト
├── pkg/                    # WASMビルド出力 (自動生成)
├── web/                    # Solid.jsフロントエンド
│   ├── index.html
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── lib/
│   └── tests/
└── CLAUDE.md               # このファイル
```
