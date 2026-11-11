'use client';

import type { SharedMarketplaceState } from '@/app/api/marketplace/state/route';

export type { SharedMarketplaceState, SharedMarketplaceState as MarketplaceLiveState };

const CHANNEL_NAME = 'xpo-marketplace-sync';

export async function fetchMarketplaceState(): Promise<SharedMarketplaceState | null> {
  try {
    const res = await fetch('/api/marketplace/state', {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.success && json.data) {
      return json.data as SharedMarketplaceState;
    }
    return null;
  } catch {
    return null;
  }
}

export async function postMarketplaceAction(
  action: string,
  payload?: Record<string, any>
): Promise<SharedMarketplaceState | null> {
  try {
    const res = await fetch('/api/marketplace/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.success && json.data) {
      const state = json.data as SharedMarketplaceState;
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel(CHANNEL_NAME);
          bc.postMessage({ type: 'STATE_UPDATED', state });
          bc.close();
        } catch {
          // ignore BroadcastChannel errors
        }
      }
      return state;
    }
    return null;
  } catch {
    return null;
  }
}

export function subscribeMarketplaceSync(
  onUpdate: (state: SharedMarketplaceState) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  let lastUpdatedAt = '';
  const notifyIfFresh = (st: SharedMarketplaceState | null) => {
    if (!st) return;
    if (st.updatedAt && st.updatedAt === lastUpdatedAt) return;
    lastUpdatedAt = st.updatedAt || String(Date.now());
    onUpdate(st);
  };

  let bc: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    try {
      bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (ev) => {
        if (ev?.data?.type === 'STATE_UPDATED' && ev.data.state) {
          notifyIfFresh(ev.data.state as SharedMarketplaceState);
        }
      };
    } catch {
      bc = null;
    }
  }

  const handleFocus = () => {
    fetchMarketplaceState().then((st) => {
      notifyIfFresh(st);
    });
  };

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') handleFocus();
  };

  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibility);

  // Real-time background sync interval across devices/sessions/webhooks
  const pollInterval = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      fetchMarketplaceState().then((st) => {
        notifyIfFresh(st);
      });
    }
  }, 4000);

  return () => {
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.clearInterval(pollInterval);
    if (bc) {
      try {
        bc.close();
      } catch {
        // ignore
      }
    }
  };
}
