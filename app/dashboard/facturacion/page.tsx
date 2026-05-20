import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FacturacionClient from './FacturacionClient';

export default async function FacturacionPage({ searchParams }: { searchParams: Promise<{ tenant?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const resolvedParams = await searchParams;

  if (!user) redirect('/login');

  let activeTenantId: number | null = null;
  let stationIds: number[] = [];
  const { data: profile } = await supabase.from('user_profiles').select('role, tenant_id').eq('id', user.id).single();

  if (profile?.role === 'superadmin') {
    if (!resolvedParams?.tenant) redirect('/admin');
    activeTenantId = parseInt(resolvedParams.tenant, 10);
  } else {
    activeTenantId = profile?.tenant_id ?? null;
  }
  if (!activeTenantId) redirect('/login');

  const { data: stations } = await supabase.from('stations').select('id').eq('tenant_id', activeTenantId);
  stationIds = stations?.map(s => s.id) ?? [];

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('tenant_id', activeTenantId)
    .order('created_at', { ascending: false });

  const { data: pendingSales } = await supabase
    .from('sales')
    .select('id, fuel_type, liters, amount')
    .in('station_id', stationIds)
    .eq('status', 'PENDING')
    .limit(10);

  return (
    <FacturacionClient
      invoicesInitial={invoices ?? []}
      pendingSalesInitial={pendingSales ?? []}
      tenantId={activeTenantId}
    />
  );
}
