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
    .select('id, name, cuit, whatsapp_phone_id, gemini_api_key, ai_system_prompt, whatsapp_api_token, afip_punto_venta, afip_condition, afip_razon_social, afip_cert_status')
    .eq('id', activeTenantId)
    .single();

  return (
    <IntegracionesClient
      tenant={{
        id: tenant?.id,
        name: tenant?.name,
        cuit: tenant?.cuit || '',
        whatsapp_phone_id: tenant?.whatsapp_phone_id || '',
        whatsapp_api_token: tenant?.whatsapp_api_token || '',
        gemini_api_key: tenant?.gemini_api_key || '',
        ai_system_prompt: tenant?.ai_system_prompt || '',
        afip_punto_venta: tenant?.afip_punto_venta ?? 11,
        afip_condition: tenant?.afip_condition || 'RI',
        afip_razon_social: tenant?.afip_razon_social || '',
        afip_cert_status: tenant?.afip_cert_status || 'MISSING',
      }}
      tenantParam={resolvedParams?.tenant}
    />
  );
}
