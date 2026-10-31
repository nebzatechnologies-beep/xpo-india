import React from 'react';
import { Card } from './card';

interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'red' | 'blue' | 'purple' | 'emerald' | 'amber' | 'slate';
}

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  trend,
  accentColor = 'red',
}: MetricCardProps) {
  const colorMap = {
    red: {
      bg: 'bg-red-50',
      text: 'text-[#E8192C]',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    purple: {
      bg: 'bg-[#F3F4F6]',
      text: 'text-[#111827]',
    },
    slate: {
      bg: 'bg-[#F3F4F6]',
      text: 'text-[#111827]',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
  };

  const currentTheme = colorMap[accentColor];

  return (
    <Card className="p-5 sm:p-6 rounded-2xl border border-[#E5E7EB] bg-white shadow-xs hover:border-[#D1D5DB] transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
          {label}
        </span>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${currentTheme.bg} ${currentTheme.text}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
              trend.isPositive !== false
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">{description}</p>
      )}
    </Card>
  );
}
