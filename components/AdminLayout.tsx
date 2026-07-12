import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="md:ml-60 pb-16 md:pb-0" style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
