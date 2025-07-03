// ========================================
// Spinner Atom Component
// ========================================

import React from 'react';
import { useTheme } from '../../contexts/ApplicationContext';

export interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  thickness?: number;
  className?: string;
  'data-testid'?: string;
}

export function Spinner({
  size = 'medium',
  color,
  thickness = 2,
  className = '',
  'data-testid': testId,
}: SpinnerProps) {
  const { theme } = useTheme();

  const sizeStyles = {
    large: {
      height: '32px',
      width: '32px',
    },
    medium: {
      height: '24px',
      width: '24px',
    },
    small: {
      height: '16px',
      width: '16px',
    },
  };

  const spinnerColor = color || theme.primaryColor;

  const spinnerStyles = {
    ...sizeStyles[size],
    animation: 'spin 1s linear infinite',
    border: `${thickness}px solid transparent`,
    borderRadius: '50%',
    borderTop: `${thickness}px solid ${spinnerColor}`,
    display: 'inline-block',
  };

  return (
    <>
      <div
        aria-label="読み込み中"
        className={className}
        data-testid={testId}
        role="progressbar"
        style={spinnerStyles}
      />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
