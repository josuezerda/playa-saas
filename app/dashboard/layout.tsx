import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GlobalSidebar from './GlobalSidebar';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params?: any;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();

  const isSuperadmin = profile?.role === 'superadmin';
  // Para superadmin: tomar tenant del query string; para usuario normal: usar su tenant_id
  const tenantId = isSuperadmin ? undefined : String(profile?.tenant_id ?? '');

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'row', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}>
      <GlobalSidebar isSuperadmin={isSuperadmin} tenantId={tenantId} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
