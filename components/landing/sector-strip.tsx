'use client';
import React from 'react';
import Link from 'next/link';

const SECTORS = [
  'Technology', 'Manufacturing', 'Design & Creative', 'Professional Services',
  'Marketing', 'Packaging & Boxes', 'Textiles & Garments', 'Trade & Supply',
  'Engineering', 'Consulting', 'Research', 'More'
];

export function SectorStrip() {
  return (
    <section className="py-6 border-y border-[#EBEBEB] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 justify-between">
          <div className="text-xs font-bold text-[#222222] uppercase tracking-wider shrink-0">
            One platform. Every sector.
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar pb-1 md:pb-0">
            {SECTORS.map((s, i) => (
              <Link
                key={i}
                href={'/absorber/opportunities?category=' + encodeURIComponent(s)}
                className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium text-[#717171] hover:text-[#222222] hover:bg-[#F7F7F7] border border-transparent hover:border-[#EBEBEB] transition-all"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
