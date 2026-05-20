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

  // Campos permitidos (whitelist para seguridad)
  const allowed: Record<string, unknown> = {};
  const fields = ['name','cuit','plan','address','phone','logo_url',
                  'afip_punto_venta','afip_condition','afip_razon_social','afip_cert_status'];
  for (const f of fields) {
    if (body[f] !== undefined) allowed[f] = body[f];
  }

  const { data, error } = await supabase
    .from('tenants')
    .update(allowed)
    .eq('id', tenantId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
