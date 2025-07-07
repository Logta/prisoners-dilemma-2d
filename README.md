# 2D Prisoner's Dilemma

二次元グリッド上で囚人のジレンマゲームのシミュレーションを行い、エージェントの戦略進化を観察するWebアプリケーションです。

## 概要

100×100のグリッド上でエージェントが隣接する相手と囚人のジレンマゲームを行い、遺伝的アルゴリズムによって戦略と移動性が進化していく様子を可視化します。

## 技術スタック

- **Rust + WebAssembly**: シミュレーションエンジン
- **React + TypeScript**: フロントエンド
- **Vite**: 開発環境
- **Tailwind CSS**: スタイリング
- **mise**: 開発ツール管理

## クイックスタート

### 前提条件
- [mise](https://mise.jdx.dev/) またはNode.js 24+ + Rust + bun

### 実行方法

```bash
# 依存関係のインストール（初回のみ）
mise run setup

# 開発サーバー起動
mise run dev
```

http://localhost:3000 でアプリケーションが開きます。

## 実装済み機能

### エージェント
- **4つの戦略**: Always Cooperate, Always Defect, Tit for Tat, Pavlov
- **移動性向**: 0.0〜1.0の値で移動確率を制御
- **戦績による移動**: 成績が悪いと移動しやすくなる

### 遺伝的アルゴリズム
- **ルーレット選択**: スコアに比例した親選択
- **交叉**: 戦略は片親から、移動性向は平均値
- **突然変異**: 5%の確率で発生

### UI機能
- **リアルタイム可視化**: Canvas による高速描画
- **統計情報**: 世代、戦略分布、平均値の表示
- **シミュレーション制御**: 開始/停止/リセット/ステップ実行
- **速度調整**: 50ms〜2000msの範囲で調整可能

## プロジェクト構成

```
├── wasm/           # Rust + WASM シミュレーションエンジン
│   ├── src/
│   │   ├── domain/         # ドメインロジック
│   │   ├── application/    # ユースケース
│   │   └── infrastructure/ # WASM バインディング
│   └── Cargo.toml
├── web/            # React フロントエンド
│   ├── src/
│   │   ├── components/     # UI コンポーネント
│   │   ├── hooks/          # カスタムフック
│   │   └── types/          # 型定義
│   └── package.json
└── .mise.toml      # 開発環境設定
```

## その他のコマンド

```bash
# WASM ビルドのみ
mise run wasm

# 型チェック
mise run check

# コード整形
mise run fmt

# テスト実行
mise run test

# プロダクションビルド
mise run build
```

## 仕様詳細

詳細な仕様については [doc/specification_doc.md](doc/specification_doc.md) をご参照ください。

## ライセンス

MIT License