import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Save/update integration settings for a tenant
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('user_profiles').select('role, tenant_id').eq('id', user.id).single();
  const body = await req.json();
  const tenantId = profile?.role === 'superadmin' ? body.tenant_id : profile?.tenant_id;

  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const updates: Record<string, string | null> = {};
  if ('whatsapp_api_token' in body) updates.whatsapp_api_token = body.whatsapp_api_token || null;
  if ('whatsapp_phone_id' in body) updates.whatsapp_phone_id = body.whatsapp_phone_id || null;
  if ('gemini_api_key' in body) updates.gemini_api_key = body.gemini_api_key || null;
  if ('ai_system_prompt' in body) updates.ai_system_prompt = body.ai_system_prompt || null;

  const { data, error } = await supabase.from('tenants').update(updates).eq('id', tenantId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data });
}

// Get integration settings for a tenant
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('user_profiles').select('role, tenant_id').eq('id', user.id).single();
  const tenantId = profile?.role === 'superadmin'
    ? req.nextUrl.searchParams.get('tenant_id')
    : profile?.tenant_id;

  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('tenants')
    .select('whatsapp_phone_id, gemini_api_key, ai_system_prompt, whatsapp_api_token')
    .eq('id', tenantId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mask secrets
  return NextResponse.json({
    whatsapp_phone_id: data?.whatsapp_phone_id || '',
    whatsapp_api_token_set: !!data?.whatsapp_api_token,
    gemini_api_key_set: !!data?.gemini_api_key,
    ai_system_prompt: data?.ai_system_prompt || '',
  });
}
