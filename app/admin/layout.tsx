import type { Metadata } from 'next';
import ServiceWorkerProvider from '@/components/ServiceWorkerProvider';

export const metadata: Metadata = {
  manifest: '/admin-manifest',
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceWorkerProvider />
      {children}
    </>
  );
}
