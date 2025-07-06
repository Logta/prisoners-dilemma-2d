# 2D Prisoner's Dilemma

二次元空間で囚人のジレンマゲームを実行し、遺伝的アルゴリズムによってエージェントの形質を進化させるシミュレーションアプリケーションです。

## 特徴

- **Clean Architecture** による保守性とテスタビリティの高い設計
- **Rust + WebAssembly** による高速なシミュレーション
- **React** による直感的なUI
- **戦略パターン** (Random, TitForTat, Pavlov) の実装
- **遺伝的アルゴリズム** による4つの形質進化
- **リアルタイムな可視化** とグラフ表示
- **プリセット機能** と多形式 **エクスポート** (JSON/CSV/Binary)

## 技術スタック

- **Rust**: コアロジック（WebAssembly）
- **React**: フロントエンド
- **Vite**: ビルドツール
- **Biome**: リンター/フォーマッター
- **Vitest**: テストフレームワーク

## セットアップ

### 前提条件

- Node.js 18+
- Rust
- wasm-pack

### インストール

```bash
# 依存関係のインストール
bun install

# WASMビルド
wasm-pack build --target web --out-dir pkg

# 開発サーバー起動
bun run dev
```

## 機能

### シミュレーション

- 可変グリッドサイズ（50x50〜1000x1000）
- エージェントの4つの形質（協力傾向、攻撃性、学習能力、移動性）の進化
- 遺伝的特性に基づく戦略選択（Random, TitForTat, Pavlov）
- 囚人のジレンマによる対戦と履歴管理
- 3種類の選択・交叉アルゴリズム

### 可視化

- 協力確率による色分け表示
- スコアによるサイズ変更
- リアルタイム統計情報
- 履歴グラフ表示

### エクスポート・永続化

- **データエクスポート**: JSON/CSV/Binary 形式対応
- **エクスポート種類**: エージェント、統計、戦闘履歴、設定等
- **プリセット機能**: 4種類の標準プリセット + カスタム保存/読み込み
- **ファイル名自動生成**: タイムスタンプ付きファイル名

## 開発

### TDD サイクル

```bash
# Rust テスト（TDD 用）
cargo test

# 監視モードでテスト自動実行
cargo watch -x test

# 全テスト実行（Rust + React）
bun run test
```

### ビルド・開発

```bash
# WASM ビルド
wasm-pack build --target web --out-dir pkg

# 開発モード
bun run dev

# ビルド
bun run build

# リンター
bun run biome:check
```

### テスト結果

- **Domain Layer**: 97 テスト
- **Application Layer**: 35 テスト
- **Infrastructure Layer**: 26 テスト
- **合計**: 158 テストケース

## 現在の実装状況

### ✅ 完了済み
- Rust Clean Architecture (Domain/Application/Infrastructure 3層)
- 戦略パターン (Random, TitForTat, Pavlov) による意思決定
- 遺伝的アルゴリズム (3種類の選択・交叉方式)
- WASM バインディング (WasmSimulationManager, WasmBattleManager)
- データ永続化・エクスポート機能 (JSON/CSV/Binary)
- 158のテストケースによる品質保証

### 🚧 作業中
- React フロントエンドのWASM API統合
- UI コンポーネントの更新

## ライセンス

MIT License
