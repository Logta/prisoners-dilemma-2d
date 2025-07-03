// ========================================
// StatCard Molecule Component
// ========================================

import type React from 'react';
import { useTheme } from '../../contexts/ApplicationContext';
import { Badge } from '../atoms/Badge';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string | number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  variant = 'default',
  icon,
  className = '',
  'data-testid': testId,
}: StatCardProps) {
  const { theme } = useTheme();

  const cardStyles = {
    backgroundColor: theme.backgroundColor,
    border: `1px solid ${theme.mode === 'dark' ? '#444' : '#e0e0e0'}`,
    borderRadius: '8px',
    boxShadow:
      theme.mode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    padding: '1.5rem',
    position: 'relative' as const,
    transition: 'all 0.2s ease-in-out',
  };

  const variantColors = {
    danger: '#dc3545',
    default: theme.textColor,
    primary: theme.primaryColor,
    success: '#28a745',
    warning: '#ffc107',
  };

  const accentColor = variantColors[variant];

  const titleStyles = {
    color: theme.mode === 'dark' ? '#b0b0b0' : '#6c757d',
    fontSize: '0.875rem',
    fontWeight: '500',
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
    textTransform: 'uppercase' as const,
  };

  const valueStyles = {
    color: accentColor,
    fontSize: '2rem',
    fontWeight: '700',
    lineHeight: 1.2,
    marginBottom: subtitle || trend ? '0.25rem' : '0',
  };

  const subtitleStyles = {
    color: theme.mode === 'dark' ? '#888' : '#6c757d',
    fontSize: '0.75rem',
    marginBottom: trend ? '0.5rem' : '0',
  };

  const trendStyles = {
    alignItems: 'center',
    display: 'flex',
    fontSize: '0.75rem',
    gap: '0.5rem',
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <span style={{ color: '#28a745', fontSize: '1rem' }}>↗</span>;
      case 'down':
        return <span style={{ color: '#dc3545', fontSize: '1rem' }}>↘</span>;
      case 'stable':
        return <span style={{ color: '#6c757d', fontSize: '1rem' }}>→</span>;
      default:
        return null;
    }
  };

  const getTrendBadgeVariant = () => {
    switch (trend) {
      case 'up':
        return 'success';
      case 'down':
        return 'danger';
      case 'stable':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div
      className={className}
      data-testid={testId}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow =
          theme.mode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.4)' : '0 4px 8px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow =
          theme.mode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)';
      }}
      style={cardStyles}
    >
      {/* アクセントライン */}
      {variant !== 'default' && (
        <div
          style={{
            backgroundColor: accentColor,
            height: '3px',
            left: 0,
            position: 'absolute',
            right: 0,
            top: 0,
          }}
        />
      )}

      {/* ヘッダー */}
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <h3 style={titleStyles}>{title}</h3>
        {icon && <div style={{ color: accentColor, fontSize: '1.5rem' }}>{icon}</div>}
      </div>

      {/* メイン値 */}
      <div style={valueStyles}>{typeof value === 'number' ? value.toLocaleString() : value}</div>

      {/* サブタイトル */}
      {subtitle && <div style={subtitleStyles}>{subtitle}</div>}

      {/* トレンド */}
      {trend && (
        <div style={trendStyles}>
          {getTrendIcon()}
          {trendValue && (
            <Badge size="small" variant={getTrendBadgeVariant()}>
              {trendValue}
            </Badge>
          )}
          <span style={{ color: theme.mode === 'dark' ? '#888' : '#6c757d' }}>
            {trend === 'up' && '増加'}
            {trend === 'down' && '減少'}
            {trend === 'stable' && '安定'}
          </span>
        </div>
      )}
    </div>
  );
}
