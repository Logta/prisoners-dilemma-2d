import { createSignal, onMount, Show } from 'solid-js';
import { render } from 'solid-js/web';
import init from '../../pkg/prisoners_dilemma_2d';
import App from './App';

function AppWithLoader() {
  const [wasmLoaded, setWasmLoaded] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      console.log('Starting WASM initialization...');
      await init();
      console.log('WASM init completed, setting wasmLoaded to true');
      setWasmLoaded(true);
      console.log('wasmLoaded state set, current value:', wasmLoaded());
      console.log('WASM module loaded successfully');
    } catch (err) {
      console.error('Failed to load WASM module:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.log('Error state set, current value:', error());
    }
  });

  console.log('Render state:', { wasmLoaded: wasmLoaded(), error: error() });
  
  return (
    <>
      <Show when={error()}>
        <div class="loading" style="color: #ff6b6b;">
          <span>エラー: {error()}</span>
        </div>
      </Show>
      
      <Show when={!wasmLoaded() && !error()}>
        <div class="loading">
          <div class="spinner"></div>
          <span>シミュレーションエンジンを読み込み中...</span>
        </div>
      </Show>
      
      <Show when={wasmLoaded() && !error()}>
        <App />
      </Show>
    </>
  );
}

const appElement = document.getElementById('app');
if (appElement) {
  render(() => <AppWithLoader />, appElement);
}