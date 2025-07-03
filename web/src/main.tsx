import { createSignal, onMount, Switch, Match } from 'solid-js';
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
      console.log('wasmLoaded state set, current value:', wasmLoaded());
      console.log('WASM module loaded successfully');
    } catch (err) {
      clearTimeout(timeout);
      console.error('Failed to load WASM module:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.log('Error state set, current value:', error());
    }
  });

  // 状態を計算して適切な値を返す
  const appState = () => {
    const loaded = wasmLoaded();
    const err = error();
    const state = err ? 'error' : loaded ? 'ready' : 'loading';
    
    console.log('App state calculation:', { loaded, err, state });
    
    return state;
  };
  
  return (
    <Switch fallback={
      <div class="loading">
        <div class="spinner"></div>
        <span>シミュレーションエンジンを読み込み中...</span>
      </div>
    }>
      <Match when={error()}>
        <div class="loading" style="color: #ff6b6b;">
          <span>エラー: {error()}</span>
        </div>
      </Match>
      
      <Match when={wasmLoaded()}>
        <App />
      </Match>
    </Switch>
  );
}

const appElement = document.getElementById('app');
if (appElement) {
  render(() => <AppWithLoader />, appElement);
}