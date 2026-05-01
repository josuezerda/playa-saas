import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('user_profiles').select('role, tenant_id').eq('id', user.id).single();
  const tenantId = profile?.role === 'superadmin'
    ? req.nextUrl.searchParams.get('tenant_id')
    : profile?.tenant_id;

  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const search = req.nextUrl.searchParams.get('search') || '';
  let query = supabase.from('crm_contacts').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('user_profiles').select('role, tenant_id').eq('id', user.id).single();
  const body = await req.json();
  const tenantId = profile?.role === 'superadmin' ? body.tenant_id : profile?.tenant_id;

  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const { data, error } = await supabase.from('crm_contacts').insert({
    tenant_id: tenantId,
    name: body.name,
    phone: body.phone.replace(/[^0-9]/g, ''),
    email: body.email || null,
    notes: body.notes || null,
    tags: body.tags || [],
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
