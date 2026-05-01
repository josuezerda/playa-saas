import { NextRequest, NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'surtos_webhook_secret';

// GET - Webhook verification (Meta)
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const token = req.nextUrl.searchParams.get('hub.verify_token');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verificación exitosa');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST - Receive messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Ignore status updates (delivered, read, etc.)
    if (value?.statuses) {
      return NextResponse.json({ ok: true });
    }

    const messages = value?.messages;
    if (!messages?.length) return NextResponse.json({ ok: true });

    const msg = messages[0];
    const fromPhone = msg.from;
    const wabaId = value?.metadata?.phone_number_id;

    // Find the tenant by whatsapp_phone_id
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('whatsapp_phone_id', wabaId)
      .single();

    if (!tenant) {
      console.warn('[WhatsApp Webhook] No tenant found for phone_id:', wabaId);
      return NextResponse.json({ ok: true });
    }

    const tenantId = tenant.id;

    // Upsert contact
    let { data: contact } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', fromPhone)
      .single();

    if (!contact) {
      const name = value?.contacts?.[0]?.profile?.name || fromPhone;
      const { data: newContact } = await supabase
        .from('crm_contacts')
        .insert({ tenant_id: tenantId, phone: fromPhone, name })
        .select('id').single();
      contact = newContact;
    }

    if (!contact) return NextResponse.json({ ok: true });

    // Extract message content
    let content = '';
    let type = msg.type;
    let mediaUrl: string | null = null;

    if (type === 'text') {
      content = msg.text?.body || '';
    } else if (['image', 'audio', 'video', 'document'].includes(type)) {
      content = `[${type.toUpperCase()}]`;
    } else if (type === 'interactive') {
      content = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '[Interactivo]';
      type = 'text';
    }

    // Save message
    await supabase.from('crm_messages').insert({
      tenant_id: tenantId,
      contact_id: contact.id,
      direction: 'inbound',
      type,
      content,
      media_url: mediaUrl,
      wa_message_id: msg.id,
      status: 'delivered',
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[WhatsApp Webhook] Error:', e.message);
    return NextResponse.json({ ok: true }); // Always 200 to avoid retries
  }
}
