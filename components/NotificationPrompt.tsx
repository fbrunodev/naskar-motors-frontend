'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { isPushSubscribed, subscribeToPush } from '@/lib/notifications';

const DISMISS_KEY = 'naskar_notif_dismissed_at';
const DISMISS_DAYS = 7;

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('PushManager' in window) || !('Notification' in window)) return;
    if (Notification.permission === 'denied') return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const days = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (days < DISMISS_DAYS) return;
    }

    isPushSubscribed().then(subscribed => {
      if (!subscribed) setShow(true);
    });
  }, []);

  async function handleEnable() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await subscribeToPush(token);
      setShow(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao ativar notificações.');
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  }

  if (!show) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      background: '#0a1628',
      borderRadius: 12,
      padding: '16px 20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      <span style={{ fontSize: 28, flexShrink: 0 }}>🔔</span>

      <div style={{ flex: 1 }}>
        <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, margin: 0 }}>
          Ativar notificações de vendas
        </p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 }}>
          Receba alertas em tempo real quando um veículo for vendido ou a meta estiver próxima.
        </p>
        {error && (
          <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{error}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.25)',
            color: 'rgba(255,255,255,0.7)',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          Agora não
        </button>
        <button
          onClick={handleEnable}
          disabled={loading}
          style={{
            background: '#cc0000',
            border: 'none',
            color: '#fff',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 600,
            opacity: loading ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Ativando...' : '🔔 Ativar'}
        </button>
      </div>
    </div>
  );
}
