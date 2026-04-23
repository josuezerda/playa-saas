-- ================================================================
-- Ejecutar en Supabase SQL Editor DESPUÉS de la migration 004
-- Crea el perfil superadmin para el usuario ya creado en Auth
-- ================================================================

INSERT INTO user_profiles (id, tenant_id, role, full_name)
VALUES (
  '66317432-2b11-4274-bf7a-66f71d65e722',  -- UID del superadmin@surtos.com.ar
  NULL,                                      -- Superadmin no tiene tenant (ve todos)
  'superadmin',
  'Super Admin'
)
ON CONFLICT (id) DO UPDATE SET role = 'superadmin', tenant_id = NULL;

-- Verificar
SELECT up.id, up.role, up.full_name, au.email
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.role = 'superadmin';
