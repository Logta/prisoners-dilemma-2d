# フロントエンド（React + TypeScript）

2D Prisoner's Dilemma シミュレーションの Web フロントエンドです。WASM エンジンと連携してリアルタイムな可視化とインタラクティブな操作を提供します。

## 技術スタック

- **React 19**: UI フレームワーク
- **TypeScript**: 型安全性
- **Vite**: 開発環境・ビルドツール
- **Tailwind CSS**: スタイリング
- **Canvas API**: 高速グリッド描画

## プロジェクト構成

```
src/
├── components/           # UI コンポーネント
│   ├── layout/          # レイアウト
│   ├── pages/           # ページ
│   ├── ui/              # 基本UIコンポーネント
│   ├── SimulationGrid.tsx   # Canvas 可視化
│   ├── ControlPanel.tsx     # 操作パネル
│   └── StatisticsPanel.tsx  # 統計表示
├── hooks/               # カスタムフック
│   ├── useWasm.ts       # WASM モジュール管理
│   └── useSimulation.ts # シミュレーション状態管理
├── lib/                 # ユーティリティ
│   └── canvas.ts        # Canvas 描画エンジン
├── types/               # 型定義
│   └── wasm.ts          # WASM インターフェース型
└── assets/pkg/          # WASM ファイル（ビルド時コピー）
```

## 主要コンポーネント

### SimulationGrid
Canvas を使用した高速なグリッド可視化

**機能**
- 100×100 グリッドの描画
- エージェントの戦略別色分け
- 協力率による明度調整
- リアルタイム更新

### ControlPanel
シミュレーション操作用UI

**機能**
- 開始/停止/リセット/ステップ実行
- 速度調整スライダー（50ms〜2000ms）
- 状態表示

### StatisticsPanel
統計情報の表示

**機能**
- 現在の世代・エージェント数
- 戦略分布（数・割合・プログレスバー）
- 平均値（協力率・移動性・スコア）

## カスタムフック

### useWasm
WASM モジュールの非同期読み込みと初期化

```typescript
const { wasmModule, loading, error } = useWasm();
```

### useSimulation
シミュレーション状態の管理

```typescript
const {
  isRunning,
  statistics,
  agents,
  loading,
  error,
  start,
  pause,
  reset,
  step,
} = useSimulation(config);
```

## Canvas 描画

### SimulationCanvas クラス
効率的なグリッド描画を担当

**最適化**
- セル単位の描画
- 戦略色 + 協力率ブレンド
- 描画領域の最適化
- 高DPI対応

## 開発

### セットアップ

```bash
# 依存関係インストール
bun install

# WASM ファイルコピー
bun run copy-wasm

# 開発サーバー
bun run dev
```

### その他のコマンド

```bash
# 型チェック
bun run type-check

# リント・フォーマット
bun run biome:check
bun run biome:fix

# プロダクションビルド
bun run build

# プレビュー
bun run preview
```

## 設定

### Vite設定 (vite.config.ts)
- WASM ファイルのアセット取り込み
- CORS ヘッダー設定
- 開発サーバー設定

### Tailwind設定
- カスタムコンポーネントスタイル
- レスポンシブデザイン

## WASM 連携

### 型安全性
TypeScript でWASM インターフェースを定義

```typescript
// types/wasm.ts
export interface WasmSimulation {
  step(): WasmStatistics;
  get_agents(): WasmAgent[];
  // ...
}
```

### エラーハンドリング
WASM エラーを適切にキャッチして表示

```typescript
try {
  const stats = simulation.step();
} catch (error) {
  setError(error.message);
}
```

### メモリ管理
WASM オブジェクトの適切な解放

```typescript
useEffect(() => {
  return () => {
    if (simulation) {
      simulation.free(); // メモリ解放
    }
  };
}, [simulation]);
```

## パフォーマンス

### 最適化されている項目
- **Canvas 描画**: requestAnimationFrame 使用
- **状態更新**: React の最適化機能活用
- **WASM 呼び出し**: 最小限のデータ転送
- **メモリ**: 適切なクリーンアップ

### パフォーマンス指標
- **1000エージェント**: 60fps で安定描画
- **メモリ使用量**: 約10-15MB
- **初期読み込み**: 約1-2秒

## トラブルシューティング

### よくある問題

**WASM読み込みエラー**
```bash
# WASMファイルを再コピー
bun run copy-wasm
```

**型エラー**
```bash
# 型チェック実行
bun run type-check
```

**スタイルの問題**
```bash
# Tailwind設定確認
bunx tailwindcss --init
```

### デバッグ

開発者ツールでのデバッグ情報：
- WASM モジュール読み込み状況
- Canvas 描画パフォーマンス
- React コンポーネントの再レンダリング

## ブラウザ対応

### 対応ブラウザ
- Chrome 88+
- Firefox 79+
- Safari 14+
- Edge 88+

### 必要な機能
- WebAssembly サポート
- Canvas API
- ES2020 サポート