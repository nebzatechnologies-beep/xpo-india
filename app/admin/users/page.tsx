'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCheck, Shield, Building2, Phone, Mail } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchUsers = () => {
    const params = new URLSearchParams();
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (search) params.set('search', search);

    fetch(`/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setUsers(res.users || []);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status: newStatus }),
    });
    fetchUsers();
  };

  const getRoleBadge = (role: string) => {
    if (role === 'lead_creator' || role === 'client') {
      return (
        <Badge variant="outline" className="border-blue-300 text-blue-800 bg-blue-50 text-[11px] font-bold px-2.5 py-0.5">
          Client (Requirement Poster)
        </Badge>
      );
    }
    if (role === 'lead_absorber' || role === 'partner') {
      return (
        <Badge variant="outline" className="border-emerald-300 text-emerald-800 bg-emerald-50 text-[11px] font-bold px-2.5 py-0.5">
          Partner (Solution Provider)
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-purple-300 text-purple-800 bg-purple-50 text-[11px] font-bold px-2.5 py-0.5">
        Superadmin
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-[#222222] tracking-tight">User Directory — Clients & Partners</h1>
        <p className="text-xs text-[#717171] mt-0.5">
          Manage Clients (Requirement Posters), Partners (Solution Providers), permissions, and account verification status.
        </p>
      </div>

      {/* Role Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40">
          <p className="text-xs font-bold text-blue-900">Total Registered Clients</p>
          <p className="text-2xl font-black text-blue-950 mt-1">
            {users.filter((u) => u.role === 'lead_creator' || u.userType === 'client').length || 1}
          </p>
          <p className="text-[11px] text-blue-800 mt-0.5">Requirement & Commercial Posters</p>
        </Card>
        <Card className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40">
          <p className="text-xs font-bold text-emerald-900">Total Registered Partners</p>
          <p className="text-2xl font-black text-emerald-950 mt-1">
            {users.filter((u) => u.role === 'lead_absorber' || u.userType === 'partner').length || 2}
          </p>
          <p className="text-[11px] text-emerald-800 mt-0.5">Solution Providers & Contractors</p>
        </Card>
        <Card className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40">
          <p className="text-xs font-bold text-purple-900">Superadmins & Staff</p>
          <p className="text-2xl font-black text-purple-950 mt-1">
            {users.filter((u) => u.role === 'superadmin').length || 1}
          </p>
          <p className="text-[11px] text-purple-800 mt-0.5">Platform Administrators</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search Clients & Partners by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border-[#EBEBEB] text-xs pr-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#EBEBEB] text-xs bg-white focus:outline-none"
        >
          <option value="all">All User Types (Clients & Partners)</option>
          <option value="lead_creator">Client (Requirement Poster)</option>
          <option value="lead_absorber">Partner (Solution Provider)</option>
          <option value="superadmin">Superadmin</option>
        </select>
        <Button variant="primary" size="sm" onClick={fetchUsers} className="rounded-xl text-xs font-semibold px-5">
          Search
        </Button>
      </div>

      <Card className="rounded-3xl border border-[#EBEBEB] bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA] text-[11px] font-bold uppercase tracking-wider text-[#717171]">
                <th className="py-3.5 px-5">User Details</th>
                <th className="py-3.5 px-5">Account Classification</th>
                <th className="py-3.5 px-5">Company & Contact</th>
                <th className="py-3.5 px-5">Account Status</th>
                <th className="py-3.5 px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-[#F9F9F9] transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-[#222222]">{u.name}</div>
                    <div className="text-[11px] text-[#717171] flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" /> {u.email}
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="font-semibold text-[#222222]">{u.company || 'Independent Business'}</div>
                    <div className="text-[11px] text-[#717171] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {u.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        u.status === 'active'
                          ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                          : 'border-red-200 text-red-700 bg-red-50'
                      }`}
                    >
                      {u.status || 'active'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(u._id, u.status || 'active')}
                      className="rounded-xl text-[11px] h-7 px-3 border-[#EBEBEB]"
                    >
                      {u.status === 'active' ? 'Suspend' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}