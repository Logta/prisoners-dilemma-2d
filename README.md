# 2D Prisoner's Dilemma

二次元空間で囚人のジレンマゲームを実行し、遺伝的アルゴリズムによってエージェントの形質を進化させるシミュレーションアプリケーションです。

## 概要

このプロジェクトは、エージェント間の協力と競争の進化をシミュレートします。各エージェントは遺伝的特性を持ち、囚人のジレンマゲームを通じて相互作用し、世代を重ねて進化していきます。

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

## 主な機能

- エージェントの4つの形質（協力傾向、攻撃性、学習能力、移動性）のシミュレーション
- 3つの戦略パターン（Random, TitForTat, Pavlov）
- 遺伝的アルゴリズムによる世代交代
- リアルタイムな統計情報表示
- WASM による高速な計算処理

## アーキテクチャ

Clean Architecture の3層構造で実装されています：

- **Domain Layer**: エージェント、ワールド、戦闘、進化のコアロジック
- **Application Layer**: シミュレーション、戦闘、進化のユースケース
- **Infrastructure Layer**: WASM バインディング、シリアライゼーション、永続化

## 開発

```bash
# WASM ビルド
wasm-pack build --target web --out-dir pkg

# 開発サーバー
bun run dev

# リンター
bun run biome:check
```

## 詳細ドキュメント

- [WASM API仕様書](doc/WASM_API_DOCUMENTATION.md) - WebAssembly APIの詳細な使用方法
- [プロジェクト仕様書](doc/specification_doc.md) - アーキテクチャとドメインモデルの詳細

## ライセンス

MIT License
