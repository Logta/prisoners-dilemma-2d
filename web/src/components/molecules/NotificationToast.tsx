// ========================================
// NotificationToast Molecule Component
// ========================================

import type React from 'react';
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ApplicationContext';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';

export interface NotificationToastProps {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
  showProgress?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  }>;
  onClose: (id: string) => void;
  className?: string;
  'data-testid'?: string;
}

export function NotificationToast({
  id,
  type,
  title,
  message,
  autoClose = true,
  duration = 5000,
  showProgress = true,
  actions = [],
  onClose,
  className = '',
  'data-testid': testId,
}: NotificationToastProps) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  // アニメーション制御
  useEffect(() => {
    // 少し遅延してからスライドイン
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(showTimer);
  }, []);

  // 自動クローズとプログレスバー
  useEffect(() => {
    if (!autoClose) return;

    let progressTimer: NodeJS.Timeout;
    let closeTimer: NodeJS.Timeout;

    if (showProgress) {
      const updateInterval = 50; // 50ms間隔で更新
      const decrementValue = (100 / duration) * updateInterval;

      progressTimer = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - decrementValue;
          if (newProgress <= 0) {
            clearInterval(progressTimer);
            return 0;
          }
          return newProgress;
        });
      }, updateInterval);
    }

    closeTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(closeTimer);
      clearInterval(progressTimer);
    };
  }, [autoClose, duration, showProgress]);

  const handleClose = () => {
    setIsVisible(false);
    // アニメーション完了後にコールバック実行
    setTimeout(() => onClose(id), 300);
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#d4edda',
          badgeVariant: 'success' as const,
          borderColor: '#c3e6cb',
          icon: '✅',
          textColor: '#155724',
        };
      case 'warning':
        return {
          backgroundColor: '#fff3cd',
          badgeVariant: 'warning' as const,
          borderColor: '#ffeaa7',
          icon: '⚠️',
          textColor: '#856404',
        };
      case 'error':
        return {
          backgroundColor: '#f8d7da',
          badgeVariant: 'danger' as const,
          borderColor: '#f5c6cb',
          icon: '❌',
          textColor: '#721c24',
        };
      case 'info':
      default:
        return {
          backgroundColor: '#d1ecf1',
          badgeVariant: 'info' as const,
          borderColor: '#bee5eb',
          icon: 'ℹ️',
          textColor: '#0c5460',
        };
    }
  };

  const typeConfig = getTypeConfig();

  const containerStyle: React.CSSProperties = {
    backgroundColor: typeConfig.backgroundColor,
    border: `1px solid ${typeConfig.borderColor}`,
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '0.75rem',
    maxWidth: '480px',
    minWidth: '320px',
    opacity: isVisible ? 1 : 0,
    overflow: 'hidden',
    position: 'relative',
    transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  };

  const headerStyle: React.CSSProperties = {
    alignItems: 'flex-start',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem 1rem 0.5rem 1rem',
  };

  const contentStyle: React.CSSProperties = {
    alignItems: 'flex-start',
    display: 'flex',
    gap: '0.75rem',
  };

  const iconStyle: React.CSSProperties = {
    flexShrink: 0,
    fontSize: '1.25rem',
    marginTop: '0.125rem',
  };

  const textStyle: React.CSSProperties = {
    color: typeConfig.textColor,
    flex: 1,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: '600',
    lineHeight: 1.4,
    marginBottom: '0.25rem',
  };

  const messageStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    opacity: 0.9,
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    borderRadius: '4px',
    color: typeConfig.textColor,
    cursor: 'pointer',
    flexShrink: 0,
    fontSize: '1.25rem',
    opacity: 0.7,
    padding: '0.25rem',
    transition: 'opacity 0.2s ease',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
    padding: '0 1rem 1rem 1rem',
  };

  const progressBarStyle: React.CSSProperties = {
    backgroundColor: typeConfig.borderColor,
    bottom: 0,
    height: '3px',
    left: 0,
    position: 'absolute',
    transition: 'width 0.05s linear',
    width: `${progress}%`,
  };

  return (
    <div
      aria-live="assertive"
      className={className}
      data-testid={testId}
      role="alert"
      style={containerStyle}
    >
      <div style={headerStyle}>
        <div style={contentStyle}>
          <span style={iconStyle}>{typeConfig.icon}</span>

          <div style={textStyle}>
            <div style={titleStyle}>
              {title}
              <Badge
                size="small"
                style={{ marginLeft: '0.5rem' }}
                variant={typeConfig.badgeVariant}
              >
                {type.toUpperCase()}
              </Badge>
            </div>
            <div style={messageStyle}>{message}</div>
          </div>
        </div>

        <button
          aria-label="通知を閉じる"
          onClick={handleClose}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
          style={closeButtonStyle}
        >
          ✕
        </button>
      </div>

      {actions.length > 0 && (
        <div style={actionsStyle}>
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={() => {
                action.onClick();
                handleClose();
              }}
              size="small"
              variant={action.variant || 'outline'}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {autoClose && showProgress && <div style={progressBarStyle} />}
    </div>
  );
}

// ========================================
// NotificationContainer Component
// ========================================

export interface NotificationContainerProps {
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    autoClose?: boolean;
    duration?: number;
    actions?: Array<{
      label: string;
      onClick: () => void;
      variant?: 'primary' | 'secondary' | 'outline';
    }>;
  }>;
  onRemove: (id: string) => void;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  maxNotifications?: number;
  className?: string;
  'data-testid'?: string;
}

export function NotificationContainer({
  notifications,
  onRemove,
  position = 'top-right',
  maxNotifications = 5,
  className = '',
  'data-testid': testId,
}: NotificationContainerProps) {
  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      pointerEvents: 'none',
      position: 'fixed',
      zIndex: 9999,
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, right: '1rem', top: '1rem' };
      case 'top-left':
        return { ...baseStyles, left: '1rem', top: '1rem' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '1rem', right: '1rem' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '1rem', left: '1rem' };
      case 'top-center':
        return { ...baseStyles, left: '50%', top: '1rem', transform: 'translateX(-50%)' };
      case 'bottom-center':
        return { ...baseStyles, bottom: '1rem', left: '50%', transform: 'translateX(-50%)' };
      default:
        return { ...baseStyles, right: '1rem', top: '1rem' };
    }
  };

  const containerStyle: React.CSSProperties = {
    ...getPositionStyles(),
    display: 'flex',
    flexDirection: position.includes('bottom') ? 'column-reverse' : 'column',
    gap: '0.5rem',
    maxHeight: '80vh',
    overflow: 'hidden',
  };

  const visibleNotifications = notifications.slice(0, maxNotifications);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={className} data-testid={testId} style={containerStyle}>
      {visibleNotifications.map((notification) => (
        <div key={notification.id} style={{ pointerEvents: 'auto' }}>
          <NotificationToast {...notification} onClose={onRemove} />
        </div>
      ))}

      {notifications.length > maxNotifications && (
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '0.875rem',
            padding: '0.5rem 1rem',
            pointerEvents: 'auto',
            textAlign: 'center',
          }}
        >
          +{notifications.length - maxNotifications} 件の通知
        </div>
      )}
    </div>
  );
}
