// ========================================
// Input Atom Component
// ========================================

import type React from 'react';
import { forwardRef } from 'react';
import { useTheme } from '../../contexts/ApplicationContext';

export interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url' | 'range';
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: string | number) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  error?: boolean;
  errorMessage?: string;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  className?: string;
  'data-testid'?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      value,
      defaultValue,
      placeholder,
      disabled = false,
      readOnly = false,
      required = false,
      min,
      max,
      step,
      onChange,
      onBlur,
      onFocus,
      onKeyDown,
      error = false,
      errorMessage,
      size = 'medium',
      fullWidth = false,
      className = '',
      'data-testid': testId,
      id,
      name,
      autoComplete,
      autoFocus = false,
    },
    ref
  ) => {
    const { theme } = useTheme();

    const baseStyles = {
      backgroundColor: disabled ? '#f8f9fa' : theme.backgroundColor,
      border: `2px solid ${error ? '#dc3545' : theme.mode === 'dark' ? '#444' : '#ccc'}`,
      borderRadius: '4px',
      boxSizing: 'border-box' as const,
      color: theme.textColor,
      display: 'block',
      fontFamily: 'inherit',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.2s ease-in-out',
      width: fullWidth ? '100%' : 'auto',
    };

    const sizeStyles = {
      large: {
        fontSize: '1.125rem',
        minHeight: '48px',
        padding: '0.75rem 1.25rem',
      },
      medium: {
        fontSize: '1rem',
        minHeight: '40px',
        padding: '0.5rem 1rem',
      },
      small: {
        fontSize: '0.875rem',
        minHeight: '32px',
        padding: '0.375rem 0.75rem',
      },
    };

    const focusStyles = {
      borderColor: error ? '#dc3545' : theme.primaryColor,
      boxShadow: `0 0 0 3px ${error ? 'rgba(220, 53, 69, 0.25)' : 'rgba(25, 118, 210, 0.25)'}`,
    };

    const combinedStyles = {
      ...baseStyles,
      ...sizeStyles[size],
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        const newValue =
          type === 'number' ? parseFloat(event.target.value) || 0 : event.target.value;
        onChange(newValue);
      }
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      Object.assign(event.target.style, focusStyles);
      if (onFocus) {
        onFocus();
      }
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      Object.assign(event.target.style, {
        borderColor: error ? '#dc3545' : theme.mode === 'dark' ? '#444' : '#ccc',
        boxShadow: 'none',
      });
      if (onBlur) {
        onBlur();
      }
    };

    return (
      <div style={{ width: fullWidth ? '100%' : 'auto' }}>
        <input
          aria-describedby={error && errorMessage ? `${id}-error` : undefined}
          aria-invalid={error}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={className}
          data-testid={testId}
          defaultValue={defaultValue}
          disabled={disabled}
          id={id}
          max={max}
          min={min}
          name={name}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          readOnly={readOnly}
          ref={ref}
          required={required}
          step={step}
          style={combinedStyles}
          type={type}
          value={value}
        />
        {error && errorMessage && (
          <div
            aria-live="polite"
            id={`${id}-error`}
            role="alert"
            style={{
              color: '#dc3545',
              fontSize: '0.875rem',
              lineHeight: 1.4,
              marginTop: '0.25rem',
            }}
          >
            {errorMessage}
          </div>
        )}
      </div>
    );
  }
);
