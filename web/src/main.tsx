// ========================================
// Main Entry Point - 2D Prisoner's Dilemma
// ========================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { JotaiProvider } from './components/providers/JotaiProvider';
import './styles/global.css';

// エラー境界コンポーネント
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error">
          <div className="error-message">
            <h2>アプリケーションエラーが発生しました</h2>
            <p>{this.state.error?.message || '不明なエラー'}</p>
          </div>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// React 18の並行機能を有効にする
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <JotaiProvider>
        <App />
      </JotaiProvider>
    </ErrorBoundary>
  </React.StrictMode>
);