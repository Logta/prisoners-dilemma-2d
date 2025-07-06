// ========================================
// Error Display Molecule Component
// ========================================

import { Button } from '../atoms/Button';

interface ErrorDisplayProps {
  error: string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function ErrorDisplay({
  error,
  title = 'エラー',
  onRetry,
  onDismiss,
  dismissible = false,
  className = '',
  'data-testid': testId,
}: ErrorDisplayProps) {
  return (
    <div 
      className={`card error-display ${className}`}
      data-testid={testId}
    >
      <div className="flex items-start gap-md">
        {/* Error Icon */}
        <div className="error-icon">
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" 
              fill="var(--color-error)"
            />
          </svg>
        </div>

        {/* Error Content */}
        <div className="flex-1">
          <h3 className="error-title">{title}</h3>
          <p className="error-message">{error}</p>
          
          {/* Action Buttons */}
          <div className="flex gap-sm" style={{ marginTop: 'var(--spacing-md)' }}>
            {onRetry && (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={onRetry}
                data-testid="error-retry-button"
              >
                再試行
              </Button>
            )}
            {dismissible && onDismiss && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={onDismiss}
                data-testid="error-dismiss-button"
              >
                閉じる
              </Button>
            )}
          </div>
        </div>

        {/* Close button for dismissible errors */}
        {dismissible && onDismiss && (
          <button 
            onClick={onDismiss}
            className="error-close-button"
            data-testid="error-close-button"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" 
                fill="var(--color-text-secondary)"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Inline styles for the error display
const styles = `
.error-display {
  border-color: var(--color-error);
  background-color: var(--color-surface);
  max-width: 500px;
}

.error-icon {
  flex-shrink: 0;
}

.error-title {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-error);
}

.error-message {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--color-text);
  line-height: 1.5;
}

.error-close-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-fast);
  flex-shrink: 0;
}

.error-close-button:hover {
  background-color: var(--color-border);
}
`;

// Inject styles (in a real app, this would be in a separate CSS file)
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('error-display-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'error-display-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}