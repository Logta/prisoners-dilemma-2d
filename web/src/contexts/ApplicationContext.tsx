// ========================================
// Application Context - 統一されたアプリケーション状態管理
// ========================================

import React, { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

export interface ApplicationTheme {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface ApplicationSettings {
  autoSave: boolean;
  autoSaveInterval: number; // milliseconds
  maxHistorySize: number;
  enablePerformanceMode: boolean;
  debugMode: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  gridRenderOptimization: boolean;
}

export interface NotificationState {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  autoClose: boolean;
  duration?: number;
}

export interface ApplicationState {
  theme: ApplicationTheme;
  settings: ApplicationSettings;
  notifications: NotificationState[];
  isLoading: boolean;
  lastError: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export interface ApplicationActions {
  // テーマ管理
  setTheme: (theme: Partial<ApplicationTheme>) => void;
  toggleThemeMode: () => void;

  // 設定管理
  updateSettings: (settings: Partial<ApplicationSettings>) => void;
  resetSettings: () => void;

  // 通知管理
  addNotification: (notification: Omit<NotificationState, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // アプリケーション状態
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting') => void;

  // データ永続化
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

export interface ApplicationContextValue extends ApplicationState, ApplicationActions {}

// デフォルト設定
const defaultTheme: ApplicationTheme = {
  backgroundColor: '#ffffff',
  mode: 'light',
  primaryColor: '#1976d2',
  secondaryColor: '#dc004e',
  textColor: '#000000',
};

const defaultSettings: ApplicationSettings = {
  animationSpeed: 'normal',
  autoSave: true, // 30秒
  autoSaveInterval: 30000,
  debugMode: false,
  enablePerformanceMode: false,
  gridRenderOptimization: true,
  maxHistorySize: 1000,
};

const initialState: ApplicationState = {
  connectionStatus: 'disconnected',
  isLoading: false,
  lastError: null,
  notifications: [],
  settings: defaultSettings,
  theme: defaultTheme,
};

const ApplicationContext = createContext<ApplicationContextValue | null>(null);

export interface ApplicationProviderProps {
  children: ReactNode;
}

export function ApplicationProvider({ children }: ApplicationProviderProps) {
  const [state, setState] = useState<ApplicationState>(initialState);

  // ステート更新ヘルパー
  const updateState = useCallback((updates: Partial<ApplicationState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // ========================================
  // テーマ管理
  // ========================================

  const setTheme = useCallback(
    (theme: Partial<ApplicationTheme>) => {
      updateState({
        theme: { ...state.theme, ...theme },
      });
    },
    [state.theme, updateState]
  );

  const toggleThemeMode = useCallback(() => {
    const newMode = state.theme.mode === 'light' ? 'dark' : 'light';
    const newTheme = {
      ...state.theme,
      backgroundColor: newMode === 'dark' ? '#121212' : '#ffffff',
      mode: newMode,
      textColor: newMode === 'dark' ? '#ffffff' : '#000000',
    };
    updateState({ theme: newTheme });
  }, [state.theme, updateState]);

  // ========================================
  // 設定管理
  // ========================================

  const updateSettings = useCallback(
    (settings: Partial<ApplicationSettings>) => {
      updateState({
        settings: { ...state.settings, ...settings },
      });
    },
    [state.settings, updateState]
  );

  const resetSettings = useCallback(() => {
    updateState({ settings: defaultSettings });
  }, [updateState]);

  // ========================================
  // 通知管理
  // ========================================

  const addNotification = useCallback(
    (notification: Omit<NotificationState, 'id' | 'timestamp'>) => {
      const newNotification: NotificationState = {
        ...notification,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      updateState({
        notifications: [...state.notifications, newNotification],
      });

      // 自動削除の設定
      if (newNotification.autoClose) {
        const duration = newNotification.duration || 5000;
        setTimeout(() => {
          removeNotification(newNotification.id);
        }, duration);
      }
    },
    [state.notifications, updateState]
  );

  const removeNotification = useCallback(
    (id: string) => {
      updateState({
        notifications: state.notifications.filter((n) => n.id !== id),
      });
    },
    [state.notifications, updateState]
  );

  const clearAllNotifications = useCallback(() => {
    updateState({ notifications: [] });
  }, [updateState]);

  // ========================================
  // アプリケーション状態管理
  // ========================================

  const setLoading = useCallback(
    (loading: boolean) => {
      updateState({ isLoading: loading });
    },
    [updateState]
  );

  const setError = useCallback(
    (error: string | null) => {
      updateState({ lastError: error });

      if (error) {
        addNotification({
          autoClose: true,
          duration: 8000,
          message: error,
          title: 'エラーが発生しました',
          type: 'error',
        });
      }
    },
    [updateState, addNotification]
  );

  const setConnectionStatus = useCallback(
    (status: 'connected' | 'disconnected' | 'connecting') => {
      updateState({ connectionStatus: status });

      // 接続状態の変化を通知
      if (status === 'connected') {
        addNotification({
          autoClose: true,
          duration: 3000,
          message: 'WASMエンジンに接続しました',
          title: '接続完了',
          type: 'success',
        });
      } else if (status === 'disconnected') {
        addNotification({
          autoClose: true,
          duration: 5000,
          message: 'WASMエンジンとの接続が切断されました',
          title: '接続切断',
          type: 'warning',
        });
      }
    },
    [updateState, addNotification]
  );

  // ========================================
  // データ永続化
  // ========================================

  const saveToLocalStorage = useCallback(() => {
    try {
      const dataToSave = {
        settings: state.settings,
        theme: state.theme,
      };
      localStorage.setItem('prisoners-dilemma-app-state', JSON.stringify(dataToSave));

      addNotification({
        autoClose: true,
        duration: 2000,
        message: '設定をローカルストレージに保存しました',
        title: '設定保存',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      setError('設定の保存に失敗しました');
    }
  }, [state.theme, state.settings, addNotification, setError]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem('prisoners-dilemma-app-state');
      if (savedData) {
        const parsed = JSON.parse(savedData);

        updateState({
          settings: { ...defaultSettings, ...parsed.settings },
          theme: { ...defaultTheme, ...parsed.theme },
        });

        addNotification({
          autoClose: true,
          duration: 2000,
          message: '保存された設定を読み込みました',
          title: '設定読込',
          type: 'info',
        });
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      setError('設定の読み込みに失敗しました');
    }
  }, [updateState, addNotification, setError]);

  // 初期化時にローカルストレージから設定を読み込み
  React.useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // 自動保存の設定
  React.useEffect(() => {
    if (state.settings.autoSave) {
      const interval = setInterval(() => {
        saveToLocalStorage();
      }, state.settings.autoSaveInterval);

      return () => clearInterval(interval);
    }
  }, [state.settings.autoSave, state.settings.autoSaveInterval, saveToLocalStorage]);

  // ========================================
  // コンテキスト値
  // ========================================

  const contextValue: ApplicationContextValue = {
    // State
    ...state,
    addNotification,
    clearAllNotifications,
    loadFromLocalStorage,
    removeNotification,
    resetSettings,
    saveToLocalStorage,
    setConnectionStatus,
    setError,
    setLoading,

    // Actions
    setTheme,
    toggleThemeMode,
    updateSettings,
  };

  return <ApplicationContext.Provider value={contextValue}>{children}</ApplicationContext.Provider>;
}

export function useApplicationContext(): ApplicationContextValue {
  const context = useContext(ApplicationContext);

  if (!context) {
    throw new Error('useApplicationContext must be used within an ApplicationProvider');
  }

  return context;
}

// 便利関数のエクスポート
export function useTheme() {
  const { theme, setTheme, toggleThemeMode } = useApplicationContext();
  return { setTheme, theme, toggleThemeMode };
}

export function useSettings() {
  const { settings, updateSettings, resetSettings } = useApplicationContext();
  return { resetSettings, settings, updateSettings };
}

export function useNotifications() {
  const { notifications, addNotification, removeNotification, clearAllNotifications } =
    useApplicationContext();
  return { addNotification, clearAllNotifications, notifications, removeNotification };
}
