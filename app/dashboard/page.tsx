import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch pumps + nozzles from Supabase
  const { data: pumpsRaw } = await supabase
    .from('pumps')
    .select('*, nozzles(*)')
    .order('position');

  const { data: stockRaw } = await supabase
    .from('stock')
    .select('*');

  const { data: shiftRaw } = await supabase
    .from('shifts')
    .select('*')
    .eq('status', 'OPEN')
    .order('opened_at', { ascending: false })
    .limit(1);

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <DashboardClient
      pumpsRaw={pumpsRaw ?? []}
      stockRaw={stockRaw ?? []}
      shiftRaw={shiftRaw?.[0] ?? null}
      userEmail={user?.email ?? ''}
    />
  );
}
