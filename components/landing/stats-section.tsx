'use client';
import React from 'react';

export function StatsSection() {
  const stats = [
    { label: '5-Min Partner Response Window', value: '300s' },
    { label: 'Verified Clients & Partners', value: '45,000+' },
    { label: 'Mutual-Consent Connections', value: '85,000+' },
    { label: '4-Tier Industry Categories', value: '150+' },
  ];

  return (
    <section className="py-16 bg-[#111827] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
          {stats.map((s) => (
            <div key={s.label} className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                {s.value}
              </div>
              <div className="mt-2 text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
