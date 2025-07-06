import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
}

export function ErrorDisplay({
  error,
  title = 'エラー',
  onRetry,
  onDismiss,
  dismissible = false,
  className,
  ...props
}: ErrorDisplayProps) {
  return (
    <Card className={cn("border-destructive/50 bg-destructive/5 max-w-md", className)} {...props}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <CardTitle className="text-destructive">{title}</CardTitle>
          </div>
          {dismissible && onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-destructive/10"
              onClick={onDismiss}
              data-testid="error-close-button"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">閉じる</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        {onRetry && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              data-testid="error-retry-button"
            >
              再試行
            </Button>
            {dismissible && onDismiss && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onDismiss}
                data-testid="error-dismiss-button"
              >
                閉じる
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}