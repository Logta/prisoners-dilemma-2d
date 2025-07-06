// ========================================
// Button Atom Component
// ========================================

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  'data-testid': testId,
}: ButtonProps) {
  const baseClass = 'button';
  const variantClass = variant === 'primary' ? '' : `button-${variant}`;
  const sizeClass = size === 'md' ? '' : `button-${size}`;
  
  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      data-testid={testId}
    >
      {loading && <div className="spinner w-4 h-4"></div>}
      {children}
    </button>
  );
}