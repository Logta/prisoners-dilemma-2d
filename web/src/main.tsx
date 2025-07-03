import { createSignal, onMount } from 'solid-js';
import { render } from 'solid-js/web';
import init from '../../pkg/prisoners_dilemma_2d';
import App from './App';

function AppWithLoader() {
  const [wasmLoaded, setWasmLoaded] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      await init();
      setWasmLoaded(true);
      console.log('WASM module loaded successfully');
    } catch (err) {
      console.error('Failed to load WASM module:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  });

  return (
    <>
      {!wasmLoaded() && !error() && (
        <div class="loading">
          <div class="spinner"></div>
          <span>シミュレーションエンジンを読み込み中...</span>
        </div>
      )}
      {error() && (
        <div class="loading" style="color: #ff6b6b;">
          <span>エラー: {error()}</span>
        </div>
      )}
      {wasmLoaded() && <App />}
    </>
  );
}

const appElement = document.getElementById('app');
if (appElement) {
  render(() => <AppWithLoader />, appElement);
}