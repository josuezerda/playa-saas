import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './DashboardClient';
import { redirect } from 'next/navigation';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tenant?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const resolvedParams = await searchParams;

  if (!user) redirect('/login');

  let stationIds: number[] = [];
  let tenantName = '';
  let activeTenantId: number | null = null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, tenant_id, tenants(name, id)')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'superadmin') {
    if (!resolvedParams?.tenant) redirect('/admin');
    activeTenantId = parseInt(resolvedParams.tenant, 10);
    const { data: stations } = await supabase
      .from('stations')
      .select('id, tenant_id, tenants(name)')
      .eq('tenant_id', activeTenantId);
    if (stations && stations.length > 0) {
      stationIds = stations.map(s => s.id);
      tenantName = (stations[0].tenants as any)?.name || '';
    }
  } else {
    // Fix: para usuarios normales, buscar estaciones de su tenant
    activeTenantId = profile?.tenant_id ?? null;
    tenantName = (profile?.tenants as any)?.name || '';
    if (activeTenantId) {
      const { data: stations } = await supabase
        .from('stations')
        .select('id')
        .eq('tenant_id', activeTenantId);
      stationIds = stations?.map(s => s.id) ?? [];
    }
  }

  if (!activeTenantId) redirect('/login');

  let pumpsQuery = supabase.from('pumps').select('*, nozzles(*)').order('position');
  let stockQuery = supabase.from('stock').select('*');
  let shiftQuery = supabase
    .from('shifts')
    .select('*')
    .eq('status', 'OPEN')
    .order('opened_at', { ascending: false })
    .limit(1);

  if (stationIds.length > 0) {
    pumpsQuery = pumpsQuery.in('station_id', stationIds);
    stockQuery = stockQuery.in('station_id', stationIds);
    shiftQuery = shiftQuery.in('station_id', stationIds);
  }

  const { data: pumpsRaw } = await pumpsQuery;
  const { data: stockRaw } = await stockQuery;
  const { data: shiftRaw } = await shiftQuery;

  // Stats del día actual
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: todaySales } = await supabase
    .from('fuel_transactions')
    .select('fuel_type, liters, amount')
    .in('station_id', stationIds)
    .gte('completed_at', today.toISOString())
    .eq('status', 'COMPLETED');

  const todayStats = {
    totalLiters: todaySales?.reduce((acc, s) => acc + Number(s.liters), 0) ?? 0,
    totalAmount: todaySales?.reduce((acc, s) => acc + Number(s.amount), 0) ?? 0,
    txCount: todaySales?.length ?? 0,
  };

  return (
    <DashboardClient
      pumpsRaw={pumpsRaw ?? []}
      stockRaw={stockRaw ?? []}
      shiftRaw={shiftRaw?.[0] ?? null}
      userEmail={user?.email ?? ''}
      tenantName={tenantName}
      stationIds={stationIds}
      activeTenantId={activeTenantId}
      todayStats={todayStats}
    />
  );
}


