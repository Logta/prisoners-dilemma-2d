# CLAUDE.md

## プロジェクト概要

2D Prisoner's Dilemma - 100×100グリッド上での囚人のジレンマシミュレーション。エージェントの戦略と移動性が遺伝的アルゴリズムにより進化する様子をリアルタイムで可視化するWebアプリケーション。

## 技術スタック

- **Rust + WebAssembly**: シミュレーションエンジン
- **React + TypeScript**: フロントエンドUI
- **Vite**: 開発環境・ビルドツール
- **Tailwind CSS**: スタイリング
- **mise**: 開発ツール管理

## アーキテクチャ

Clean Architecture の3層構造で実装：

```
wasm/src/
├── domain/              # ドメイン層
│   ├── agent/          # エージェント（戦略、移動、履歴）
│   ├── game/           # ゲームロジック（利得行列、対戦）
│   └── grid/           # グリッド管理
├── application/         # アプリケーション層
│   ├── simulation/     # シミュレーション管理
│   └── evolution/      # 遺伝的アルゴリズム
└── infrastructure/     # インフラ層
    └── wasm_bindings/  # WASM バインディング

web/src/
├── components/         # UIコンポーネント
│   ├── SimulationGrid  # Canvas 可視化
│   ├── ControlPanel    # 操作パネル
│   ├── StatisticsPanel # 統計表示
│   └── ui/            # 基本UIコンポーネント
├── hooks/             # React カスタムフック
│   ├── useWasm        # WASM モジュール管理
│   └── useSimulation  # シミュレーション状態管理
├── lib/               # ユーティリティ
│   └── canvas.ts      # Canvas 描画エンジン
└── types/             # TypeScript 型定義
```

## 実装済み機能

### シミュレーション
- **グリッドサイズ**: 100×100（固定）
- **エージェント数**: 1000体（設定可能）
- **戦略**: AllCooperate, AllDefect, TitForTat, Pavlov
- **移動性**: 0.0〜1.0の移動確率、戦績に応じて変動
- **世代交代**: 100ターンごと

### 遺伝的アルゴリズム
- **選択**: ルーレット選択（スコア比例）
- **交叉**: 戦略は片親継承、移動性は平均
- **突然変異**: 5%確率で戦略変更・移動性変化（±0.2）

### UI機能
- **リアルタイム可視化**: Canvas での高速描画
- **色分け**: 戦略別 + 協力率による明度調整
- **制御**: 開始/停止/リセット/ステップ実行
- **速度調整**: 50ms〜2000ms
- **統計表示**: 世代、戦略分布、平均値

## 開発環境

### 必要なツール
- **mise**: 推奨（Node.js 24+ + Rust + bun を自動管理）
- または手動で Node.js 24+, Rust, bun をインストール

### セットアップ・実行

```bash
# 初回セットアップ
mise run setup

# 開発開始
mise run dev

# その他のコマンド
mise run wasm      # WASM ビルドのみ
mise run check     # 型チェック・リント
mise run fmt       # コード整形
mise run test      # テスト実行
mise run build     # プロダクションビルド
```

## 現在の状態

### ✅ 完成済み

**Rust (WASM)**
- ドメインロジック（エージェント、ゲーム、グリッド）
- アプリケーション層（シミュレーション、進化）
- WASM バインディング
- 型安全なJavaScript インターフェース

**React (フロントエンド)**
- Canvas による高速グリッド描画
- インタラクティブなUI（制御パネル、統計表示）
- WASM との型安全な連携
- レスポンシブデザイン

**開発環境**
- mise による統一された開発フロー
- 型チェック・リント・テストの設定
- Vite による高速な開発・ビルド

### 📝 改善可能な項目

- テストの追加（現在は型チェックとビルド確認のみ）
- パフォーマンス分析ツール
- 設定のカスタマイズ機能
- シミュレーション結果のエクスポート

## コーディング規約

- **Rust**: snake_case、cargo fmt/clippy に従う
- **TypeScript**: camelCase、Biome 設定に従う
- **コミット**: 機能単位、簡潔で具体的なメッセージ

## パフォーマンス考慮事項

- WASM とJavaScript 間のデータ転送を最小化
- WASM オブジェクトの適切なメモリ管理（free()）
- Canvas での効率的な描画更新
- 1000エージェントでの安定動作を確認済み

## トラブルシューティング

**WASM ビルドエラー**
```bash
# wasm-pack の再インストール
cargo install wasm-pack --force
```

**型エラー**
```bash
# TypeScript チェック
cd web && bun run type-check
```

**依存関係の問題**
```bash
# クリーンビルド
mise run clean
mise run setup
```