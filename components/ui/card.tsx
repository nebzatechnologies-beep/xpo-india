import React from 'react';
import { cn } from '@/lib/utils/cn';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white border border-[#EBEBEB] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all hover:border-[#D0D0D0] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ className, children }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold text-[#222222]', className)}>{children}</h3>;
}

export function CardDescription({ className, children }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-[#717171] mt-1', className)}>{children}</p>;
}