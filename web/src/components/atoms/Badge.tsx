// ========================================
// Badge Atom Component
// ========================================

import type React from 'react';
import { useTheme } from '../../contexts/ApplicationContext';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
  rounded?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'medium',
  rounded = true,
  className = '',
  'data-testid': testId,
}: BadgeProps) {
  const { theme } = useTheme();

  const baseStyles = {
    alignItems: 'center',
    border: 'none',
    borderRadius: rounded ? '50px' : '4px',
    display: 'inline-flex',
    fontFamily: 'inherit',
    fontWeight: '500',
    justifyContent: 'center',
    lineHeight: 1,
    textAlign: 'center' as const,
    verticalAlign: 'baseline',
    whiteSpace: 'nowrap' as const,
  };

  const sizeStyles = {
    large: {
      fontSize: '1rem',
      minHeight: '28px',
      padding: '0.5rem 1rem',
    },
    medium: {
      fontSize: '0.875rem',
      minHeight: '24px',
      padding: '0.375rem 0.75rem',
    },
    small: {
      fontSize: '0.75rem',
      minHeight: '20px',
      padding: '0.25rem 0.5rem',
    },
  };

  const variantStyles = {
    danger: {
      backgroundColor: '#dc3545',
      color: '#ffffff',
    },
    dark: {
      backgroundColor: '#343a40',
      color: '#ffffff',
    },
    info: {
      backgroundColor: '#17a2b8',
      color: '#ffffff',
    },
    light: {
      backgroundColor: '#f8f9fa',
      color: '#495057',
    },
    primary: {
      backgroundColor: theme.primaryColor,
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: theme.secondaryColor,
      color: '#ffffff',
    },
    success: {
      backgroundColor: '#28a745',
      color: '#ffffff',
    },
    warning: {
      backgroundColor: '#ffc107',
      color: '#000000',
    },
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  return (
    <span
      aria-label={typeof children === 'string' ? children : undefined}
      className={className}
      data-testid={testId}
      role="status"
      style={combinedStyles}
    >
      {children}
    </span>
  );
}
