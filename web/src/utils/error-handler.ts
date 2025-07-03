// ========================================
// Unified Error Handler - 統一されたエラーハンドリングシステム
// ========================================

import { LogLevel, logger } from './logger';

export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  WASM = 'wasm',
  SIMULATION = 'simulation',
  STORAGE = 'storage',
  PERMISSION = 'permission',
  UNEXPECTED = 'unexpected',
  USER_INPUT = 'user_input',
  PERFORMANCE = 'performance',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code?: string;
  context: ErrorContext;
  isRetryable: boolean;
  userMessage: string;
  originalError?: Error;
}

export interface ErrorRecoveryStrategy {
  canRecover(error: AppError): boolean;
  recover(error: AppError): Promise<boolean>;
  fallback?(error: AppError): Promise<void>;
}

export interface ErrorNotificationConfig {
  showToUser: boolean;
  autoClose: boolean;
  duration?: number;
  includeRetryAction: boolean;
}

class ErrorHandler {
  private recoveryStrategies: Map<ErrorType, ErrorRecoveryStrategy[]> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private suppressedErrors: Set<string> = new Set();
  private onErrorCallbacks: Array<(error: AppError) => void> = [];

  constructor() {
    // グローバルエラーハンドラーを設定
    this.setupGlobalHandlers();
    this.setupDefaultRecoveryStrategies();
  }

  // ========================================
  // エラー作成・処理メソッド
  // ========================================

  createError(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    options: {
      code?: string;
      component?: string;
      action?: string;
      originalError?: Error;
      additionalData?: Record<string, any>;
      isRetryable?: boolean;
      userMessage?: string;
    } = {}
  ): AppError {
    const context: ErrorContext = {
      action: options.action,
      additionalData: options.additionalData,
      component: options.component,
      stackTrace: new Error().stack,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    const error: AppError = Object.assign(new Error(message), {
      code: options.code || `${type.toUpperCase()}_ERROR`,
      context,
      isRetryable: options.isRetryable ?? this.isRetryableByDefault(type),
      originalError: options.originalError,
      severity,
      type,
      userMessage: options.userMessage || this.generateUserMessage(message, type),
    });

    return error;
  }

  async handleError(error: Error | AppError, context?: Partial<ErrorContext>): Promise<void> {
    let appError: AppError;

    if (this.isAppError(error)) {
      appError = error;
      // コンテキストの追加更新
      if (context) {
        Object.assign(appError.context, context);
      }
    } else {
      // 標準Errorを AppError に変換
      appError = this.createError(error.message, this.inferErrorType(error), ErrorSeverity.MEDIUM, {
        action: context?.action,
        additionalData: context?.additionalData,
        component: context?.component,
        originalError: error,
      });
    }

    // エラー回数をカウント
    const errorKey = `${appError.type}:${appError.code}`;
    const errorCount = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, errorCount);

    // 抑制チェック
    if (this.shouldSuppressError(appError, errorCount)) {
      return;
    }

    // ログ記録
    this.logError(appError);

    // コールバック実行
    this.onErrorCallbacks.forEach((callback) => {
      try {
        callback(appError);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });

    // 復旧試行
    await this.attemptRecovery(appError);
  }

  // ========================================
  // 復旧戦略管理
  // ========================================

  registerRecoveryStrategy(type: ErrorType, strategy: ErrorRecoveryStrategy): void {
    if (!this.recoveryStrategies.has(type)) {
      this.recoveryStrategies.set(type, []);
    }
    this.recoveryStrategies.get(type)!.push(strategy);
  }

  private async attemptRecovery(error: AppError): Promise<void> {
    const strategies = this.recoveryStrategies.get(error.type) || [];

    for (const strategy of strategies) {
      if (strategy.canRecover(error)) {
        try {
          logger.info(
            `Attempting recovery for error: ${error.message}`,
            {
              errorType: error.type,
              strategy: strategy.constructor.name,
            },
            'error-recovery'
          );

          const recovered = await strategy.recover(error);

          if (recovered) {
            logger.info(
              `Successfully recovered from error: ${error.message}`,
              {
                errorType: error.type,
                strategy: strategy.constructor.name,
              },
              'error-recovery'
            );
            return;
          }
        } catch (recoveryError) {
          logger.error(
            `Recovery strategy failed: ${strategy.constructor.name}`,
            recoveryError as Error,
            {
              errorType: error.type,
              originalError: error.message,
            },
            'error-recovery'
          );
        }
      }
    }

    // すべての復旧戦略が失敗した場合のフォールバック
    for (const strategy of strategies) {
      if (strategy.fallback) {
        try {
          await strategy.fallback(error);
          break;
        } catch (fallbackError) {
          logger.error(
            `Fallback strategy failed: ${strategy.constructor.name}`,
            fallbackError as Error,
            { originalError: error.message },
            'error-recovery'
          );
        }
      }
    }
  }

  // ========================================
  // グローバルハンドラー設定
  // ========================================

  private setupGlobalHandlers(): void {
    // 未処理のPromise拒否
    window.addEventListener('unhandledrejection', (event) => {
      const error = this.createError(
        `Unhandled promise rejection: ${event.reason}`,
        ErrorType.UNEXPECTED,
        ErrorSeverity.HIGH,
        {
          action: 'unhandled_promise_rejection',
          additionalData: { reason: event.reason },
          component: 'global',
          originalError: event.reason instanceof Error ? event.reason : undefined,
        }
      );

      this.handleError(error);
      event.preventDefault(); // ブラウザのデフォルト処理を防ぐ
    });

    // 未処理のエラー
    window.addEventListener('error', (event) => {
      const error = this.createError(
        `Global error: ${event.message}`,
        ErrorType.UNEXPECTED,
        ErrorSeverity.HIGH,
        {
          action: 'global_error',
          additionalData: {
            colno: event.colno,
            filename: event.filename,
            lineno: event.lineno,
          },
          component: 'global',
          originalError: event.error,
        }
      );

      this.handleError(error);
    });

    // リソース読み込みエラー
    window.addEventListener(
      'error',
      (event) => {
        if (event.target && event.target !== window) {
          const target = event.target as HTMLElement;
          const error = this.createError(
            `Resource loading error: ${target.tagName}`,
            ErrorType.NETWORK,
            ErrorSeverity.MEDIUM,
            {
              action: 'resource_loading_error',
              additionalData: {
                src: (target as any).src || (target as any).href,
                tagName: target.tagName,
              },
              component: 'global',
            }
          );

          this.handleError(error);
        }
      },
      true
    );
  }

  // ========================================
  // デフォルト復旧戦略
  // ========================================

  private setupDefaultRecoveryStrategies(): void {
    // ネットワークエラー復旧戦略
    this.registerRecoveryStrategy(ErrorType.NETWORK, {
      canRecover: (error) => error.isRetryable,
      fallback: async (error) => {
        logger.warn(
          'Network error fallback: switching to offline mode',
          {
            error: error.message,
          },
          'error-recovery'
        );
      },
      recover: async (error) => {
        // 簡単な再試行ロジック
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return navigator.onLine;
      },
    });

    // ストレージエラー復旧戦略
    this.registerRecoveryStrategy(ErrorType.STORAGE, {
      canRecover: (error) => true,
      recover: async (error) => {
        try {
          // ストレージのクリアを試行
          localStorage.clear();
          return true;
        } catch {
          return false;
        }
      },
    });

    // WASM エラー復旧戦略
    this.registerRecoveryStrategy(ErrorType.WASM, {
      canRecover: (error) => error.context.action !== 'initialization',
      recover: async (error) => {
        try {
          // WASM モジュールの再初期化を試行
          logger.info('Attempting WASM module reinitialization', {}, 'error-recovery');
          // 実際の再初期化ロジックはここに実装
          return false; // 現在は実装されていない
        } catch {
          return false;
        }
      },
    });
  }

  // ========================================
  // ユーティリティメソッド
  // ========================================

  private isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'type' in error && 'severity' in error;
  }

  private inferErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('wasm') || message.includes('webassembly')) {
      return ErrorType.WASM;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('storage') || message.includes('quota')) {
      return ErrorType.STORAGE;
    }
    if (message.includes('permission') || message.includes('denied')) {
      return ErrorType.PERMISSION;
    }

    return ErrorType.UNEXPECTED;
  }

  private isRetryableByDefault(type: ErrorType): boolean {
    switch (type) {
      case ErrorType.NETWORK:
      case ErrorType.WASM:
      case ErrorType.STORAGE:
        return true;
      case ErrorType.VALIDATION:
      case ErrorType.PERMISSION:
      case ErrorType.USER_INPUT:
        return false;
      default:
        return false;
    }
  }

  private generateUserMessage(message: string, type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'ネットワーク接続に問題があります。接続を確認して再試行してください。';
      case ErrorType.WASM:
        return 'シミュレーションエンジンでエラーが発生しました。ページを再読み込みしてください。';
      case ErrorType.VALIDATION:
        return '入力値に問題があります。値を確認して再試行してください。';
      case ErrorType.STORAGE:
        return 'データの保存に失敗しました。ブラウザの容量を確認してください。';
      case ErrorType.PERMISSION:
        return '必要な権限がありません。ブラウザの設定を確認してください。';
      case ErrorType.SIMULATION:
        return 'シミュレーション処理でエラーが発生しました。';
      case ErrorType.PERFORMANCE:
        return '処理に時間がかかりすぎています。設定を調整してください。';
      default:
        return '予期しないエラーが発生しました。ページを再読み込みしてください。';
    }
  }

  private shouldSuppressError(error: AppError, count: number): boolean {
    const errorKey = `${error.type}:${error.code}`;

    // 重複エラーの抑制
    if (count > 5) {
      if (!this.suppressedErrors.has(errorKey)) {
        logger.warn(
          `Suppressing repeated error: ${error.message}`,
          {
            code: error.code,
            count,
            errorType: error.type,
          },
          'error-suppression'
        );
        this.suppressedErrors.add(errorKey);
      }
      return true;
    }

    return false;
  }

  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);

    logger.log(
      logLevel,
      'error',
      error.message,
      {
        action: error.context.action,
        additionalData: error.context.additionalData,
        code: error.code,
        component: error.context.component,
        isRetryable: error.isRetryable,
        severity: error.severity,
        type: error.type,
        userMessage: error.userMessage,
      },
      error.originalError || error
    );
  }

  private getLogLevel(severity: ErrorSeverity): LogLevel {
    switch (severity) {
      case ErrorSeverity.LOW:
        return LogLevel.WARN;
      case ErrorSeverity.MEDIUM:
        return LogLevel.ERROR;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return LogLevel.FATAL;
      default:
        return LogLevel.ERROR;
    }
  }

  // ========================================
  // 公開API
  // ========================================

  onError(callback: (error: AppError) => void): () => void {
    this.onErrorCallbacks.push(callback);

    // アンサブスクライブ関数を返す
    return () => {
      const index = this.onErrorCallbacks.indexOf(callback);
      if (index > -1) {
        this.onErrorCallbacks.splice(index, 1);
      }
    };
  }

  clearErrorCounts(): void {
    this.errorCounts.clear();
    this.suppressedErrors.clear();
  }

  getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    suppressedErrorsCount: number;
  } {
    const errorsByType: Partial<Record<ErrorType, number>> = {};
    const errorsBySeverity: Partial<Record<ErrorSeverity, number>> = {};

    // 実装は簡略化のため省略
    return {
      errorsBySeverity: errorsBySeverity as Record<ErrorSeverity, number>,
      errorsByType: errorsByType as Record<ErrorType, number>,
      suppressedErrorsCount: this.suppressedErrors.size,
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
    };
  }
}

// ========================================
// シングルトンインスタンス
// ========================================

export const errorHandler = new ErrorHandler();

// ========================================
// 便利関数
// ========================================

export function createErrorBoundary<T>(
  fn: () => T,
  errorType: ErrorType,
  context?: Partial<ErrorContext>
): T {
  try {
    return fn();
  } catch (error) {
    errorHandler.handleError(error as Error, context);
    throw error;
  }
}

export async function createAsyncErrorBoundary<T>(
  fn: () => Promise<T>,
  errorType: ErrorType,
  context?: Partial<ErrorContext>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    await errorHandler.handleError(error as Error, context);
    throw error;
  }
}

export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  errorType: ErrorType,
  context?: Partial<ErrorContext>
): T {
  return ((...args: any[]) => {
    return createErrorBoundary(() => fn(...args), errorType, context);
  }) as T;
}

export function withAsyncErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorType: ErrorType,
  context?: Partial<ErrorContext>
): T {
  return (async (...args: any[]) => {
    return await createAsyncErrorBoundary(() => fn(...args), errorType, context);
  }) as T;
}
