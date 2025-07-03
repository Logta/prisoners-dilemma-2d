// ========================================
// AppLayout Organism Component - アプリケーション全体のレイアウトとエラーハンドリング統合
// ========================================

import type React from 'react';
import { useApplicationContext, useNotifications } from '../../contexts/ApplicationContext';
import { ErrorType } from '../../utils/error-handler';
import { ErrorBoundary } from '../molecules/ErrorBoundary';
import { NotificationContainer } from '../molecules/NotificationToast';

export interface AppLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export function AppLayout({
  children,
  header,
  sidebar,
  footer,
  className = '',
  'data-testid': testId,
}: AppLayoutProps) {
  const { theme, isLoading } = useApplicationContext();
  const { notifications, removeNotification } = useNotifications();

  const containerStyle: React.CSSProperties = {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    minHeight: '100vh',
    transition: 'background-color 0.3s ease, color 0.3s ease',
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: theme.backgroundColor,
    borderBottom: `1px solid ${theme.mode === 'dark' ? '#444' : '#e0e0e0'}`,
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  const mainContentStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  };

  const sidebarStyle: React.CSSProperties = {
    backgroundColor: theme.backgroundColor,
    borderRight: `1px solid ${theme.mode === 'dark' ? '#444' : '#e0e0e0'}`,
    flexShrink: 0,
    overflow: 'auto',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    position: 'relative',
  };

  const footerStyle: React.CSSProperties = {
    backgroundColor: theme.backgroundColor,
    borderTop: `1px solid ${theme.mode === 'dark' ? '#444' : '#e0e0e0'}`,
    color: theme.mode === 'dark' ? '#b0b0b0' : '#6c757d',
    flexShrink: 0,
    fontSize: '0.875rem',
    padding: '1rem',
  };

  const loadingOverlayStyle: React.CSSProperties = {
    alignItems: 'center',
    backdropFilter: 'blur(2px)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    left: 0,
    position: 'fixed',
    right: 0,
    top: 0,
    zIndex: 9998,
  };

  const loadingContentStyle: React.CSSProperties = {
    alignItems: 'center',
    backgroundColor: theme.backgroundColor,
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '2rem',
  };

  const spinnerStyle: React.CSSProperties = {
    animation: 'spin 1s linear infinite',
    border: `4px solid ${theme.mode === 'dark' ? '#444' : '#e0e0e0'}`,
    borderRadius: '50%',
    borderTop: `4px solid ${theme.primaryColor}`,
    height: '40px',
    width: '40px',
  };

  return (
    <div className={className} data-testid={testId} style={containerStyle}>
      {/* CSS アニメーション定義 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* ヘッダー */}
      {header && (
        <ErrorBoundary
          component="AppHeader"
          errorType={ErrorType.UI}
          fallback={(error, retry) => (
            <div
              style={{
                ...headerStyle,
                backgroundColor: '#fff5f5',
                borderColor: '#fed7d7',
                color: '#e53e3e',
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              <span>ヘッダーの読み込みに失敗しました</span>
              <button
                onClick={retry}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #e53e3e',
                  borderRadius: '4px',
                  color: '#e53e3e',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  marginLeft: '1rem',
                  padding: '0.25rem 0.5rem',
                }}
              >
                再試行
              </button>
            </div>
          )}
        >
          <div style={headerStyle}>{header}</div>
        </ErrorBoundary>
      )}

      {/* メインコンテンツエリア */}
      <div style={mainContentStyle}>
        {/* サイドバー */}
        {sidebar && (
          <ErrorBoundary
            component="AppSidebar"
            errorType={ErrorType.UI}
            fallback={(error, retry) => (
              <div
                style={{
                  ...sidebarStyle,
                  backgroundColor: '#fff5f5',
                  borderColor: '#fed7d7',
                  color: '#e53e3e',
                  padding: '1rem',
                  textAlign: 'center',
                  width: '250px',
                }}
              >
                <div style={{ marginBottom: '1rem' }}>⚠️</div>
                <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                  サイドバーの読み込みに失敗しました
                </div>
                <button
                  onClick={retry}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #e53e3e',
                    borderRadius: '4px',
                    color: '#e53e3e',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    padding: '0.5rem 1rem',
                  }}
                >
                  再試行
                </button>
              </div>
            )}
          >
            <div style={sidebarStyle}>{sidebar}</div>
          </ErrorBoundary>
        )}

        {/* メインコンテンツ */}
        <ErrorBoundary
          component="AppMainContent"
          errorType={ErrorType.UI}
          fallback={(error, retry) => (
            <div
              style={{
                ...contentStyle,
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                padding: '2rem',
              }}
            >
              <div
                style={{
                  backgroundColor: '#fff5f5',
                  border: '1px solid #fed7d7',
                  borderRadius: '8px',
                  maxWidth: '500px',
                  padding: '2rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💥</div>
                <h2 style={{ color: '#e53e3e', marginBottom: '1rem' }}>アプリケーションエラー</h2>
                <p style={{ color: '#744210', marginBottom: '1.5rem' }}>
                  メインコンテンツの読み込み中にエラーが発生しました。
                  アプリケーションを再起動することをお勧めします。
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    onClick={retry}
                    style={{
                      backgroundColor: '#e53e3e',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      padding: '0.75rem 1.5rem',
                    }}
                  >
                    再試行
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #e53e3e',
                      borderRadius: '4px',
                      color: '#e53e3e',
                      cursor: 'pointer',
                      padding: '0.75rem 1.5rem',
                    }}
                  >
                    アプリ再起動
                  </button>
                </div>
              </div>
            </div>
          )}
        >
          <div style={contentStyle}>{children}</div>
        </ErrorBoundary>
      </div>

      {/* フッター */}
      {footer && (
        <ErrorBoundary
          component="AppFooter"
          errorType={ErrorType.UI}
          fallback={(error, retry) => (
            <div
              style={{
                ...footerStyle,
                backgroundColor: '#fff5f5',
                borderColor: '#fed7d7',
                color: '#e53e3e',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.875rem' }}>フッターの読み込みに失敗しました</span>
              <button
                onClick={retry}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #e53e3e',
                  borderRadius: '4px',
                  color: '#e53e3e',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  marginLeft: '1rem',
                  padding: '0.25rem 0.5rem',
                }}
              >
                再試行
              </button>
            </div>
          )}
        >
          <div style={footerStyle}>{footer}</div>
        </ErrorBoundary>
      )}

      {/* グローバルローディングオーバーレイ */}
      {isLoading && (
        <div style={loadingOverlayStyle}>
          <div style={loadingContentStyle}>
            <div style={spinnerStyle} />
            <div
              style={{
                color: theme.textColor,
                fontSize: '1rem',
                fontWeight: '500',
              }}
            >
              読み込み中...
            </div>
          </div>
        </div>
      )}

      {/* 通知システム */}
      <NotificationContainer
        maxNotifications={5}
        notifications={notifications}
        onRemove={removeNotification}
        position="top-right"
      />
    </div>
  );
}

// ========================================
// デフォルトフッターコンポーネント
// ========================================

export function DefaultFooter() {
  const { theme } = useApplicationContext();

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        justifyContent: 'space-between',
      }}
    >
      <div>© 2024 2D Prisoner's Dilemma Simulation</div>

      <div
        style={{
          display: 'flex',
          fontSize: '0.75rem',
          gap: '1rem',
        }}
      >
        <span>React + TypeScript + WebAssembly</span>
        <span>•</span>
        <span>Claude Code Generated</span>
      </div>
    </div>
  );
}

// ========================================
// シンプルなヘッダーコンポーネント
// ========================================

export function DefaultHeader() {
  const { theme, toggleThemeMode } = useApplicationContext();

  const headerContentStyle: React.CSSProperties = {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
  };

  const titleStyle: React.CSSProperties = {
    color: theme.primaryColor,
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0,
  };

  const themeToggleStyle: React.CSSProperties = {
    background: 'none',
    border: `1px solid ${theme.mode === 'dark' ? '#666' : '#ccc'}`,
    borderRadius: '4px',
    color: theme.textColor,
    cursor: 'pointer',
    fontSize: '1.25rem',
    padding: '0.5rem',
    transition: 'all 0.2s ease',
  };

  return (
    <div style={headerContentStyle}>
      <h1 style={titleStyle}>2D Prisoner's Dilemma</h1>

      <button
        aria-label="テーマ切り替え"
        onClick={toggleThemeMode}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.mode === 'dark' ? '#333' : '#f0f0f0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        style={themeToggleStyle}
        title={`${theme.mode === 'dark' ? 'ライト' : 'ダーク'}テーマに切り替え`}
      >
        {theme.mode === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
