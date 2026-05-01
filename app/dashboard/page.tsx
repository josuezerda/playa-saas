import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './DashboardClient';
import { redirect } from 'next/navigation';

export default async function DashboardPage({ searchParams }: { searchParams: { tenant?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let stationIds: number[] = [];
  let tenantName = '';

  if (user) {
    const { data: profile } = await supabase.from('user_profiles').select('role, tenants(name)').eq('id', user.id).single();
    
    if (profile?.role === 'superadmin') {
      if (!searchParams?.tenant) {
        // Superadmin without tenant context should go to admin panel
        redirect('/admin');
      } else {
        const { data: stations } = await supabase.from('stations').select('id, tenants(name)').eq('tenant_id', searchParams.tenant);
        if (stations && stations.length > 0) {
          stationIds = stations.map(s => s.id);
          // Assuming all stations here belong to the same tenant, we take the name from the first one
          tenantName = (stations[0].tenants as any)?.name || '';
        }
      }
    } else {
      // Normal user, use their profile's tenant name
      tenantName = (profile?.tenants as any)?.name || '';
    }
  }

  let pumpsQuery = supabase.from('pumps').select('*, nozzles(*)').order('position');
  let stockQuery = supabase.from('stock').select('*');
  let shiftQuery = supabase.from('shifts').select('*').eq('status', 'OPEN').order('opened_at', { ascending: false }).limit(1);

  if (stationIds.length > 0) {
    pumpsQuery = pumpsQuery.in('station_id', stationIds);
    stockQuery = stockQuery.in('station_id', stationIds);
    shiftQuery = shiftQuery.in('station_id', stationIds);
  }

  const { data: pumpsRaw } = await pumpsQuery;
  const { data: stockRaw } = await stockQuery;
  const { data: shiftRaw } = await shiftQuery;

  return (
    <DashboardClient
      pumpsRaw={pumpsRaw ?? []}
      stockRaw={stockRaw ?? []}
      shiftRaw={shiftRaw?.[0] ?? null}
      userEmail={user?.email ?? ''}
      tenantName={tenantName}
    />
  );
}


