const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export async function getVapidPublicKey(): Promise<string> {
  const res = await fetch(`${API_URL}/notifications/vapid-public-key`);
  if (!res.ok) throw new Error('Falha ao obter chave VAPID');
  const data = await res.json();
  return data.public_key;
}

export async function isPushSubscribed(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

export async function subscribeToPush(token: string): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push não suportado neste navegador');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permissão negada');

  const reg = await navigator.serviceWorker.ready;
  const vapidKey = await getVapidPublicKey();

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  const json = sub.toJSON();
  const res = await fetch(`${API_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh: (json.keys as Record<string, string>)?.p256dh,
      auth: (json.keys as Record<string, string>)?.auth,
    }),
  });
  if (!res.ok) throw new Error('Falha ao salvar subscription');
}

export async function unsubscribeFromPush(token: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    }
  } catch { /* ignore browser-side errors */ }

  await fetch(`${API_URL}/notifications/unsubscribe`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function testPushNotification(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/notifications/test`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Falha ao enviar notificação de teste');
}
