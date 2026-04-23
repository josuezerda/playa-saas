-- ================================================================
-- Migration 005: RLS multi-tenant con superadmin bypass
-- ================================================================

-- ── user_profiles ──────────────────────────────────────────────
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- ── tenants ────────────────────────────────────────────────────
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Superadmin ve todos los tenants
CREATE POLICY "Superadmin reads all tenants" ON tenants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Admin/Operator solo ve su propio tenant
CREATE POLICY "Tenant member reads own tenant" ON tenants
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- ── stations ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated read stations" ON stations;

CREATE POLICY "Superadmin reads all stations" ON stations
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Tenant reads own stations" ON stations
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

-- ── pumps ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated read pumps" ON pumps;

CREATE POLICY "Superadmin reads all pumps" ON pumps
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Tenant reads own pumps" ON pumps
  FOR SELECT TO authenticated
  USING (
    station_id IN (
      SELECT s.id FROM stations s
      JOIN user_profiles up ON up.tenant_id = s.tenant_id
      WHERE up.id = auth.uid()
    )
  );

-- ── nozzles, stock, shifts, fuel_transactions (same pattern) ──
DROP POLICY IF EXISTS "Authenticated read nozzles" ON nozzles;
DROP POLICY IF EXISTS "Authenticated read stock" ON stock;
DROP POLICY IF EXISTS "Authenticated read shifts" ON shifts;
DROP POLICY IF EXISTS "Authenticated read transactions" ON fuel_transactions;
DROP POLICY IF EXISTS "Authenticated read sales" ON sales;
DROP POLICY IF EXISTS "Authenticated read vox_events" ON vox_raw_events;
DROP POLICY IF EXISTS "Authenticated read price_changes" ON price_changes;
DROP POLICY IF EXISTS "Authenticated read pump_errors" ON pump_errors;

-- Helper macro: superadmin bypass + tenant filter for all tables
CREATE POLICY "Access nozzles" ON nozzles FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
    OR station_id IN (
      SELECT s.id FROM stations s JOIN user_profiles up ON up.tenant_id = s.tenant_id WHERE up.id = auth.uid()
    )
  );

CREATE POLICY "Access stock" ON stock FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
    OR station_id IN (
      SELECT s.id FROM stations s JOIN user_profiles up ON up.tenant_id = s.tenant_id WHERE up.id = auth.uid()
    )
  );

CREATE POLICY "Access shifts" ON shifts FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
    OR station_id IN (
      SELECT s.id FROM stations s JOIN user_profiles up ON up.tenant_id = s.tenant_id WHERE up.id = auth.uid()
    )
  );

CREATE POLICY "Access transactions" ON fuel_transactions FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
    OR station_id IN (
      SELECT s.id FROM stations s JOIN user_profiles up ON up.tenant_id = s.tenant_id WHERE up.id = auth.uid()
    )
  );

CREATE POLICY "Access sales" ON sales FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
    OR station_id IN (
      SELECT s.id FROM stations s JOIN user_profiles up ON up.tenant_id = s.tenant_id WHERE up.id = auth.uid()
    )
  );

CREATE POLICY "Access vox_events" ON vox_raw_events FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
    OR station_id IN (
      SELECT s.id FROM stations s JOIN user_profiles up ON up.tenant_id = s.tenant_id WHERE up.id = auth.uid()
    )
  );

CREATE POLICY "Access price_changes" ON price_changes FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
    OR station_id IN (
      SELECT s.id FROM stations s JOIN user_profiles up ON up.tenant_id = s.tenant_id WHERE up.id = auth.uid()
    )
  );

CREATE POLICY "Access pump_errors" ON pump_errors FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin')
    OR station_id IN (
      SELECT s.id FROM stations s JOIN user_profiles up ON up.tenant_id = s.tenant_id WHERE up.id = auth.uid()
    )
  );
