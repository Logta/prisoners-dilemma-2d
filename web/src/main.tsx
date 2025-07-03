import { createSignal, onMount, Show, createEffect } from 'solid-js';
import { render } from 'solid-js/web';
import init from '../../pkg/prisoners_dilemma_2d';
import App from './App';

function AppWithLoader() {
  const [wasmLoaded, setWasmLoaded] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    console.log('Starting WASM initialization...');

    // タイムアウト設定
    const timeout = setTimeout(() => {
      console.error('WASM loading timeout after 10 seconds');
      setLoading(false);
      setError('WASMの読み込みがタイムアウトしました');
    }, 10000);

    try {
      await init();
      clearTimeout(timeout);
      
      console.log('WASM init completed');
      setLoading(false);
      setWasmLoaded(true);
      
      console.log('WASM module loaded successfully');
    } catch (err) {
      clearTimeout(timeout);
      console.error('Failed to load WASM module:', err);
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  });

  // 状態変更を監視
  createEffect(() => {
    console.log('Effect - loading:', loading(), 'wasmLoaded:', wasmLoaded(), 'error:', error());
  });

  console.log('Render - loading:', loading(), 'wasmLoaded:', wasmLoaded(), 'error:', error());

  return (
    <>
      <Show when={error()}>
        <div class="loading" style="color: #ff6b6b;">
          <span>エラー: {error()}</span>
        </div>
      </Show>

      <Show when={loading() && !error()}>
        <div class="loading">
          <div class="spinner"></div>
          <span>シミュレーションエンジンを読み込み中...</span>
        </div>
      </Show>

      <Show when={wasmLoaded() && !loading() && !error()}>
        <div style="padding: 2rem; color: green;">
          <h1>WASM Loaded Successfully!</h1>
          <p>wasmLoaded: {String(wasmLoaded())}</p>
          <p>loading: {String(loading())}</p>
          <p>error: {String(!!error())}</p>
          <App />
        </div>
      </Show>
    </>
  );
}

const appElement = document.getElementById('app');
if (appElement) {
  render(() => <AppWithLoader />, appElement);
}