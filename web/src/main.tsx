import { createSignal, onMount, Switch, Match, createEffect } from 'solid-js';
import { render } from 'solid-js/web';
import init from '../../pkg/prisoners_dilemma_2d';
import App from './App';

function AppWithLoader() {
  const [appState, setAppState] = createSignal<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  onMount(async () => {
    console.log('Initial state:', appState());

    // タイムアウト設定
    const timeout = setTimeout(() => {
      console.error('WASM loading timeout after 10 seconds');
      setAppState('error');
      setErrorMessage('WASMの読み込みがタイムアウトしました');
    }, 10000);

    try {
      console.log('Starting WASM initialization...');
      
      await init();
      clearTimeout(timeout);
      
      console.log('WASM init completed, setting state to ready');
      setAppState('ready');
      
      console.log('WASM module loaded successfully, new state:', appState());
    } catch (err) {
      clearTimeout(timeout);
      console.error('Failed to load WASM module:', err);
      setAppState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      console.log('Error state set, current state:', appState());
    }
  });

  // 状態変更を監視
  createEffect(() => {
    console.log('Effect - appState changed to:', appState());
  });

  console.log('Current appState:', appState());

  // シンプルな条件分岐
  const currentState = appState();
  console.log('Rendering with state:', currentState);

  if (currentState === 'error') {
    console.log('Rendering error state');
    return (
      <div class="loading" style="color: #ff6b6b;">
        <span>エラー: {errorMessage()}</span>
      </div>
    );
  }

  if (currentState === 'ready') {
    console.log('Rendering ready state');
    return (
      <div style="padding: 2rem; color: green;">
        <h1>WASM Loaded Successfully!</h1>
        <p>State: {currentState}</p>
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