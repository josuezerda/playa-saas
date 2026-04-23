-- ================================================================
-- Políticas RLS — Módulo Playa SaaS
-- Ejecutar DESPUÉS del schema.sql y seed.sql
-- ================================================================

-- Todos los usuarios autenticados pueden leer los datos de surtidores
-- (en producción agregar filtro por station_id según el tenant)

ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE nozzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE vox_raw_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pump_errors ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados pueden leer todo (política base)
CREATE POLICY "Authenticated read stations"      ON stations            FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read pumps"         ON pumps               FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read nozzles"       ON nozzles             FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read stock"         ON stock               FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read shifts"        ON shifts              FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read transactions"  ON fuel_transactions   FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read sales"         ON sales               FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read vox_events"    ON vox_raw_events      FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read price_changes" ON price_changes       FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read pump_errors"   ON pump_errors         FOR SELECT TO authenticated USING (true);

-- Inserción/actualización para el backend (service role bypasses RLS automáticamente)
-- Las escrituras se hacen desde el backend con service_role_key, no desde el cliente
