// ========================================
// Button Atom Component
// ========================================

import type React from 'react';
import { useTheme } from '../../contexts/ApplicationContext';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'data-testid'?: string;
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  type = 'button',
  className = '',
  'data-testid': testId,
}: ButtonProps) {
  const { theme } = useTheme();

  const baseStyles = {
    alignItems: 'center',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    fontFamily: 'inherit',
    fontWeight: '500',
    justifyContent: 'center',
    opacity: disabled || loading ? 0.6 : 1,
    outline: 'none',
    textAlign: 'center' as const,
    textDecoration: 'none',
    transition: 'all 0.2s ease-in-out',
    width: fullWidth ? '100%' : 'auto',
  };

  const sizeStyles = {
    large: {
      fontSize: '1.125rem',
      minHeight: '48px',
      padding: '1rem 2rem',
    },
    medium: {
      fontSize: '1rem',
      minHeight: '40px',
      padding: '0.75rem 1.5rem',
    },
    small: {
      fontSize: '0.875rem',
      minHeight: '32px',
      padding: '0.5rem 1rem',
    },
  };

  const variantStyles = {
    danger: {
      backgroundColor: '#dc3545',
      border: '2px solid #dc3545',
      color: '#ffffff',
    },
    outline: {
      backgroundColor: 'transparent',
      border: `2px solid ${theme.textColor}`,
      color: theme.textColor,
    },
    primary: {
      backgroundColor: theme.primaryColor,
      border: `2px solid ${theme.primaryColor}`,
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: theme.secondaryColor,
      border: `2px solid ${theme.secondaryColor}`,
      color: '#ffffff',
    },
    success: {
      backgroundColor: '#28a745',
      border: '2px solid #28a745',
      color: '#ffffff',
    },
  };

  const hoverStyles = {
    danger: { backgroundColor: '#c82333' },
    outline: { backgroundColor: theme.textColor, color: theme.backgroundColor },
    primary: { backgroundColor: '#1565c0' },
    secondary: { backgroundColor: '#c51162' },
    success: { backgroundColor: '#218838' },
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      className={className}
      data-testid={testId}
      disabled={disabled || loading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, hoverStyles[variant]);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, variantStyles[variant]);
        }
      }}
      role="button"
      style={combinedStyles}
      tabIndex={disabled ? -1 : 0}
      type={type}
    >
      {loading && (
        <span
          style={{
            animation: 'spin 1s linear infinite',
            border: '2px solid transparent',
            borderRadius: '50%',
            borderTop: '2px solid currentColor',
            display: 'inline-block',
            height: '16px',
            marginRight: '8px',
            width: '16px',
          }}
        />
      )}
      {children}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
