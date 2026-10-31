'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, RefreshCw, Search, Shield, Users, X } from 'lucide-react';
import type {
  AnyRoleProfile,
  ClientRoleProfile,
  PartnerRoleProfile,
  XpoUser,
} from '@/lib/types/domain';

interface AdminUserRow extends XpoUser {
  roleProfiles: AnyRoleProfile[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inline quota editor state (replaces blocking window.prompt)
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [freeInput, setFreeInput] = useState<number>(5);
  const [paidInput, setPaidInput] = useState<number>(0);
  const [unlimitedInput, setUnlimitedInput] = useState<boolean>(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load users');
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchUser(payload: Record<string, unknown>) {
    const uid = String(payload.uid || '');
    try {
      setBusyUid(uid);
      setError(null);
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setEditingUid(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User update failed');
    } finally {
      setBusyUid(null);
    }
  }

  function startInlineQuotaEdit(u: AdminUserRow) {
    setEditingUid(u.uid);
    if (u.role === 'partner') {
      const pp = u.roleProfiles.find((p): p is PartnerRoleProfile => p.role === 'partner');
      setFreeInput(pp?.freeClaimsRemaining ?? 5);
      setPaidInput(pp?.paidClaimsRemaining ?? 0);
      setUnlimitedInput(Boolean(pp?.paidClaimsUnlimited));
    } else {
      const cp = u.roleProfiles.find((p): p is ClientRoleProfile => p.role === 'client');
      setFreeInput(cp?.freePartnerViewsRemaining ?? 5);
      setPaidInput(cp?.paidPartnerViewsRemaining ?? 0);
      setUnlimitedInput(Boolean(cp?.paidViewsUnlimited));
    }
  }

  function saveInlineQuotaEdit(u: AdminUserRow) {
    if (u.role === 'partner') {
      void patchUser({
        uid: u.uid,
        adjustPartnerFreeClaims: Math.max(0, Number(freeInput) || 0),
        adjustPartnerPaidClaims: Math.max(0, Number(paidInput) || 0),
        adjustPartnerUnlimited: unlimitedInput,
        quotaReason: 'Inline Superadmin quota update',
      });
    } else {
      void patchUser({
        uid: u.uid,
        adjustClientFreeViews: Math.max(0, Number(freeInput) || 0),
        adjustClientPaidViews: Math.max(0, Number(paidInput) || 0),
        adjustClientUnlimited: unlimitedInput,
        quotaReason: 'Inline Superadmin quota update',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#111827] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#111827]" />
            Registered Accounts & Quotas
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Manage registered Client and Partner accounts, adjust free/plan credits inline, and
            monitor verification statuses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs font-bold text-[#374151] hover:bg-gray-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Search & Role Filter */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, WhatsApp number, email, or city..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#D1D5DB]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white font-semibold"
        >
          <option value="">All Registered Accounts</option>
          <option value="client">Clients</option>
          <option value="partner">Partners</option>
        </select>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-xs text-[#6B7280]">
            <Loader2 className="w-4 h-4 animate-spin text-[#111827]" /> Loading accounts...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase text-[11px]">
                <tr>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">WhatsApp / City</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">KYC / Trust</th>
                  <th className="px-4 py-3">Credits (Free / Plan)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[#6B7280]">
                      No registered accounts match your filter.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const clientProf = u.roleProfiles.find(
                      (p): p is ClientRoleProfile => p.role === 'client'
                    );
                    const partnerProf = u.roleProfiles.find(
                      (p): p is PartnerRoleProfile => p.role === 'partner'
                    );
                    const isEditing = editingUid === u.uid;

                    return (
                      <tr key={u.uid} className="hover:bg-gray-50 align-top">
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#111827] flex items-center gap-1.5">
                            {u.displayName}
                            {u.isSuperadmin && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#111827] text-white text-[10px] font-extrabold">
                                <Shield className="w-3 h-3" /> Superadmin
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-[#6B7280]">
                            {u.email || u.uid}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-mono font-semibold text-[#111827]">
                            {u.phoneE164 || '—'}
                          </div>
                          <div className="text-[11px] text-[#6B7280]">
                            {u.primaryCity}, {u.country} ({u.billingCurrency})
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#111827] text-white">
                            {u.role}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              u.verificationStatus === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : u.verificationStatus === 'verification_pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-[#4B5563]'
                            }`}
                          >
                            {u.verificationStatus}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-[11px]">
                          {isEditing ? (
                            <div className="p-2.5 rounded-xl bg-white border border-[#D1D5DB] space-y-2 min-w-[200px]">
                              <div className="grid grid-cols-2 gap-2">
                                <label className="block">
                                  <span className="text-[10px] text-[#6B7280] font-bold block">
                                    Free Left
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={freeInput}
                                    onChange={(e) => setFreeInput(Number(e.target.value))}
                                    className="w-full px-2 py-1 rounded border border-[#D1D5DB] font-bold"
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-[10px] text-[#6B7280] font-bold block">
                                    Plan Left
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={paidInput}
                                    onChange={(e) => setPaidInput(Number(e.target.value))}
                                    className="w-full px-2 py-1 rounded border border-[#D1D5DB] font-bold"
                                  />
                                </label>
                              </div>
                              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#111827]">
                                <input
                                  type="checkbox"
                                  checked={unlimitedInput}
                                  onChange={(e) => setUnlimitedInput(e.target.checked)}
                                  className="accent-[#111827]"
                                />
                                Unlimited Plan Override
                              </label>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  disabled={busyUid === u.uid}
                                  onClick={() => saveInlineQuotaEdit(u)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111827] text-white font-bold text-[10px] disabled:opacity-50"
                                >
                                  {busyUid === u.uid ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  <span>Save</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingUid(null)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-300 text-[#374151] font-semibold text-[10px]"
                                >
                                  <X className="w-3 h-3" /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : u.role === 'partner' ? (
                            <div>
                              Free Claims:{' '}
                              <strong className="text-[#111827]">
                                {partnerProf?.freeClaimsRemaining ?? 5}
                              </strong>{' '}
                              | Plan:{' '}
                              <strong className="text-[#111827]">
                                {partnerProf?.paidClaimsUnlimited
                                  ? 'Unlimited'
                                  : partnerProf?.paidClaimsRemaining ?? 0}
                              </strong>
                            </div>
                          ) : (
                            <div>
                              Free Views:{' '}
                              <strong className="text-[#111827]">
                                {clientProf?.freePartnerViewsRemaining ?? 5}
                              </strong>{' '}
                              | Plan:{' '}
                              <strong className="text-[#111827]">
                                {clientProf?.paidViewsUnlimited
                                  ? 'Unlimited'
                                  : clientProf?.paidPartnerViewsRemaining ?? 0}
                              </strong>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              u.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={busyUid === u.uid}
                              onClick={() => {
                                if (isEditing) {
                                  setEditingUid(null);
                                } else {
                                  startInlineQuotaEdit(u);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] shadow-xs transition-colors ${
                                isEditing
                                  ? 'border-[#111827] bg-[#111827] text-white'
                                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {isEditing ? 'Close Editor' : 'Adjust Credits'}
                            </button>
                            <button
                              type="button"
                              disabled={busyUid === u.uid}
                              onClick={() =>
                                void patchUser({
                                  uid: u.uid,
                                  status: u.status === 'active' ? 'suspended' : 'active',
                                  })
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] disabled:opacity-50 ${
                                u.status === 'active'
                                  ? 'border border-red-200 text-red-700 hover:bg-red-50'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {busyUid === u.uid && <Loader2 className="w-3 h-3 animate-spin" />}
                              <span>{u.status === 'active' ? 'Suspend' : 'Activate'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
