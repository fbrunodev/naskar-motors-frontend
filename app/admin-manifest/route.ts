import { NextResponse } from 'next/server';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function cloudinaryResize(url: string, size: number): string {
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_pad,b_rgb:0a1628/`);
}

export async function GET() {
  let iconUrl: string | null = null;
  let storeName = 'Naskar Motors';

  try {
    const res = await fetch(`${apiUrl}/settings/`, { cache: 'no-store' });
    if (res.ok) {
      const s = await res.json();
      iconUrl = s.logo_url ?? null;
      storeName = s.name ?? 'Naskar Motors';
    }
  } catch {}

  const icons = iconUrl
    ? [
        { src: cloudinaryResize(iconUrl, 192), sizes: '192x192', type: 'image/png' },
        { src: cloudinaryResize(iconUrl, 512), sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ]
    : [
        { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ];

  const manifest = {
    name: storeName,
    short_name: storeName,
    description: 'Catálogo de veículos',
    start_url: '/admin/login',
    display: 'standalone',
    background_color: '#0a1628',
    theme_color: '#0a1628',
    orientation: 'portrait',
    icons,
  };

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
