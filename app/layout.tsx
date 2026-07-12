import type { Metadata } from 'next';
import './globals.css';
import ServiceWorkerProvider from '@/components/ServiceWorkerProvider';

export const metadata: Metadata = {
  title: 'Naskar Motors',
  description: 'Catálogo de veículos',
};

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
