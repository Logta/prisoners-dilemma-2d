// ========================================
// Loading Spinner Atom Component
// ========================================


interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
  'data-testid'?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  message, 
  className = '',
  'data-testid': testId 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div 
      className={`loading flex items-center ${className}`}
      data-testid={testId}
    >
      <div className={`spinner ${sizeClasses[size]}`}></div>
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
}