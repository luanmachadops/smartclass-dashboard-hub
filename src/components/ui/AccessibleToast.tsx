import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900 dark:text-green-100',
        error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900 dark:text-red-100',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
        info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  default: Info,
};

export interface AccessibleToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onClose?: () => void;
  duration?: number;
  persistent?: boolean;
  announceToScreenReader?: boolean;
}

const AccessibleToast = React.forwardRef<HTMLDivElement, AccessibleToastProps>(
  (
    {
      className,
      variant = 'default',
      title,
      description,
      action,
      onClose,
      duration = 5000,
      persistent = false,
      announceToScreenReader = true,
      ...props
    },
    ref
  ) => {
    const toastRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();
    const Icon = iconMap[variant || 'default'];

    // Auto-dismiss functionality
    useEffect(() => {
      if (!persistent && duration > 0 && onClose) {
        timeoutRef.current = setTimeout(() => {
          onClose();
        }, duration);
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [duration, onClose, persistent]);

    // Pause auto-dismiss on hover/focus
    const handleMouseEnter = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    const handleMouseLeave = () => {
      if (!persistent && duration > 0 && onClose) {
        timeoutRef.current = setTimeout(() => {
          onClose();
        }, duration);
      }
    };

    // Keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
      }
    };

    // Screen reader announcement
    useEffect(() => {
      if (announceToScreenReader && toastRef.current) {
        const announcement = `${title ? title + '. ' : ''}${description || ''}`;
        
        // Create a temporary element for screen reader announcement
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', variant === 'error' ? 'assertive' : 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.textContent = announcement;
        
        document.body.appendChild(announcer);
        
        // Clean up after announcement
        setTimeout(() => {
          document.body.removeChild(announcer);
        }, 1000);
      }
    }, [title, description, variant, announceToScreenReader]);

    return (
      <div
        ref={ref || toastRef}
        className={cn(toastVariants({ variant }), className)}
        role="alert"
        aria-live={variant === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
        tabIndex={0}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <div className="flex items-start space-x-3">
          {Icon && (
            <Icon
              className="h-5 w-5 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
          )}
          <div className="flex-1 space-y-1">
            {title && (
              <div className="text-sm font-semibold leading-none tracking-tight">
                {title}
              </div>
            )}
            {description && (
              <div className="text-sm opacity-90 leading-relaxed">
                {description}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
          
          {onClose && (
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent p-0 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
              onClick={onClose}
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

AccessibleToast.displayName = 'AccessibleToast';

export { AccessibleToast, toastVariants };