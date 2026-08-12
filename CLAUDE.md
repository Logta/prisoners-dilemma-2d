# CLAUDE.md

## プロジェクト概要

2D Prisoner's Dilemma - 100×100グリッド上での囚人のジレンマシミュレーション。エージェントの戦略と移動性が遺伝的アルゴリズムにより進化する様子をリアルタイムで可視化するWebアプリケーション。

## 技術スタック

- **Rust + WebAssembly**: シミュレーションエンジン
- **React + TypeScript**: フロントエンドUI
- **React Router**: ルーティング
- **Jotai**: グローバル状態管理用に導入済み（現状は`Provider`のみで未使用。実際の状態はコンポーネント内`useState`と`useSimulation`フックが保持している）
- **Vite**: 開発環境・ビルドツール
- **Vitest + Testing Library**: フロントエンドのテスト
- **Biome**: リント・フォーマット
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
│   ├── layout/         # Layout（ページ共通レイアウト）
│   ├── pages/          # HomePage
│   ├── providers/      # JotaiProvider
│   └── ui/             # 基本UIコンポーネント（Button, Slider）
├── hooks/              # React カスタムフック
│   ├── useWasm               # WASM モジュールのロード
│   ├── useSimulationInstance  # WasmSimulationインスタンスのライフサイクル管理
│   └── useSimulation          # ステップ実行・ポーリング等シミュレーション進行の管理
├── lib/                # ユーティリティ
│   ├── canvas.ts       # Canvas 描画エンジン
│   └── wasmConversion.ts # WASM DTO → プレーンオブジェクト変換
├── types/              # TypeScript 型定義
└── router.tsx          # ルーティング定義
```

`wasm/src/domain` はwasm-bindgenに依存しない（`#[wasm_bindgen]`はinfrastructure層のみで使用する）。JS向けの数値表現（enum判別値）や変換ロジックは`infrastructure/wasm_bindings`に集約すること。

## 実装済み機能

### シミュレーション
- **グリッドサイズ**: UI上のデフォルトは100×100（`WasmSimulation`自体は任意のwidth/heightを受け付ける可変API）
- **エージェント数**: 10〜1000体（UIスライダーで設定可能）
- **対戦戦略（`StrategyType`）**: AllCooperate, AllDefect, TitForTat, Pavlov の4種
- **移動戦略（`MovementStrategy`）**: 6種、それぞれ基本移動性と移動判定ロジックが異なる
  - Explorer（探検者）: 高移動性（基本0.8）、常に新しい場所を探索
  - Settler（定住者）: 低移動性（基本0.2）、良い場所に定住
  - Adaptive（適応者）: 中程度（基本0.5）、成績に応じて移動確率を動的調整
  - Opportunist（機会主義者）: やや低め（基本0.4）、隣接エージェントの協力率を見て移動判定
  - Social（社交的）: やや高め（基本0.6）、同じ対戦戦略の仲間が多いと留まりやすい
  - Antisocial（非社交的）: 高移動性（基本0.7）、異なる戦略の仲間が多いと移動しやすい
  - いずれも基本移動性に `random_range(-0.2..=0.2)` のランダム幅が加わる（`Agent::random`）
- **戦略複雑度ペナルティ**（任意、既定OFF）: TitForTatとPavlov戦略の適応度上昇を抑制する係数（既定15%、UIで0〜100%調整可）
- **トーラスフィールドモード**（任意、既定OFF）: ONにするとグリッドの端が繋がり、エージェントが端を越えて移動できる
- **世代交代**: 100ターンごと

### 遺伝的アルゴリズム
- **選択**: ルーレット選択（スコア比例、戦略複雑度ペナルティ有効時は補正あり）
- **交叉**（`Agent::crossover`）: 対戦戦略は50%の確率でどちらかの親から継承。移動戦略は75%の確率で親から継承・25%でランダム。移動性は両親の平均
- **突然変異**（`Agent::mutate`）: 5%の確率で発生。発生時は対戦戦略が50%で変更、移動性は常に±0.2の範囲でランダム変化、移動戦略は30%の確率で別の移動戦略にランダム変異
- **座標生成**: 子エージェントの座標はグリッドの実サイズ（width×height）に基づき一意に割り当てられる（`EvolutionService::generate_positions`）

### UI機能
- **リアルタイム可視化**: Canvas での高速描画
- **色分け**: 戦略別 + 協力率による明度調整
- **制御**: 初期配置/開始/一時停止/リセット/ステップ実行
- **速度調整**: 50ms〜2000ms
- **統計表示**: 世代、対戦戦略分布、移動戦略分布、平均協力率/移動性/スコア

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

**テスト**
- Rust: `wasm/src`配下に`#[cfg(test)]`によるユニットテスト（domain層、遺伝的アルゴリズム、世代交代の回帰テストを含む）
- TypeScript: Vitest + Testing Libraryによるコンポーネント・フックのテスト（実際に`render`/`renderHook`でDOM・フックの挙動を検証する）
- CI（`.github/workflows/ci.yml`）で`master`ブランチへのpush/PR時に自動実行

### 📝 改善可能な項目

- パフォーマンス分析ツール
- 設定のカスタマイズ機能
- シミュレーション結果のエクスポート
- テストカバレッジの拡充（ControlPanel, StatisticsPanel等の主要コンポーネントは未カバー）

## コーディング規約

- **Rust**: snake_case、cargo fmt/clippy に従う
- **TypeScript**: camelCase、Biome 設定に従う
- **コミット**: 機能単位、簡潔で具体的なメッセージ
- **レイヤー依存の方向**: `domain` → `application` → `infrastructure` の一方向のみ。`domain`層は`wasm-bindgen`はじめインフラ関心事に依存してはならない。JS向けのenum判別値・DTO変換・wasm_bindgen関数は`infrastructure/wasm_bindings`に集約する
- **戦略・列挙値の対応表**: `StrategyType`/`MovementStrategy`のJS向け数値表現は`infrastructure/wasm_bindings/types.rs`が唯一の変換元。フロントエンド側の対応表（`web/src/types/wasm.ts`）を変更する際は、wasm-bindgen生成の`.d.ts`との整合をコンパイル時ガード（`MOVEMENT_STRATEGY_NAMES_EXHAUSTIVE_CHECK`）で確認すること

## パフォーマンス考慮事項

- WASM とJavaScript 間のデータ転送を最小化
- `WasmSimulation`インスタンスは明示的に`free()`する（`useSimulationInstance.ts`）。`get_agents()`が返す個々の`WasmAgent`は明示的な`free()`を呼んでおらず、解放はJS側のGC（`FinalizationRegistry`）任せで非決定的
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