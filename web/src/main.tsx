import { createSignal, onMount, Switch, Match, createEffect } from 'solid-js';
import { render } from 'solid-js/web';
import init from '../../pkg/prisoners_dilemma_2d';
import App from './App';

function AppWithLoader() {
  const [appState, setAppState] = createSignal<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const [forceRender, setForceRender] = createSignal(0);

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
      setForceRender(prev => prev + 1);
      
      console.log('WASM module loaded successfully, new state:', appState());
      
      // 強制的にDOM更新を確認
      setTimeout(() => {
        console.log('After timeout - state:', appState(), 'forceRender:', forceRender());
      }, 100);
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

  console.log('Current appState:', appState(), 'forceRender:', forceRender());

  // シンプルな条件分岐（forceRender も参照してリアクティブ性を保証）
  const currentState = appState();
  const renderCount = forceRender();
  console.log('Rendering with state:', currentState, 'render count:', renderCount);

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

// 完全にシンプルなテスト用コンポーネント
function TestComponent() {
  const [count, setCount] = createSignal(0);
  
  onMount(() => {
    console.log('TestComponent mounted');
    setTimeout(() => {
      console.log('Setting count to 1');
      setCount(1);
    }, 2000);
  });
  
  console.log('TestComponent render, count:', count());
  
  if (count() === 0) {
    return <div style="color: red;">Count is 0</div>;
  }
  
  return <div style="color: green;">Count is {count()}</div>;
}

const appElement = document.getElementById('app');
if (appElement) {
  // テスト用コンポーネントで基本的なリアクティブ性を確認
  console.log('Rendering TestComponent for debugging');
  render(() => <TestComponent />, appElement);
  
  // 5秒後に本来のアプリに切り替え
  setTimeout(() => {
    console.log('Switching to AppWithLoader');
    render(() => <AppWithLoader />, appElement);
  }, 5000);
}