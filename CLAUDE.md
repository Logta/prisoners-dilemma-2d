# CLAUDE.md

## プロジェクト概要

「2D Prisoner's Dilemma」- 二次元空間で囚人のジレンマゲームを実行し、遺伝的アルゴリズムによってエージェントの形質を進化させるシミュレーションアプリケーション。

## 技術スタック

- **Rust**: コアロジック実装
- **WebAssembly**: ブラウザでの高速実行
- **React**: フロントエンドUI
- **Vite**: ビルドツール
- **Biome**: リンター/フォーマッター

## アーキテクチャ

Clean Architecture の3層構造：

```
src/
├── domain/         # ドメイン層: エンティティ、値オブジェクト、サービス
├── application/    # アプリケーション層: ユースケース
└── infrastructure/ # インフラ層: WASM バインディング、シリアライゼーション

web/
└── src/
    ├── components/ # UIコンポーネント
    └── hooks/      # カスタムフック (useWasmSimulation)
```

## 主要機能

- エージェントの4形質（協力傾向、攻撃性、学習能力、移動性）
- 3つの戦略パターン（Random、TitForTat、Pavlov）
- 遺伝的アルゴリズムによる進化
- リアルタイムな統計表示

## 開発環境

### 必要なツール

- **mise**: 開発環境管理ツール
- **bun**: 高速なJavaScriptランタイム/パッケージマネージャー

### セットアップ

```bash
# mise のインストール
curl https://mise.run | sh

# 必要なツールをインストール
mise install

# bun で依存関係をインストール
bun install
```

## 開発コマンド

```bash
# WASMビルド
wasm-pack build --target web --out-dir pkg

# 開発サーバー
bun run dev

# リンター
bun run biome:check
```

## 現在の状態

### ✅ 実装済み

- Rust側の全機能（Domain/Application/Infrastructure）
- WASM バインディング
- React基本UIコンポーネント
- useWasmSimulation フック

### 🚧 作業中

- UI機能の拡充（グラフ表示、プリセット、エクスポート機能）

## コーディング規約

- **Rust**: snake_case、cargo fmt/clippy 使用
- **TypeScript**: camelCase、Biome 設定に従う
- **コミット**: 機能単位で簡潔なメッセージ

## 注意事項

- WASMとJavaScript間のデータ転送は最小限に
- メモリリークを防ぐため、WASM オブジェクトは適切に free() を呼ぶ
- 大規模グリッド（1000x1000）でもパフォーマンスを維持