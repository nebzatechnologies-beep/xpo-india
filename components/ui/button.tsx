'use client';
import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-7 py-3.5 text-base',
    }[size];

    const variantClasses = {
      primary: 'bg-[#E8192C] text-white hover:bg-[#C0111F] shadow-sm hover:shadow-md active:scale-[0.99]',
      secondary: 'bg-[#222222] text-white hover:bg-[#000000] active:scale-[0.99]',
      outline: 'bg-white text-[#222222] border border-[#EBEBEB] hover:border-[#222222] hover:bg-[#F7F7F7]',
      ghost: 'bg-transparent text-[#222222] hover:bg-[#F7F7F7]',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-full transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none',
          sizeClasses,
          variantClasses,
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';