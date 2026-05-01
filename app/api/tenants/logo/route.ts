import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const tenantId = formData.get('tenant_id') as string;

    if (!file || !tenantId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no puede superar 2MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `logos/tenant_${tenantId}.${ext}`;
    const buffer = await file.arrayBuffer();

    // Subir a Supabase Storage bucket "company-assets"
    const { error: uploadError } = await supabase.storage
      .from('company-assets')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      // Fallback: guardar como base64 URL en la DB si no hay bucket
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      const { error: dbError } = await supabase
        .from('tenants')
        .update({ logo_url: dataUrl })
        .eq('id', tenantId);

      if (dbError) throw dbError;
      return NextResponse.json({ logo_url: dataUrl });
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('company-assets')
      .getPublicUrl(fileName);

    // Actualizar en la DB
    const { error: dbError } = await supabase
      .from('tenants')
      .update({ logo_url: publicUrl })
      .eq('id', tenantId);

    if (dbError) throw dbError;

    return NextResponse.json({ logo_url: publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
