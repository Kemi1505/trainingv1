import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { AdminSidebar } from './AdminSidebar';


export function AdminLayout({
  email,
  children,
}: {
  email?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader email={email} />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 bg-surface-alt px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
