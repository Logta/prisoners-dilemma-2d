// ========================================
// ControlButton Molecule Component
// ========================================

import React from 'react';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Spinner } from '../atoms/Spinner';

export interface ControlButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  tooltip?: string;
  keyboard?: string; // キーボードショートカットの表示
  fullWidth?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function ControlButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  icon,
  badge,
  badgeVariant = 'primary',
  tooltip,
  keyboard,
  fullWidth = false,
  className = '',
  'data-testid': testId,
}: ControlButtonProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  const buttonContent = (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: '0.5rem',
        position: 'relative',
      }}
    >
      {loading ? (
        <Spinner size="small" />
      ) : icon ? (
        <span style={{ fontSize: '1.2em' }}>{icon}</span>
      ) : null}

      <span>{children}</span>

      {keyboard && (
        <Badge size="small" variant="light">
          {keyboard}
        </Badge>
      )}

      {badge && (
        <Badge size="small" variant={badgeVariant}>
          {badge}
        </Badge>
      )}
    </div>
  );

  const button = (
    <div
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ display: fullWidth ? 'block' : 'inline-block', position: 'relative' }}
    >
      <Button
        className={className}
        data-testid={testId}
        disabled={disabled}
        fullWidth={fullWidth}
        loading={loading}
        onClick={onClick}
        size={size}
        variant={variant}
      >
        {buttonContent}
      </Button>

      {tooltip && showTooltip && (
        <div
          role="tooltip"
          style={{
            backgroundColor: '#333',
            borderRadius: '4px',
            bottom: '100%',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            color: '#fff',
            fontSize: '0.75rem',
            left: '50%',
            marginBottom: '0.5rem',
            padding: '0.5rem 0.75rem',
            position: 'absolute',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            zIndex: 1000,
          }}
        >
          {tooltip}
          <div
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #333',
              height: 0,
              left: '50%',
              position: 'absolute',
              top: '100%',
              transform: 'translateX(-50%)',
              width: 0,
            }}
          />
        </div>
      )}
    </div>
  );

  return button;
}
