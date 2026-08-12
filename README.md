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
- **4つの対戦戦略**: Always Cooperate, Always Defect, Tit for Tat, Pavlov
- **6つの移動戦略**: Explorer（探検者）, Settler（定住者）, Adaptive（適応者）, Opportunist（機会主義者）, Social（社交的）, Antisocial（非社交的）。それぞれ基本移動性と移動判定ロジックが異なる
- **移動性**: 0.0〜1.0の値で移動確率を制御（移動戦略ごとの基本値 ± ランダム幅）
- **戦略複雑度ペナルティ**（任意）: TitForTat/Pavlov戦略の適応度上昇を抑制
- **トーラスフィールドモード**（任意）: グリッドの端を繋げてエージェントが端を越えて移動可能に

### 遺伝的アルゴリズム
- **ルーレット選択**: スコアに比例した親選択
- **交叉**: 対戦戦略は片親から、移動戦略は75%で片親・25%でランダム、移動性は平均値
- **突然変異**: 5%の確率で発生（対戦戦略50%変更、移動性は常に微変化、移動戦略は30%で変異）

### UI機能
- **リアルタイム可視化**: Canvas による高速描画
- **統計情報**: 世代、対戦戦略分布、移動戦略分布、平均値の表示
- **シミュレーション制御**: 初期配置/開始/一時停止/リセット/ステップ実行
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