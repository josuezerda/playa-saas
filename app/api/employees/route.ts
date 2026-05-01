import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List employees for tenant
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('user_profiles').select('role, tenant_id').eq('id', user.id).single();
  const tenantId = profile?.role === 'superadmin'
    ? req.nextUrl.searchParams.get('tenant_id')
    : profile?.tenant_id;

  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const { data, error } = await supabase.from('employees').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST - Create employee
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('user_profiles').select('role, tenant_id').eq('id', user.id).single();
  const body = await req.json();
  const tenantId = profile?.role === 'superadmin' ? body.tenant_id : profile?.tenant_id;

  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const { data, error } = await supabase.from('employees').insert({
    tenant_id: tenantId,
    first_name: body.first_name,
    last_name: body.last_name,
    document_number: body.document_number || null,
    email: body.email || null,
    phone: body.phone || null,
    role: body.role || 'operador',
    active: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
