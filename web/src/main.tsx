import { createSignal, onMount, Switch, Match, createEffect } from 'solid-js';
import { render } from 'solid-js/web';
import init from '../../pkg/prisoners_dilemma_2d';
import App from './App';

function AppWithLoader() {
  const [wasmLoaded, setWasmLoaded] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    // タイムアウト設定
    const timeout = setTimeout(() => {
      console.error('WASM loading timeout after 10 seconds');
      setError('WASMの読み込みがタイムアウトしました');
    }, 10000);

    try {
      console.log('Starting WASM initialization...');
      console.log('Import meta URL:', import.meta.url);
      console.log('Window location:', window.location.href);
      
      await init();
      clearTimeout(timeout);
      
      console.log('WASM init completed, setting wasmLoaded to true');
      setWasmLoaded(true);
      
      // 状態変更を確認
      setTimeout(() => {
        console.log('After setWasmLoaded - wasmLoaded():', wasmLoaded());
        console.log('After setWasmLoaded - error():', error());
      }, 0);
      
      console.log('WASM module loaded successfully');
    } catch (err) {
      clearTimeout(timeout);
      console.error('Failed to load WASM module:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.log('Error state set, current value:', error());
    }
  });

  // 状態変更を監視
  createEffect(() => {
    console.log('Effect - wasmLoaded changed to:', wasmLoaded());
    if (wasmLoaded()) {
      console.log('WASM loaded - forcing re-render check');
    }
  });

  createEffect(() => {
    console.log('Effect - error changed to:', error());
  });

  // レンダリング関数内での状態変更を強制的に追跡
  const renderKey = () => `${wasmLoaded()}-${!!error()}`;
  console.log('Render key:', renderKey());
  
  console.log('Current render conditions:', {
    'error()': error(),
    'wasmLoaded()': wasmLoaded(),
    'Match error when': !!error(),
    'Match wasmLoaded when': !!wasmLoaded()
  });

  // デバッグ用の直接的な条件分岐
  if (error()) {
    console.log('Rendering error state');
    return (
      <div class="loading" style="color: #ff6b6b;">
        <span>エラー: {error()}</span>
      </div>
    );
  }

  if (wasmLoaded()) {
    console.log('Rendering WASM loaded state');
    return (
      <div style="padding: 2rem; color: green;">
        <h1>WASM Loaded Successfully!</h1>
        <p>wasmLoaded: {String(wasmLoaded())}</p>
        <p>error: {String(error())}</p>
        <App />
      </div>
    );
  }

  console.log('Rendering loading state');
  return (
    <div class="loading">
      <div class="spinner"></div>
      <span>シミュレーションエンジンを読み込み中...</span>
    </div>
  );
}

const appElement = document.getElementById('app');
if (appElement) {
  render(() => <AppWithLoader />, appElement);
}