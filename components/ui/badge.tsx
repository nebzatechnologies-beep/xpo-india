import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'neutral' | 'outline';
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  const variantClasses = {
    primary: 'bg-[#FFF0F1] text-[#E8192C] border border-[#FFD5D8]',
    success: 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]',
    warning: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
    neutral: 'bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]',
    outline: 'bg-transparent text-[#717171] border border-[#EBEBEB]',
  }[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}