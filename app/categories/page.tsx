'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ArrowRight, Factory, Code, Briefcase, Truck, ShoppingBag, Activity } from 'lucide-react';

const iconMap: Record<string, any> = {
  Factory,
  Code,
  Briefcase,
  Truck,
  ShoppingBag,
  Activity,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.categories || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="text-[#E8192C] border-red-200 bg-red-50/50 mb-3 px-3 py-1 font-semibold">
            Cross-Sector Taxonomies
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-[#222222] tracking-tight">
            Explore Opportunities by Sector
          </h1>
          <p className="mt-3 text-base text-[#717171]">
            XPO India is sector-agnostic. Discover live leads and qualified partners across industrial, digital, professional, and trade sectors.
          </p>

          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="w-5 h-5 text-[#717171] absolute left-3.5 top-3.5" />
            <Input
              placeholder="Search industries, categories, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 rounded-2xl border-[#EBEBEB] text-sm"
            />
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((cat) => {
            const Icon = iconMap[cat.icon] || Factory;
            return (
              <Link key={cat._id} href={`/opportunities?category=${cat._id}`}>
                <Card className="p-6 rounded-3xl border border-[#EBEBEB] hover:border-[#222222] hover:shadow-md transition-all group h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E8192C] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-[#222222] group-hover:text-[#E8192C] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-[#717171] mt-1.5 leading-relaxed">
                      {cat.description || 'Verified commercial leads, tenders, and vendor exchange opportunities.'}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs font-semibold text-[#E8192C]">
                    <span>Browse Opportunities</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}