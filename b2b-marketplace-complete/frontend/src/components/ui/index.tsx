import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

// Utility function for merging classnames
export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };

  return (
    <button
      className={cn(variantClasses[variant], sizeClasses[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="label">
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cn('input', error && 'input-error', className)}
          {...props}
        />
        {error && (
          <p className="text-sm text-danger-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-sm text-secondary-500">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="label">
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn('input min-h-[100px] resize-y', error && 'input-error', className)}
          {...props}
        />
        {error && (
          <p className="text-sm text-danger-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="label">
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn('input', error && 'input-error', className)}
          {...props}
        >
          <option value="">Select...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-danger-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

// Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <div className={cn('card', className)}>{children}</div>;
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-secondary-200', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn('card-body', className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <div className={cn('px-6 py-4 border-t border-secondary-200 bg-secondary-50', className)}>
      {children}
    </div>
  );
}

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
  className?: string;
}

export function Badge({ children, variant = 'secondary', className }: BadgeProps) {
  const variantClasses = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    secondary: 'badge-secondary',
  };

  return (
    <span className={cn(variantClasses[variant], className)}>{children}</span>
  );
}

// Alert Component
interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  className?: string;
}

export function Alert({ children, variant = 'info', title, className }: AlertProps) {
  const variantConfig = {
    info: {
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      text: 'text-primary-800',
      icon: Info,
    },
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      text: 'text-success-700',
      icon: CheckCircle,
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      text: 'text-warning-700',
      icon: AlertCircle,
    },
    error: {
      bg: 'bg-danger-50',
      border: 'border-danger-200',
      text: 'text-danger-700',
      icon: XCircle,
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 flex gap-3',
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div>
        {title && <h5 className="font-medium mb-1">{title}</h5>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

// Spinner Component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 className={cn('animate-spin text-primary-600', sizeClasses[size], className)} />
  );
}

// Loading Screen Component
export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-secondary-600">Loading...</p>
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="mx-auto w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-secondary-900 mb-1">{title}</h3>
      {description && (
        <p className="text-secondary-500 mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {action}
    </div>
  );
}

// Avatar Component
interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }

  return (
    <span className={cn('avatar', sizeClasses[size], className)}>{initials}</span>
  );
}

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        <div
          className={cn(
            'relative bg-white rounded-xl shadow-soft-lg w-full animate-slide-up',
            sizeClasses[size]
          )}
        >
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
              <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Alert,
  Spinner,
  LoadingScreen,
  EmptyState,
  Avatar,
  Modal,
};
