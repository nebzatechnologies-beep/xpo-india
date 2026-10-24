import React from 'react';
import { Card } from './card';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <Card className="p-10 text-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#6B7280]">
        <Icon className="w-6 h-6" />
      </div>
      <div className="max-w-sm">
        <h3 className="text-sm font-bold text-[#111827]">{title}</h3>
        <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </Card>
  );
}
