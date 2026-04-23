/**
 * setup-superadmin.mjs
 * Ejecutar UNA SOLA VEZ para crear el superadmin en Supabase Auth
 * y vincular su perfil con role = 'superadmin'
 *
 * Uso: node scripts/setup-superadmin.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno. Ejecutá con:');
  console.error('   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/setup-superadmin.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🔧 Creando superadmin...');

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'superadmin@surtos.com.ar',
    password: '0303456',
    email_confirm: true,  // Skip email confirmation
    user_metadata: { full_name: 'Super Admin' },
  });

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      console.log('⚠️  El usuario ya existe — obteniendo ID...');
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find(u => u.email === 'superadmin@surtos.com.ar');
      if (!existing) {
        console.error('❌ No se pudo encontrar el usuario existente.');
        process.exit(1);
      }
      await upsertProfile(existing.id);
    } else {
      console.error('❌ Error creando usuario:', authError.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Usuario Auth creado:', authData.user.id);
    await upsertProfile(authData.user.id);
  }
}

async function upsertProfile(userId) {
  const { error } = await supabase.from('user_profiles').upsert({
    id: userId,
    tenant_id: null,          // Superadmin no pertenece a ningún tenant
    role: 'superadmin',
    full_name: 'Super Admin',
  });

  if (error) {
    console.error('❌ Error creando perfil:', error.message);
    process.exit(1);
  }

  console.log('✅ Perfil superadmin creado exitosamente!');
  console.log('');
  console.log('  Email:     superadmin@surtos.com.ar');
  console.log('  Password:  0303456');
  console.log('  Role:      superadmin');
  console.log('');
  console.log('🚀 Podés loguearte en http://localhost:3002/login');
}

main();
