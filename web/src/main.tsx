import { createSignal, onMount, Switch, Match } from 'solid-js';
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

  // 状態を計算して適切な値を返す
  const appState = () => {
    const loaded = wasmLoaded();
    const err = error();
    
    console.log('Render state:', { loaded, err });
    
    if (err) return 'error';
    if (loaded) return 'ready';
    return 'loading';
  };
  
  return (
    <Switch>
      <Match when={appState() === 'error'}>
        <div class="loading" style="color: #ff6b6b;">
          <span>エラー: {error()}</span>
        </div>
      </Match>
      
      <Match when={appState() === 'loading'}>
        <div class="loading">
          <div class="spinner"></div>
          <span>シミュレーションエンジンを読み込み中...</span>
        </div>
      </Match>
      
      <Match when={appState() === 'ready'}>
        <App />
      </Match>
    </Switch>
  );
}

const appElement = document.getElementById('app');
if (appElement) {
  render(() => <AppWithLoader />, appElement);
}