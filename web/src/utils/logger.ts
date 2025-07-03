// ========================================
// Unified Logger - 統一されたログシステム
// ========================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  enableRemote: boolean;
  maxStorageEntries: number;
  remoteEndpoint?: string;
  categories: {
    enabled: string[];
    disabled: string[];
  };
}

class Logger {
  private config: LoggerConfig;
  private entries: LogEntry[] = [];
  private readonly storageKey = 'prisoners-dilemma-logs';

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      categories: {
        disabled: [],
        enabled: [],
      },
      enableConsole: true,
      enableRemote: false,
      enableStorage: true,
      level: LogLevel.INFO,
      maxStorageEntries: 1000,
      ...config,
    };

    // 既存のログを読み込み
    this.loadFromStorage();
  }

  // ========================================
  // ログ出力メソッド
  // ========================================

  debug(message: string, context?: Record<string, any>, category = 'debug'): void {
    this.log(LogLevel.DEBUG, category, message, context);
  }

  info(message: string, context?: Record<string, any>, category = 'info'): void {
    this.log(LogLevel.INFO, category, message, context);
  }

  warn(message: string, context?: Record<string, any>, category = 'warn'): void {
    this.log(LogLevel.WARN, category, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>, category = 'error'): void {
    this.log(LogLevel.ERROR, category, message, context, error);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>, category = 'fatal'): void {
    this.log(LogLevel.FATAL, category, message, context, error);
  }

  // カテゴリ別ログメソッド
  simulation(level: LogLevel, message: string, context?: Record<string, any>): void {
    this.log(level, 'simulation', message, context);
  }

  wasm(level: LogLevel, message: string, context?: Record<string, any>): void {
    this.log(level, 'wasm', message, context);
  }

  ui(level: LogLevel, message: string, context?: Record<string, any>): void {
    this.log(level, 'ui', message, context);
  }

  performance(level: LogLevel, message: string, context?: Record<string, any>): void {
    this.log(level, 'performance', message, context);
  }

  // ========================================
  // メインログメソッド
  // ========================================

  private log(
    level: LogLevel,
    category: string,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    // レベルフィルタリング
    if (level < this.config.level) {
      return;
    }

    // カテゴリフィルタリング
    if (!this.shouldLogCategory(category)) {
      return;
    }

    const entry: LogEntry = {
      category,
      context,
      error,
      level,
      message,
      stack: error?.stack,
      timestamp: new Date(),
    };

    // エントリを保存
    this.entries.push(entry);

    // ストレージサイズ制限
    if (this.entries.length > this.config.maxStorageEntries) {
      this.entries = this.entries.slice(-this.config.maxStorageEntries);
    }

    // 各出力先に送信
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    if (this.config.enableStorage) {
      this.saveToStorage();
    }

    if (this.config.enableRemote) {
      this.logToRemote(entry);
    }
  }

  // ========================================
  // 出力先別処理
  // ========================================

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${levelName}] [${entry.category}]`;

    const style = this.getConsoleStyle(entry.level);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`%c${prefix}`, style, entry.message, entry.context || '');
        break;
      case LogLevel.INFO:
        console.info(`%c${prefix}`, style, entry.message, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(`%c${prefix}`, style, entry.message, entry.context || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(`%c${prefix}`, style, entry.message, entry.context || '');
        if (entry.error) {
          console.error(entry.error);
        }
        break;
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'color: #6c757d; font-size: 0.9em;';
      case LogLevel.INFO:
        return 'color: #007bff; font-weight: bold;';
      case LogLevel.WARN:
        return 'color: #ffc107; font-weight: bold;';
      case LogLevel.ERROR:
        return 'color: #dc3545; font-weight: bold;';
      case LogLevel.FATAL:
        return 'color: #ffffff; background-color: #dc3545; font-weight: bold; padding: 2px 4px;';
      default:
        return '';
    }
  }

  private saveToStorage(): void {
    try {
      const serialized = JSON.stringify(
        this.entries.map((entry) => ({
          ...entry,
          error: entry.error
            ? {
                message: entry.error.message,
                name: entry.error.name,
                stack: entry.error.stack,
              }
            : undefined,
          timestamp: entry.timestamp.toISOString(),
        }))
      );
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.error('Failed to save logs to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.entries = parsed.map((entry: any) => ({
          ...entry,
          error: entry.error
            ? Object.assign(new Error(entry.error.message), entry.error)
            : undefined,
          timestamp: new Date(entry.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load logs from storage:', error);
    }
  }

  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) {
      return;
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        body: JSON.stringify({
          ...entry,
          timestamp: entry.timestamp.toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to send log to remote endpoint:', error);
    }
  }

  // ========================================
  // 設定・管理メソッド
  // ========================================

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  enableCategory(category: string): void {
    if (!this.config.categories.enabled.includes(category)) {
      this.config.categories.enabled.push(category);
    }
    this.config.categories.disabled = this.config.categories.disabled.filter((c) => c !== category);
  }

  disableCategory(category: string): void {
    if (!this.config.categories.disabled.includes(category)) {
      this.config.categories.disabled.push(category);
    }
    this.config.categories.enabled = this.config.categories.enabled.filter((c) => c !== category);
  }

  private shouldLogCategory(category: string): boolean {
    // 明示的に無効化されている場合
    if (this.config.categories.disabled.includes(category)) {
      return false;
    }

    // 有効リストが空の場合はすべて有効
    if (this.config.categories.enabled.length === 0) {
      return true;
    }

    // 明示的に有効化されている場合
    return this.config.categories.enabled.includes(category);
  }

  // ========================================
  // ログ取得・検索メソッド
  // ========================================

  getEntries(options?: {
    level?: LogLevel;
    category?: string;
    since?: Date;
    limit?: number;
  }): LogEntry[] {
    let filtered = this.entries;

    if (options?.level !== undefined) {
      filtered = filtered.filter((entry) => entry.level >= options.level!);
    }

    if (options?.category) {
      filtered = filtered.filter((entry) => entry.category === options.category);
    }

    if (options?.since) {
      filtered = filtered.filter((entry) => entry.timestamp >= options.since!);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  search(query: string): LogEntry[] {
    const lowercaseQuery = query.toLowerCase();
    return this.entries.filter(
      (entry) =>
        entry.message.toLowerCase().includes(lowercaseQuery) ||
        entry.category.toLowerCase().includes(lowercaseQuery) ||
        JSON.stringify(entry.context || {})
          .toLowerCase()
          .includes(lowercaseQuery)
    );
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.entries, null, 2);

      case 'csv': {
        const headers = ['timestamp', 'level', 'category', 'message', 'context'];
        const rows = this.entries.map((entry) => [
          entry.timestamp.toISOString(),
          LogLevel[entry.level],
          entry.category,
          entry.message.replace(/"/g, '""'), // CSVエスケープ
          JSON.stringify(entry.context || {}).replace(/"/g, '""'),
        ]);

        return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
      }

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  clearLogs(): void {
    this.entries = [];
    localStorage.removeItem(this.storageKey);
  }

  // ========================================
  // 統計・メトリクス
  // ========================================

  getLogStatistics(): {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
    oldestEntry?: Date;
    newestEntry?: Date;
  } {
    const byLevel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    this.entries.forEach((entry) => {
      const levelName = LogLevel[entry.level];
      byLevel[levelName] = (byLevel[levelName] || 0) + 1;
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
    });

    return {
      byCategory,
      byLevel,
      newestEntry:
        this.entries.length > 0 ? this.entries[this.entries.length - 1].timestamp : undefined,
      oldestEntry: this.entries.length > 0 ? this.entries[0].timestamp : undefined,
      total: this.entries.length,
    };
  }
}

// ========================================
// シングルトンインスタンス
// ========================================

export const logger = new Logger({
  enableConsole: true,
  enableRemote: false,
  enableStorage: true,
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
});

// ========================================
// 便利関数
// ========================================

export function createTimedLogger(category: string) {
  const timers = new Map<string, number>();

  return {
    end(operation: string, context?: Record<string, any>): number {
      const startTime = timers.get(operation);
      if (!startTime) {
        logger.warn(`No start time found for operation: ${operation}`, { operation }, category);
        return 0;
      }

      const duration = performance.now() - startTime;
      timers.delete(operation);

      logger.info(
        `Completed: ${operation}`,
        {
          duration: `${duration.toFixed(2)}ms`,
          operation,
          ...context,
        },
        category
      );

      return duration;
    },

    measure<T>(operation: string, fn: () => T, context?: Record<string, any>): T {
      this.start(operation);
      try {
        const result = fn();
        this.end(operation, context);
        return result;
      } catch (error) {
        logger.error(`Failed: ${operation}`, error as Error, { operation, ...context }, category);
        throw error;
      }
    },

    async measureAsync<T>(
      operation: string,
      fn: () => Promise<T>,
      context?: Record<string, any>
    ): Promise<T> {
      this.start(operation);
      try {
        const result = await fn();
        this.end(operation, context);
        return result;
      } catch (error) {
        logger.error(`Failed: ${operation}`, error as Error, { operation, ...context }, category);
        throw error;
      }
    },
    start(operation: string): void {
      timers.set(operation, performance.now());
      logger.debug(`Started: ${operation}`, { operation }, category);
    },
  };
}

export function withLogging<T extends (...args: any[]) => any>(
  fn: T,
  category: string,
  operationName?: string
): T {
  return ((...args: any[]) => {
    const operation = operationName || fn.name || 'anonymous';
    const timedLogger = createTimedLogger(category);

    return timedLogger.measure(operation, () => fn(...args), { args: args.length });
  }) as T;
}

export function withAsyncLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  category: string,
  operationName?: string
): T {
  return (async (...args: any[]) => {
    const operation = operationName || fn.name || 'anonymous';
    const timedLogger = createTimedLogger(category);

    return await timedLogger.measureAsync(operation, () => fn(...args), { args: args.length });
  }) as T;
}
