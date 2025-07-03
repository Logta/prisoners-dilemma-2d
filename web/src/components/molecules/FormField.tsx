// ========================================
// FormField Molecule Component
// ========================================

import { Input, type InputProps } from '../atoms/Input';
import { Label } from '../atoms/Label';

export interface FormFieldProps extends Omit<InputProps, 'id'> {
  label: string;
  id: string;
  helperText?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  className?: string;
  'data-testid'?: string;
}

export function FormField({
  label,
  id,
  helperText,
  required = false,
  error = false,
  errorMessage,
  className = '',
  'data-testid': testId,
  ...inputProps
}: FormFieldProps) {
  const fieldId = id;
  const helperTextId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;

  return (
    <div className={className} data-testid={testId} style={{ marginBottom: '1rem' }}>
      <Label disabled={inputProps.disabled} htmlFor={fieldId} required={required}>
        {label}
      </Label>

      <Input
        {...inputProps}
        aria-describedby={
          [helperText ? helperTextId : null, error && errorMessage ? errorId : null]
            .filter(Boolean)
            .join(' ') || undefined
        }
        error={error}
        errorMessage={errorMessage}
        id={fieldId}
        required={required}
      />

      {helperText && (
        <div
          id={helperTextId}
          style={{
            color: '#6c757d',
            fontSize: '0.75rem',
            lineHeight: 1.4,
            marginTop: '0.25rem',
          }}
        >
          {helperText}
        </div>
      )}
    </div>
  );
}
