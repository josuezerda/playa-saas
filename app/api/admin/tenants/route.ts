import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify superadmin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, cuit, plan, punto_de_venta, afip_crt, afip_key } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const { data: newTenant, error: insertError } = await supabase
      .from('tenants')
      .insert({
        name,
        slug,
        cuit,
        plan: plan || 'starter',
        active: true,
        punto_de_venta: punto_de_venta ? parseInt(punto_de_venta) : null,
        afip_crt: afip_crt || null,
        afip_key: afip_key || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting tenant:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ tenant: newTenant }, { status: 201 });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
