import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GlobalSidebar from './GlobalSidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'row', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}>
      <GlobalSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
