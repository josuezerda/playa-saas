import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link2, MessageSquare, Bot, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from '../dashboard.module.css';
import IntegracionesClient from './IntegracionesClient';

export default async function IntegracionesPage({ searchParams }: { searchParams: Promise<{ tenant?: string }> }) {
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
    .select('id, name, whatsapp_phone_id, gemini_api_key, ai_system_prompt, whatsapp_api_token')
    .eq('id', activeTenantId)
    .single();

  return (
    <IntegracionesClient
      tenant={{
        id: tenant?.id,
        name: tenant?.name,
        whatsapp_phone_id: tenant?.whatsapp_phone_id || '',
        whatsapp_api_token: tenant?.whatsapp_api_token || '',
        gemini_api_key: tenant?.gemini_api_key || '',
        ai_system_prompt: tenant?.ai_system_prompt || '',
      }}
      tenantParam={resolvedParams?.tenant}
    />
  );
}
