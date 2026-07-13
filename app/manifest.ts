import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

function cloudinaryResize(url: string, size: number): string {
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_pad,b_rgb:0a1628/`);
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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

  const icons: MetadataRoute.Manifest['icons'] = iconUrl
    ? [
        { src: cloudinaryResize(iconUrl, 192), sizes: '192x192', type: 'image/png' },
        { src: cloudinaryResize(iconUrl, 512), sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ]
    : [];

  return {
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
}
