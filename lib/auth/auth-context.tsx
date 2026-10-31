'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { getClientAuth, isFirebaseClientConfigured } from '@/lib/firebase/client';
import type {
  ClientRoleProfile,
  PartnerRoleProfile,
  PlatformSettingsBundle,
  XpoUser,
} from '@/lib/types/domain';

export interface AuthProfilesState {
  client: ClientRoleProfile | null;
  partner: PartnerRoleProfile | null;
}

interface AuthState {
  loading: boolean;
  configured: boolean;
  user: XpoUser | null;
  profiles: AuthProfilesState;
  settings: PlatformSettingsBundle | null;
  error: string | null;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  loading: true,
  configured: true,
  user: null,
  profiles: { client: null, partner: null },
  settings: null,
  error: null,
  refreshSession: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [user, setUser] = useState<XpoUser | null>(null);
  const [profiles, setProfiles] = useState<AuthProfilesState>({
    client: null,
    partner: null,
  });
  const [settings, setSettings] = useState<PlatformSettingsBundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.status === 503) {
        setConfigured(false);
        setUser(null);
        return;
      }
      setConfigured(true);
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data.user || null);
      setProfiles(data.profiles || { client: null, partner: null });
      setSettings(data.settings || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const signOut = useCallback(async () => {
    const redirectTarget = user?.isSuperadmin ? '/admin/login' : '/login';
    await fetch('/api/auth/session', { method: 'DELETE' });
    if (isFirebaseClientConfigured()) {
      try {
        await firebaseSignOut(getClientAuth());
      } catch {
        // Ignore client auth signout errors
      }
    }
    setUser(null);
    setProfiles({ client: null, partner: null });
    window.location.href = redirectTarget;
  }, [user?.isSuperadmin]);

  return (
    <AuthContext.Provider
      value={{
        loading,
        configured,
        user,
        profiles,
        settings,
        error,
        refreshSession,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
