import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerProvider from '@/components/ServiceWorkerProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const viewport: Viewport = {
  themeColor: '#0a1628',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  let logoUrl: string | null = null;
  let storeName = 'Naskar Motors';

  try {
    const res = await fetch(`${API_URL}/settings/`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const s = await res.json();
      logoUrl = s.logo_url ?? null;
      storeName = s.name ?? 'Naskar Motors';
    }
  } catch {}

  return {
    title: storeName,
    description: 'Catálogo de veículos',
    ...(logoUrl ? { icons: { apple: logoUrl } } : {}),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-gray-50 text-gray-900">
        <ServiceWorkerProvider />
        {children}
      </body>
    </html>
  );
}
