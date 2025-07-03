// ========================================
// Label Atom Component
// ========================================

import type React from 'react';
import { useTheme } from '../../contexts/ApplicationContext';

export interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  weight?: 'normal' | 'medium' | 'bold';
  className?: string;
  'data-testid'?: string;
}

export function Label({
  children,
  htmlFor,
  required = false,
  disabled = false,
  size = 'medium',
  weight = 'medium',
  className = '',
  'data-testid': testId,
}: LabelProps) {
  const { theme } = useTheme();

  const baseStyles = {
    color: disabled ? (theme.mode === 'dark' ? '#666' : '#999') : theme.textColor,
    cursor: disabled ? 'not-allowed' : htmlFor ? 'pointer' : 'default',
    display: 'block',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    marginBottom: '0.25rem',
  };

  const sizeStyles = {
    large: {
      fontSize: '1rem',
    },
    medium: {
      fontSize: '0.875rem',
    },
    small: {
      fontSize: '0.75rem',
    },
  };

  const weightStyles = {
    bold: {
      fontWeight: '600',
    },
    medium: {
      fontWeight: '500',
    },
    normal: {
      fontWeight: '400',
    },
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...weightStyles[weight],
  };

  return (
    <label className={className} data-testid={testId} htmlFor={htmlFor} style={combinedStyles}>
      {children}
      {required && (
        <span
          aria-label="required"
          style={{
            color: '#dc3545',
            fontWeight: 'bold',
            marginLeft: '0.25rem',
          }}
        >
          *
        </span>
      )}
    </label>
  );
}
