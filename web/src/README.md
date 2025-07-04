# 2D Prisoner's Dilemma

二次元空間で囚人のジレンマゲームを実行し、遺伝的アルゴリズムによってエージェントの形質を進化させるシミュレーションアプリケーションです。

## 特徴

- **Rust + WebAssembly** による高速なシミュレーション
- **React** による直感的なUI
- **遺伝的アルゴリズム** による形質進化
- **リアルタイムな可視化** とグラフ表示
- **CSV エクスポート** による結果分析

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
- エージェントの協力確率と移動頻度の進化
- 囚人のジレンマによる対戦
- 3種類の選択・交叉アルゴリズム

### 可視化

- 協力確率による色分け表示
- スコアによるサイズ変更
- リアルタイム統計情報
- 履歴グラフ表示

### エクスポート

- 統計データのCSV出力
- 設定プリセットの保存/読み込み

## 開発

```bash
# 開発モード
bun run dev

# テスト実行
bun run test

# ビルド
bun run build

# リンター
bun run biome:check
```

## ライセンス

MIT License
