import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ConfiguracionClient from './ConfiguracionClient';

export default async function ConfiguracionPage({ searchParams }: { searchParams: Promise<{ tenant?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const resolvedParams = await searchParams;

  if (!user) redirect('/login');

  let activeTenantId: number | null = null;
  const { data: profile } = await supabase.from('user_profiles').select('role, tenant_id').eq('id', user.id).single();

  if (profile?.role === 'superadmin') {
    if (!resolvedParams?.tenant) redirect('/admin');
    activeTenantId = parseInt(resolvedParams.tenant, 10);
  } else {
    activeTenantId = profile?.tenant_id ?? null;
  }

  if (!activeTenantId) redirect('/login');

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', activeTenantId)
    .single();

  return <ConfiguracionClient tenant={tenant} tenantParam={resolvedParams?.tenant} isSuperadmin={profile?.role === 'superadmin'} />;
}
