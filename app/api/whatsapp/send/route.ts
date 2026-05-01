import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('user_profiles').select('role, tenant_id').eq('id', user.id).single();
  const body = await req.json();
  const tenantId = profile?.role === 'superadmin' ? body.tenant_id : profile?.tenant_id;

  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  // Get tenant credentials
  const { data: tenant } = await supabase
    .from('tenants')
    .select('whatsapp_api_token, whatsapp_phone_id')
    .eq('id', tenantId)
    .single();

  if (!tenant?.whatsapp_api_token || !tenant?.whatsapp_phone_id) {
    return NextResponse.json({ error: 'WhatsApp no configurado. Ve a Integraciones.' }, { status: 400 });
  }

  const { to, message, media_url, contact_id } = body;

  if (!to || !message) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });

  const cleanPhone = to.replace(/[^0-9]/g, '');

  const url = `https://graph.facebook.com/v19.0/${tenant.whatsapp_phone_id}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tenant.whatsapp_api_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: { preview_url: false, body: message },
    }),
  });

  const metaData = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: metaData.error?.message || 'Error de Meta' }, { status: 400 });
  }

  // Log outbound message
  if (contact_id) {
    await supabase.from('crm_messages').insert({
      tenant_id: tenantId,
      contact_id,
      direction: 'outbound',
      type: 'text',
      content: message,
      media_url: media_url || null,
      wa_message_id: metaData.messages?.[0]?.id,
      status: 'sent',
    });
  }

  return NextResponse.json({ success: true });
}
