-- ================================================================
-- Migration 011: Optimización Disk IO — Índices + RLS helper
-- Soluciona: "Project is depleting its Disk IO Budget" (plan NANO)
-- ================================================================
-- PROBLEMA RAÍZ:
--   Las políticas RLS actuales ejecutan subqueries correlacionadas
--   en CADA fila evaluada:
--     EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() ...)
--   Esto genera full-scans repetidos. Con RLS activo, cada SELECT
--   evalúa la policy por cada fila → multiplicador exponencial de IO.
--
-- SOLUCIÓN:
--   1. Función SECURITY DEFINER con STABLE + SET search_path que
--      cachea el resultado por transacción (evita subqueries repetidas).
--   2. Índices compuestos en columnas frecuentemente filtradas.
--   3. Índice parcial en user_profiles para lookup de superadmin.
-- ================================================================

-- ── 1. Función helper: obtener tenant_id del usuario actual ──────
CREATE OR REPLACE FUNCTION auth_tenant_id()
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ── 2. Función helper: verificar si es superadmin ────────────────
CREATE OR REPLACE FUNCTION auth_is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

-- ── 3. Índices faltantes críticos ────────────────────────────────

-- user_profiles: lookup por uid + role (usado en CADA policy RLS)
CREATE INDEX IF NOT EXISTS idx_profiles_uid_role
  ON user_profiles(id, role);

-- user_profiles: lookup tenant_id del usuario (usado masivamente)
CREATE INDEX IF NOT EXISTS idx_profiles_uid_tenant
  ON user_profiles(id, tenant_id);

-- Índice parcial para superadmin (lookup muy frecuente, tabla pequeña)
CREATE INDEX IF NOT EXISTS idx_profiles_superadmin
  ON user_profiles(id)
  WHERE role = 'superadmin';

-- stations: tenant_id para joins en RLS de pumps/nozzles/shifts
CREATE INDEX IF NOT EXISTS idx_stations_tenant
  ON stations(tenant_id, id);

-- fuel_transactions: queries de turno y fecha (tabla de alta escritura)
CREATE INDEX IF NOT EXISTS idx_txn_shift
  ON fuel_transactions(shift_id, station_id);

CREATE INDEX IF NOT EXISTS idx_txn_status
  ON fuel_transactions(station_id, status, completed_at DESC);

-- sales: queries por estado de pago
CREATE INDEX IF NOT EXISTS idx_sales_status
  ON sales(station_id, status, created_at DESC);

-- vox_raw_events: tabla de altísima frecuencia — índice por tipo+fecha
CREATE INDEX IF NOT EXISTS idx_vox_events_type
  ON vox_raw_events(station_id, event_type, received_at DESC);

-- shifts: turnos abiertos (consulta frecuente de dashboard)
CREATE INDEX IF NOT EXISTS idx_shifts_open
  ON shifts(station_id, status)
  WHERE status = 'OPEN';

-- crm_contacts: búsqueda por phone (lookup frecuente en webhook WA)
CREATE INDEX IF NOT EXISTS idx_crm_contacts_phone
  ON crm_contacts(tenant_id, phone);

-- crm_contacts: búsqueda por tags (campañas broadcast)
CREATE INDEX IF NOT EXISTS idx_crm_contacts_tags
  ON crm_contacts USING GIN(tags);

-- crm_messages: wa_message_id dedup (evita duplicados en webhook)
CREATE INDEX IF NOT EXISTS idx_crm_messages_wa_id
  ON crm_messages(wa_message_id)
  WHERE wa_message_id IS NOT NULL;

-- whatsapp_templates: lookup por estado aprobado
CREATE INDEX IF NOT EXISTS idx_wa_templates_approved
  ON whatsapp_templates(tenant_id, category)
  WHERE status = 'APPROVED';

-- employees: lookup por user_profile_id
CREATE INDEX IF NOT EXISTS idx_employees_profile
  ON employees(user_profile_id)
  WHERE user_profile_id IS NOT NULL;

-- invoices: queries por estado AFIP
CREATE INDEX IF NOT EXISTS idx_invoices_status
  ON invoices(tenant_id, status, created_at DESC);


-- ── 4. Actualizar políticas RLS para usar las funciones helper ───
-- Reemplazamos las policies más costosas (las que hacen JOINs complejos)

-- ── stations ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Superadmin reads all stations" ON stations;
DROP POLICY IF EXISTS "Tenant reads own stations" ON stations;

CREATE POLICY "stations_access" ON stations FOR SELECT TO authenticated
  USING (
    auth_is_superadmin()
    OR tenant_id = auth_tenant_id()
  );

-- ── pumps ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Superadmin reads all pumps" ON pumps;
DROP POLICY IF EXISTS "Tenant reads own pumps" ON pumps;

CREATE POLICY "pumps_access" ON pumps FOR SELECT TO authenticated
  USING (
    auth_is_superadmin()
    OR station_id IN (
      SELECT id FROM stations WHERE tenant_id = auth_tenant_id()
    )
  );

-- ── nozzles ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Access nozzles" ON nozzles;

CREATE POLICY "nozzles_access" ON nozzles FOR SELECT TO authenticated
  USING (
    auth_is_superadmin()
    OR station_id IN (
      SELECT id FROM stations WHERE tenant_id = auth_tenant_id()
    )
  );

-- ── stock ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Access stock" ON stock;

CREATE POLICY "stock_access" ON stock FOR SELECT TO authenticated
  USING (
    auth_is_superadmin()
    OR station_id IN (
      SELECT id FROM stations WHERE tenant_id = auth_tenant_id()
    )
  );

-- ── shifts ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Access shifts" ON shifts;

CREATE POLICY "shifts_access" ON shifts FOR SELECT TO authenticated
  USING (
    auth_is_superadmin()
    OR station_id IN (
      SELECT id FROM stations WHERE tenant_id = auth_tenant_id()
    )
  );

-- ── fuel_transactions ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Access transactions" ON fuel_transactions;

CREATE POLICY "transactions_access" ON fuel_transactions FOR SELECT TO authenticated
  USING (
    auth_is_superadmin()
    OR station_id IN (
      SELECT id FROM stations WHERE tenant_id = auth_tenant_id()
    )
  );

-- ── sales ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Access sales" ON sales;

CREATE POLICY "sales_access" ON sales FOR SELECT TO authenticated
  USING (
    auth_is_superadmin()
    OR station_id IN (
      SELECT id FROM stations WHERE tenant_id = auth_tenant_id()
    )
  );

-- ── vox_raw_events ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Access vox_events" ON vox_raw_events;

CREATE POLICY "vox_events_access" ON vox_raw_events FOR SELECT TO authenticated
  USING (
    auth_is_superadmin()
    OR station_id IN (
      SELECT id FROM stations WHERE tenant_id = auth_tenant_id()
    )
  );

-- ── price_changes ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Access price_changes" ON price_changes;

CREATE POLICY "price_changes_access" ON price_changes FOR SELECT TO authenticated
  USING (
    auth_is_superadmin()
    OR station_id IN (
      SELECT id FROM stations WHERE tenant_id = auth_tenant_id()
    )
  );

-- ── pump_errors ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Access pump_errors" ON pump_errors;

CREATE POLICY "pump_errors_access" ON pump_errors FOR SELECT TO authenticated
  USING (
    auth_is_superadmin()
    OR station_id IN (
      SELECT id FROM stations WHERE tenant_id = auth_tenant_id()
    )
  );

-- ── CRM: optimizar políticas tenant ──────────────────────────────
DROP POLICY IF EXISTS "Superadmin all crm_contacts" ON crm_contacts;
DROP POLICY IF EXISTS "Tenant own crm_contacts" ON crm_contacts;

CREATE POLICY "crm_contacts_access" ON crm_contacts FOR ALL TO authenticated
  USING (
    auth_is_superadmin()
    OR tenant_id = auth_tenant_id()
  );

DROP POLICY IF EXISTS "Superadmin all crm_messages" ON crm_messages;
DROP POLICY IF EXISTS "Tenant own crm_messages" ON crm_messages;

CREATE POLICY "crm_messages_access" ON crm_messages FOR ALL TO authenticated
  USING (
    auth_is_superadmin()
    OR tenant_id = auth_tenant_id()
  );

DROP POLICY IF EXISTS "Superadmin all crm_campaigns" ON crm_campaigns;
DROP POLICY IF EXISTS "Tenant own crm_campaigns" ON crm_campaigns;

CREATE POLICY "crm_campaigns_access" ON crm_campaigns FOR ALL TO authenticated
  USING (
    auth_is_superadmin()
    OR tenant_id = auth_tenant_id()
  );


-- ── 5. Limpieza de vox_raw_events antiguos (reducir IO de tabla grande)
-- Mantener solo los últimos 90 días. Ejecutar manualmente o via cron.
-- CREATE POLICY para eliminar eventos viejos automáticamente (opcional):
-- DELETE FROM vox_raw_events WHERE received_at < NOW() - INTERVAL '90 days';

COMMENT ON FUNCTION auth_tenant_id() IS
  'Retorna el tenant_id del usuario autenticado. STABLE + SECURITY DEFINER '
  'permite que PostgreSQL cachee el resultado por transacción, reduciendo '
  'drásticamente el Disk IO de las políticas RLS.';

COMMENT ON FUNCTION auth_is_superadmin() IS
  'Retorna true si el usuario autenticado es superadmin. Cacheado por transacción.';
