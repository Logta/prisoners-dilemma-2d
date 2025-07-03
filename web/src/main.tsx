import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import init from '../../pkg/prisoners_dilemma_2d';
import App from './App';

function AppWithLoader() {
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWasm = async () => {
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
    };

    loadWasm();
  }, []);

  console.log('Render - loading:', loading, 'wasmLoaded:', wasmLoaded, 'error:', error);

  if (error) {
    return (
      <div className="loading" style={{ color: '#ff6b6b' }}>
        <span>エラー: {error}</span>
      </div>
    );
  }

  if (loading && !error) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>シミュレーションエンジンを読み込み中...</span>
      </div>
    );
  }

  if (wasmLoaded && !loading && !error) {
    return (
      <BrowserRouter>
        <Routes>
          <Route element={<App />} path="/" />
        </Routes>
      </BrowserRouter>
    );
  }

  return null;
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <AppWithLoader />
    </StrictMode>
  );
}
