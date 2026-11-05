'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Main Superadmin app & Login render their own full-bleed .xt .shell
  if (
    pathname === '/admin' ||
    pathname === '/superadmin' ||
    pathname === '/admin/dashboard' ||
    pathname === '/superadmin/dashboard' ||
    pathname === '/admin/login' ||
    pathname === '/superadmin/login'
  ) {
    return <>{children}</>;
  }

  const adminName = user?.displayName || 'Pavan (Superadmin)';
  const adminSub = user?.email || 'XPO India · Marketplace Operations';

  return (
    <div
      className={`xt ${dark ? 'dark' : ''}`}
      onClick={() => {
        if (menuOpen) setMenuOpen(false);
      }}
    >
      <div className="shell">
        <aside className="side">
          <div
            style={{
              padding: '4px 10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Link href="/superadmin" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <img
                src="/xpo-logo.png"
                alt="XPO India"
                style={{ height: 28, width: 'auto', objectFit: 'contain' }}
              />
            </Link>
            <span className="chip p" style={{ fontSize: 10.5 }}>
              SUPERADMIN
            </span>
          </div>

          <Link
            href="/superadmin"
            className="btn b2"
            style={{ width: '100%', marginBottom: 12, textDecoration: 'none' }}
          >
            ← Back to Review queue
          </Link>

          <nav aria-label="Superadmin" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Link
              href="/superadmin"
              className="nav pn"
              style={{ textDecoration: 'none' }}
            >
              <span>Review queue</span>
            </Link>
            <Link
              href="/superadmin/leads"
              className={`nav pn ${pathname.includes('/leads') ? 'on' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <span>Requests &amp; waves</span>
            </Link>
            <Link
              href="/superadmin/clients"
              className={`nav pn ${pathname.includes('/clients') || pathname.includes('/partners') ? 'on' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <span>Clients &amp; partners</span>
            </Link>
            <Link
              href="/superadmin/taxonomy"
              className={`nav pn ${pathname.includes('/taxonomy') ? 'on' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <span>Categories</span>
            </Link>
            <Link
              href="/superadmin/whatsapp/simulator"
              className={`nav pn ${pathname.includes('/whatsapp') ? 'on' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <span>WhatsApp simulator</span>
            </Link>
            <Link
              href="/superadmin/settings/gateways"
              className={`nav pn ${pathname.includes('/settings') ? 'on' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <span>API &amp; payment keys</span>
            </Link>
          </nav>

          <div
            style={{
              marginTop: 'auto',
              padding: 12,
              borderTop: '1px solid var(--ln)',
              fontSize: 12,
              color: 'var(--tx3)',
              lineHeight: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--tx2)' }}>Switch workspace</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                href="/dashboard/client"
                style={{ color: 'var(--tx)', fontWeight: 700, textDecoration: 'none' }}
              >
                Client app →
              </Link>
              <Link
                href="/dashboard/partner"
                style={{ color: 'var(--tx)', fontWeight: 700, textDecoration: 'none' }}
              >
                Partner app →
              </Link>
            </div>
          </div>
        </aside>

        <div className="col">
          <header className="top" onClick={(e) => e.stopPropagation()}>
            <div className="crumb fx">
              <Link href="/superadmin" className="bl" style={{ fontSize: 13, textDecoration: 'none' }}>
                Superadmin
              </Link>
              <span>/</span>
              <b>{pathname.replace(/^\/(super)?admin\//, '').replace(/\//g, ' / ')}</b>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
              <Link href="/superadmin" className="pill hide-sm" style={{ textDecoration: 'none' }}>
                <span className="pdot" style={{ background: '#16A34A' }} />
                <span>Review queue</span>
              </Link>

              <button
                type="button"
                className="av"
                aria-label="Superadmin menu"
                onClick={() => setMenuOpen((m) => !m)}
              >
                SA
              </button>

              {menuOpen && (
                <div className="menu" role="menu" aria-label="Account">
                  <div
                    style={{
                      padding: '12px 12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      borderBottom: '1px solid var(--ln)',
                      marginBottom: 6,
                    }}
                  >
                    <b style={{ fontSize: 15 }}>{adminName}</b>
                    <span style={{ fontSize: 13, color: 'var(--tx2)' }}>{adminSub}</span>
                  </div>

                  <Link href="/superadmin" className="mi" style={{ textDecoration: 'none' }}>
                    <span>Review queue &amp; overview</span>
                  </Link>
                  <Link href="/superadmin/verification" className="mi" style={{ textDecoration: 'none' }}>
                    <span>Verification &amp; moderation</span>
                    <span className="chip g">Active</span>
                  </Link>
                  <Link href="/superadmin/subscriptions" className="mi" style={{ textDecoration: 'none' }}>
                    <span>Account &amp; Plans</span>
                    <span className="chip">₹299 / ₹999</span>
                  </Link>
                  <Link href="/superadmin/settings/gateways" className="mi" style={{ textDecoration: 'none' }}>
                    <span>Settings &amp; gateways</span>
                  </Link>
                  <Link href="/superadmin/audit-logs" className="mi" style={{ textDecoration: 'none' }}>
                    <span>Help &amp; audit log</span>
                  </Link>
                  <button
                    type="button"
                    className="mi"
                    onClick={() => {
                      setDark((d) => !d);
                      setMenuOpen(false);
                    }}
                  >
                    <span>{dark ? 'Light mode' : 'Dark mode'}</span>
                    <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{dark ? 'On' : 'Off'}</span>
                  </button>
                  <button
                    type="button"
                    className="mi"
                    style={{
                      color: 'var(--rtx)',
                      borderTop: '1px solid var(--ln)',
                      borderRadius: '0 0 10px 10px',
                      marginTop: 6,
                    }}
                    onClick={async () => {
                      await signOut();
                      router.push('/superadmin/login');
                    }}
                  >
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className="pg" style={{ maxWidth: 1040 }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
