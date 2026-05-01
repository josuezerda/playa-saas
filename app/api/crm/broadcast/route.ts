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

  // Get tenant WhatsApp credentials
  const { data: tenant } = await supabase
    .from('tenants')
    .select('whatsapp_api_token, whatsapp_phone_id')
    .eq('id', tenantId)
    .single();

  if (!tenant?.whatsapp_api_token || !tenant?.whatsapp_phone_id) {
    return NextResponse.json({ error: 'WhatsApp no configurado' }, { status: 400 });
  }

  // Create campaign record
  const { data: campaign, error: campError } = await supabase.from('crm_campaigns').insert({
    tenant_id: tenantId,
    name: body.name,
    message: body.message,
    target_tags: body.target_tags || [],
    status: 'RUNNING',
    created_by: user.email,
  }).select().single();

  if (campError) return NextResponse.json({ error: campError.message }, { status: 500 });

  // Get contacts (filtered by tags if provided)
  let contactsQuery = supabase.from('crm_contacts').select('id, phone, name').eq('tenant_id', tenantId);
  if (body.target_tags?.length) {
    contactsQuery = contactsQuery.overlaps('tags', body.target_tags);
  }
  const { data: contacts } = await contactsQuery;

  if (!contacts?.length) {
    await supabase.from('crm_campaigns').update({ status: 'DONE' }).eq('id', campaign.id);
    return NextResponse.json({ success: true, sent: 0, campaign_id: campaign.id });
  }

  // Send messages (async fire-and-forget per contact)
  let sent = 0, failed = 0;
  const url = `https://graph.facebook.com/v19.0/${tenant.whatsapp_phone_id}/messages`;

  for (const contact of contacts) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tenant.whatsapp_api_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: contact.phone,
          type: 'text',
          text: { body: body.message.replace('{{nombre}}', contact.name) },
        }),
      });

      if (res.ok) {
        sent++;
        await supabase.from('crm_messages').insert({
          tenant_id: tenantId,
          contact_id: contact.id,
          direction: 'outbound',
          type: 'text',
          content: body.message,
          status: 'sent',
        });
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  await supabase.from('crm_campaigns').update({
    status: 'DONE',
    sent_count: sent,
    failed_count: failed,
    completed_at: new Date().toISOString(),
  }).eq('id', campaign.id);

  return NextResponse.json({ success: true, sent, failed, campaign_id: campaign.id });
}
