import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('user_profiles').select('role, tenant_id').eq('id', user.id).single();
  const body = await req.json();
  const tenantId = profile?.role === 'superadmin' ? body.tenant_id : profile?.tenant_id;

  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

  const { data, error } = await supabase.from('tenants').update({
    name: body.name,
    cuit: body.cuit,
    plan: body.plan,
  }).eq('id', tenantId).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
