// ========================================
// Error Boundary Molecule Component
// ========================================

import React, { Component, type ReactNode } from 'react';
import { ErrorSeverity, ErrorType, errorHandler } from '../../utils/error-handler';
import { logger } from '../../utils/logger';
import { Button } from '../atoms/Button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  errorType?: ErrorType;
  component?: string;
  className?: string;
  'data-testid'?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      error: null,
      errorInfo: null,
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      error,
      hasError: true,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラー情報を状態に保存
    this.setState({
      errorInfo,
    });

    // カスタムエラーハンドラーで処理
    const appError = errorHandler.createError(
      `React Error Boundary: ${error.message}`,
      this.props.errorType || ErrorType.UNEXPECTED,
      ErrorSeverity.HIGH,
      {
        action: 'component_error',
        additionalData: {
          componentStack: errorInfo.componentStack,
          retryCount: this.state.retryCount,
        },
        component: this.props.component || 'ErrorBoundary',
        originalError: error,
      }
    );

    errorHandler.handleError(appError);

    // ログ記録
    logger.error(
      `Error caught by boundary in ${this.props.component || 'unknown component'}`,
      error,
      {
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      },
      'error-boundary'
    );

    // 親コンポーネントのエラーハンドラーを呼び出し
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;

    logger.info(
      `Retrying component render (attempt ${newRetryCount})`,
      {
        component: this.props.component,
        previousError: this.state.error?.message,
      },
      'error-boundary'
    );

    this.setState({
      error: null,
      errorInfo: null,
      hasError: false,
      retryCount: newRetryCount,
    });
  };

  private handleReset = () => {
    logger.info(
      'Resetting error boundary',
      {
        component: this.props.component,
        retryCount: this.state.retryCount,
      },
      'error-boundary'
    );

    this.setState({
      error: null,
      errorInfo: null,
      hasError: false,
      retryCount: 0,
    });
  };

  private renderDefaultFallback(): ReactNode {
    const { error, retryCount } = this.state;
    const canRetry = retryCount < this.maxRetries;

    const containerStyle: React.CSSProperties = {
      alignItems: 'center',
      backgroundColor: '#fff5f5',
      border: '1px solid #fed7d7',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      margin: '1rem',
      minHeight: '200px',
      padding: '2rem',
      textAlign: 'center',
    };

    const iconStyle: React.CSSProperties = {
      color: '#e53e3e',
      fontSize: '3rem',
      marginBottom: '1rem',
    };

    const titleStyle: React.CSSProperties = {
      color: '#e53e3e',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
    };

    const messageStyle: React.CSSProperties = {
      color: '#744210',
      fontSize: '1rem',
      marginBottom: '1.5rem',
      maxWidth: '500px',
    };

    const buttonGroupStyle: React.CSSProperties = {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      justifyContent: 'center',
    };

    const detailsStyle: React.CSSProperties = {
      backgroundColor: '#f7fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '4px',
      color: '#4a5568',
      fontSize: '0.875rem',
      marginTop: '1rem',
      maxWidth: '600px',
      overflow: 'auto',
      padding: '1rem',
      textAlign: 'left',
    };

    return (
      <div
        className={this.props.className}
        data-testid={this.props['data-testid']}
        style={containerStyle}
      >
        <div style={iconStyle}>⚠️</div>

        <h2 style={titleStyle}>エラーが発生しました</h2>

        <p style={messageStyle}>
          {error?.message ||
            '予期しないエラーが発生しました。ページを再読み込みするか、再試行してください。'}
        </p>

        <div style={buttonGroupStyle}>
          {canRetry && (
            <Button onClick={this.handleRetry} size="medium" variant="primary">
              再試行 ({this.maxRetries - retryCount}回まで)
            </Button>
          )}

          <Button onClick={this.handleReset} size="medium" variant="secondary">
            リセット
          </Button>

          <Button onClick={() => window.location.reload()} size="medium" variant="outline">
            ページ再読み込み
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details style={detailsStyle}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              エラー詳細 (開発モード)
            </summary>

            <div style={{ marginBottom: '1rem' }}>
              <strong>エラーメッセージ:</strong>
              <pre style={{ fontSize: '0.8rem', margin: '0.5rem 0' }}>{error.message}</pre>
            </div>

            {error.stack && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>スタックトレース:</strong>
                <pre
                  style={{
                    backgroundColor: '#1a202c',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    fontSize: '0.75rem',
                    margin: '0.5rem 0',
                    maxHeight: '200px',
                    overflow: 'auto',
                    padding: '0.5rem',
                  }}
                >
                  {error.stack}
                </pre>
              </div>
            )}

            {this.state.errorInfo?.componentStack && (
              <div>
                <strong>コンポーネントスタック:</strong>
                <pre
                  style={{
                    backgroundColor: '#2d3748',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    fontSize: '0.75rem',
                    margin: '0.5rem 0',
                    maxHeight: '150px',
                    overflow: 'auto',
                    padding: '0.5rem',
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div style={{ color: '#718096', fontSize: '0.75rem', marginTop: '1rem' }}>
              <strong>再試行回数:</strong> {retryCount} / {this.maxRetries}
            </div>
          </details>
        )}
      </div>
    );
  }

  override render() {
    if (this.state.hasError) {
      // カスタムフォールバックが提供されている場合
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // デフォルトフォールバック
      return this.renderDefaultFallback();
    }

    return this.props.children;
  }
}

// ========================================
// HOC版のエラーバウンダリ
// ========================================

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps} component={Component.displayName || Component.name}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// ========================================
// フック版のエラーバウンダリ
// ========================================

export function useErrorHandler(component?: string) {
  const handleError = React.useCallback(
    (error: Error, errorType: ErrorType = ErrorType.UNEXPECTED, action?: string) => {
      const appError = errorHandler.createError(error.message, errorType, ErrorSeverity.MEDIUM, {
        action,
        component,
        originalError: error,
      });

      errorHandler.handleError(appError);
    },
    [component]
  );

  const handleAsyncError = React.useCallback(
    async (error: Error, errorType: ErrorType = ErrorType.UNEXPECTED, action?: string) => {
      const appError = errorHandler.createError(error.message, errorType, ErrorSeverity.MEDIUM, {
        action,
        component,
        originalError: error,
      });

      await errorHandler.handleError(appError);
    },
    [component]
  );

  return { handleAsyncError, handleError };
}
