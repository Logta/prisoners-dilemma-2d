// ========================================
// Main Entry Point - 2D Prisoner's Dilemma
// ========================================

import React from 'react';
import ReactDom from 'react-dom/client';
import { App } from './App';
import './index.css';

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
    return { error, hasError: true };
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
            {/* biome-ignore lint/nursery/noSecrets: This is a Japanese error message, not a secret */}
            <p>{this.state.error?.message || '不明なエラー'}</p>
          </div>
          <button className="retry-button" onClick={() => window.location.reload()} type="button">
            再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// React 18の並行機能を有効にする
ReactDom.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
