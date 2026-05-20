-- ================================================================
-- Migration 010: WhatsApp Templates — CRM
-- Templates pre-configurados para tenants: Playa HT y Lindor
-- ================================================================

-- 1. Tabla de templates de WhatsApp
-- Los templates deben estar aprobados en Meta Business Manager.
-- 'name' debe coincidir EXACTAMENTE con el nombre registrado en Meta.
CREATE TABLE whatsapp_templates (
    id              SERIAL PRIMARY KEY,
    tenant_id       INT REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = template global compartido
    name            VARCHAR(100) NOT NULL,       -- Nombre snake_case registrado en Meta
    display_name    VARCHAR(100) NOT NULL,       -- Nombre legible para el CRM
    category        VARCHAR(30)  NOT NULL,       -- 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
    language        VARCHAR(10)  NOT NULL DEFAULT 'es_AR',
    -- Componentes del template
    header_type     VARCHAR(20),                 -- 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | NULL
    header_content  TEXT,                        -- Texto si header_type='TEXT'; URL si media
    body            TEXT         NOT NULL,       -- Cuerpo con variables {{1}}, {{2}}, ...
    footer          TEXT,                        -- Pie de página (opcional)
    -- Definición de variables
    variables       JSONB        NOT NULL DEFAULT '[]', -- [{index, name, description, example}]
    -- Botones (opcional)
    buttons         JSONB        DEFAULT NULL,   -- [{type:'URL'|'QUICK_REPLY', text, url}]
    -- Estado del template en Meta
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING', -- 'PENDING'|'APPROVED'|'REJECTED'|'PAUSED'
    meta_template_id VARCHAR(100),               -- WABA template ID asignado por Meta (post-aprobación)
    -- Uso / auditoría
    last_used_at    TIMESTAMPTZ,
    use_count       INT          DEFAULT 0,
    created_at      TIMESTAMPTZ  DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  DEFAULT NOW(),

    UNIQUE(tenant_id, name)
);

-- Índices para búsqueda rápida
CREATE INDEX idx_wa_templates_tenant   ON whatsapp_templates(tenant_id);
CREATE INDEX idx_wa_templates_status   ON whatsapp_templates(tenant_id, status);
CREATE INDEX idx_wa_templates_category ON whatsapp_templates(tenant_id, category);

-- RLS
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin all wa_templates" ON whatsapp_templates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Tenant reads own wa_templates" ON whatsapp_templates FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL  -- templates globales visibles para todos
    OR tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Tenant manages own wa_templates" ON whatsapp_templates
  FOR INSERT OR UPDATE OR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));


-- ================================================================
-- 2. Trigger: actualizar updated_at automáticamente
-- ================================================================
CREATE OR REPLACE FUNCTION update_wa_template_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_wa_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_wa_template_timestamp();


-- ================================================================
-- 3. Insertar tenant Lindor (si no existe)
-- ================================================================
INSERT INTO tenants (name, slug, plan, active)
VALUES ('Playa Lindor', 'lindor', 'pro', true)
ON CONFLICT (slug) DO NOTHING;


-- ================================================================
-- 4. TEMPLATES — PLAYA HT  (tenant_id = 1)
-- ================================================================

-- [HT-1] Recibo de Carga de Combustible (UTILITY)
INSERT INTO whatsapp_templates
  (tenant_id, name, display_name, category, language, header_type, header_content, body, footer, variables, status)
VALUES (
  1,
  'recibo_carga_ht',
  'Recibo de Carga — Playa HT',
  'UTILITY',
  'es_AR',
  'TEXT',
  '⛽ Playa HT — Comprobante de Carga',
  E'Hola *{{1}}*, registramos tu carga:\n\n'
  E'🛢️ Combustible: *{{2}}*\n'
  E'📏 Litros: *{{3}} lts*\n'
  E'💰 Importe: *${{4}}*\n'
  E'📅 Fecha: {{5}}\n'
  E'🔢 Turno: {{6}}\n\n'
  E'¡Gracias por elegirnos! 🚗',
  'Playa HT • Tu estación de confianza',
  '[
    {"index":1,"name":"nombre_cliente","description":"Nombre del conductor","example":"Juan"},
    {"index":2,"name":"tipo_combustible","description":"Tipo de combustible","example":"Nafta Premium"},
    {"index":3,"name":"litros","description":"Litros despachados","example":"45.320"},
    {"index":4,"name":"importe","description":"Monto total en pesos","example":"18.450,00"},
    {"index":5,"name":"fecha","description":"Fecha y hora del despacho","example":"20/05/2026 14:35"},
    {"index":6,"name":"turno_id","description":"Identificador del turno","example":"SHIFT-20260520-001"}
  ]',
  'APPROVED'
);

-- [HT-2] Bienvenida a Cliente Nuevo (MARKETING)
INSERT INTO whatsapp_templates
  (tenant_id, name, display_name, category, language, header_type, header_content, body, footer, variables, status)
VALUES (
  1,
  'bienvenida_cliente_ht',
  'Bienvenida Cliente Nuevo — Playa HT',
  'MARKETING',
  'es_AR',
  'TEXT',
  '🎉 ¡Bienvenido/a a Playa HT!',
  E'Hola *{{1}}*, te damos la bienvenida a *Playa HT* 🚗⛽\n\n'
  E'Registramos tu visita el día *{{2}}*.\n\n'
  E'Seguí cargando con nosotros y accedé a beneficios exclusivos para clientes frecuentes.\n\n'
  E'📍 Estamos en {{3}}.\n'
  E'📞 Consultas: {{4}}',
  'Playa HT — Siempre cerca tuyo',
  '[
    {"index":1,"name":"nombre_cliente","description":"Nombre del cliente","example":"María"},
    {"index":2,"name":"fecha_visita","description":"Fecha de la primera visita","example":"20/05/2026"},
    {"index":3,"name":"direccion","description":"Dirección de la estación","example":"Av. San Martín 1500, Santiago del Estero"},
    {"index":4,"name":"telefono","description":"Teléfono de contacto","example":"(385) 422-0000"}
  ]',
  'APPROVED'
);

-- [HT-3] Resumen de Turno para Operador (UTILITY)
INSERT INTO whatsapp_templates
  (tenant_id, name, display_name, category, language, header_type, header_content, body, footer, variables, status)
VALUES (
  1,
  'resumen_turno_ht',
  'Resumen de Turno — Playa HT',
  'UTILITY',
  'es_AR',
  'TEXT',
  '📊 Cierre de Turno — Playa HT',
  E'*Resumen Turno {{1}}*\n'
  E'👤 Operador: {{2}}\n'
  E'🕐 Apertura: {{3}}\n'
  E'🕐 Cierre: {{4}}\n\n'
  E'━━━━━━━━━━━━━━━━\n'
  E'🛢️ Total litros: *{{5}} lts*\n'
  E'💰 Total recaudado: *${{6}}*\n'
  E'🧾 Cantidad de ventas: *{{7}}*\n'
  E'━━━━━━━━━━━━━━━━\n\n'
  E'_Generado automáticamente por Playa HT._',
  NULL,
  '[
    {"index":1,"name":"turno_id","description":"ID del turno","example":"SHIFT-20260520-001"},
    {"index":2,"name":"operador","description":"Nombre del operador","example":"Carlos Gómez"},
    {"index":3,"name":"hora_apertura","description":"Hora de apertura","example":"06:00"},
    {"index":4,"name":"hora_cierre","description":"Hora de cierre","example":"14:00"},
    {"index":5,"name":"total_litros","description":"Litros totales","example":"1.243,500"},
    {"index":6,"name":"total_importe","description":"Importe total","example":"510.635,00"},
    {"index":7,"name":"cantidad_ventas","description":"Número de ventas","example":"87"}
  ]',
  'APPROVED'
);

-- [HT-4] Promoción / Oferta Especial (MARKETING)
INSERT INTO whatsapp_templates
  (tenant_id, name, display_name, category, language, header_type, header_content, body, footer, variables, buttons, status)
VALUES (
  1,
  'promocion_combustible_ht',
  'Promoción de Combustible — Playa HT',
  'MARKETING',
  'es_AR',
  'TEXT',
  '🔥 Oferta Especial — Playa HT',
  E'¡Hola *{{1}}*! 🎁\n\n'
  E'Te tenemos una oferta especial esta semana:\n\n'
  E'*{{2}}*\n\n'
  E'📅 Válida hasta el *{{3}}*\n'
  E'⛽ Solo en Playa HT\n\n'
  E'¡No te lo pierdas!',
  'Playa HT • Ofertas exclusivas para vos',
  '[
    {"index":1,"name":"nombre_cliente","description":"Nombre del cliente","example":"Roberto"},
    {"index":2,"name":"descripcion_oferta","description":"Descripción de la promoción","example":"10% de descuento en Diesel Premium"},
    {"index":3,"name":"fecha_vencimiento","description":"Fecha límite de la oferta","example":"25/05/2026"}
  ]',
  '[{"type":"QUICK_REPLY","text":"¡Me interesa!"},{"type":"QUICK_REPLY","text":"No gracias"}]',
  'APPROVED'
);

-- [HT-5] Alerta Stock Bajo (UTILITY — para uso interno/administrador)
INSERT INTO whatsapp_templates
  (tenant_id, name, display_name, category, language, header_type, header_content, body, footer, variables, status)
VALUES (
  1,
  'alerta_stock_bajo_ht',
  'Alerta Stock Bajo — Playa HT',
  'UTILITY',
  'es_AR',
  'TEXT',
  '⚠️ Alerta: Stock Bajo — Playa HT',
  E'*⚠️ ALERTA DE STOCK BAJO*\n\n'
  E'Estación: *Playa HT*\n'
  E'🛢️ Combustible: *{{1}}*\n'
  E'📦 Volumen actual: *{{2}} lts*\n'
  E'🚨 Umbral mínimo: *{{3}} lts*\n'
  E'📅 Detectado: {{4}}\n\n'
  E'Por favor coordinar reposición urgente.',
  'Sistema automático — Playa HT',
  '[
    {"index":1,"name":"tipo_combustible","description":"Tipo de combustible con stock bajo","example":"Nafta Super"},
    {"index":2,"name":"volumen_actual","description":"Volumen actual en litros","example":"850"},
    {"index":3,"name":"umbral_minimo","description":"Umbral de alerta configurado","example":"1000"},
    {"index":4,"name":"fecha_deteccion","description":"Fecha y hora de detección","example":"20/05/2026 08:15"}
  ]',
  'APPROVED'
);


-- ================================================================
-- 5. TEMPLATES — PLAYA LINDOR  (tenant_id dinámico por slug)
-- ================================================================

-- [LINDOR-1] Recibo de Carga de Combustible (UTILITY)
INSERT INTO whatsapp_templates
  (tenant_id, name, display_name, category, language, header_type, header_content, body, footer, variables, status)
SELECT
  t.id,
  'recibo_carga_lindor',
  'Recibo de Carga — Playa Lindor',
  'UTILITY',
  'es_AR',
  'TEXT',
  '⛽ Playa Lindor — Comprobante de Carga',
  E'Hola *{{1}}*, registramos tu carga:\n\n'
  E'🛢️ Combustible: *{{2}}*\n'
  E'📏 Litros: *{{3}} lts*\n'
  E'💰 Importe: *${{4}}*\n'
  E'📅 Fecha: {{5}}\n'
  E'🔢 Turno: {{6}}\n\n'
  E'¡Gracias por elegirnos! ⛽',
  'Playa Lindor • Tu estación de confianza',
  '[
    {"index":1,"name":"nombre_cliente","description":"Nombre del conductor","example":"Juan"},
    {"index":2,"name":"tipo_combustible","description":"Tipo de combustible","example":"Diesel Premium"},
    {"index":3,"name":"litros","description":"Litros despachados","example":"60.000"},
    {"index":4,"name":"importe","description":"Monto total en pesos","example":"24.600,00"},
    {"index":5,"name":"fecha","description":"Fecha y hora del despacho","example":"20/05/2026 09:10"},
    {"index":6,"name":"turno_id","description":"Identificador del turno","example":"SHIFT-20260520-001"}
  ]',
  'APPROVED'
FROM tenants t WHERE t.slug = 'lindor';

-- [LINDOR-2] Bienvenida a Cliente Nuevo (MARKETING)
INSERT INTO whatsapp_templates
  (tenant_id, name, display_name, category, language, header_type, header_content, body, footer, variables, status)
SELECT
  t.id,
  'bienvenida_cliente_lindor',
  'Bienvenida Cliente Nuevo — Playa Lindor',
  'MARKETING',
  'es_AR',
  'TEXT',
  '🎉 ¡Bienvenido/a a Playa Lindor!',
  E'Hola *{{1}}*, te damos la bienvenida a *Playa Lindor* 🚗⛽\n\n'
  E'Registramos tu visita el día *{{2}}*.\n\n'
  E'Seguí cargando con nosotros y accedé a beneficios exclusivos para clientes frecuentes.\n\n'
  E'📍 Estamos en {{3}}.\n'
  E'📞 Consultas: {{4}}',
  'Playa Lindor — Siempre cerca tuyo',
  '[
    {"index":1,"name":"nombre_cliente","description":"Nombre del cliente","example":"Ana"},
    {"index":2,"name":"fecha_visita","description":"Fecha de la primera visita","example":"20/05/2026"},
    {"index":3,"name":"direccion","description":"Dirección de la estación","example":"Ruta 9 km 840, Santiago del Estero"},
    {"index":4,"name":"telefono","description":"Teléfono de contacto","example":"(385) 433-0000"}
  ]',
  'APPROVED'
FROM tenants t WHERE t.slug = 'lindor';

-- [LINDOR-3] Resumen de Turno para Operador (UTILITY)
INSERT INTO whatsapp_templates
  (tenant_id, name, display_name, category, language, header_type, header_content, body, footer, variables, status)
SELECT
  t.id,
  'resumen_turno_lindor',
  'Resumen de Turno — Playa Lindor',
  'UTILITY',
  'es_AR',
  'TEXT',
  '📊 Cierre de Turno — Playa Lindor',
  E'*Resumen Turno {{1}}*\n'
  E'👤 Operador: {{2}}\n'
  E'🕐 Apertura: {{3}}\n'
  E'🕐 Cierre: {{4}}\n\n'
  E'━━━━━━━━━━━━━━━━\n'
  E'🛢️ Total litros: *{{5}} lts*\n'
  E'💰 Total recaudado: *${{6}}*\n'
  E'🧾 Cantidad de ventas: *{{7}}*\n'
  E'━━━━━━━━━━━━━━━━\n\n'
  E'_Generado automáticamente por Playa Lindor._',
  NULL,
  '[
    {"index":1,"name":"turno_id","description":"ID del turno","example":"SHIFT-20260520-001"},
    {"index":2,"name":"operador","description":"Nombre del operador","example":"Pedro Díaz"},
    {"index":3,"name":"hora_apertura","description":"Hora de apertura","example":"06:00"},
    {"index":4,"name":"hora_cierre","description":"Hora de cierre","example":"14:00"},
    {"index":5,"name":"total_litros","description":"Litros totales","example":"980,200"},
    {"index":6,"name":"total_importe","description":"Importe total","example":"402.482,00"},
    {"index":7,"name":"cantidad_ventas","description":"Número de ventas","example":"63"}
  ]',
  'APPROVED'
FROM tenants t WHERE t.slug = 'lindor';

-- [LINDOR-4] Promoción / Oferta Especial (MARKETING)
INSERT INTO whatsapp_templates
  (tenant_id, name, display_name, category, language, header_type, header_content, body, footer, variables, buttons, status)
SELECT
  t.id,
  'promocion_combustible_lindor',
  'Promoción de Combustible — Playa Lindor',
  'MARKETING',
  'es_AR',
  'TEXT',
  '🔥 Oferta Especial — Playa Lindor',
  E'¡Hola *{{1}}*! 🎁\n\n'
  E'Te tenemos una oferta especial esta semana:\n\n'
  E'*{{2}}*\n\n'
  E'📅 Válida hasta el *{{3}}*\n'
  E'⛽ Solo en Playa Lindor\n\n'
  E'¡No te lo pierdas!',
  'Playa Lindor • Ofertas exclusivas para vos',
  '[
    {"index":1,"name":"nombre_cliente","description":"Nombre del cliente","example":"Diego"},
    {"index":2,"name":"descripcion_oferta","description":"Descripción de la promoción","example":"5% off en todas las cargas con débito"},
    {"index":3,"name":"fecha_vencimiento","description":"Fecha límite de la oferta","example":"26/05/2026"}
  ]',
  '[{"type":"QUICK_REPLY","text":"¡Me interesa!"},{"type":"QUICK_REPLY","text":"No gracias"}]',
  'APPROVED'
FROM tenants t WHERE t.slug = 'lindor';

-- [LINDOR-5] Alerta Stock Bajo (UTILITY — para uso interno/administrador)
INSERT INTO whatsapp_templates
  (tenant_id, name, display_name, category, language, header_type, header_content, body, footer, variables, status)
SELECT
  t.id,
  'alerta_stock_bajo_lindor',
  'Alerta Stock Bajo — Playa Lindor',
  'UTILITY',
  'es_AR',
  'TEXT',
  '⚠️ Alerta: Stock Bajo — Playa Lindor',
  E'*⚠️ ALERTA DE STOCK BAJO*\n\n'
  E'Estación: *Playa Lindor*\n'
  E'🛢️ Combustible: *{{1}}*\n'
  E'📦 Volumen actual: *{{2}} lts*\n'
  E'🚨 Umbral mínimo: *{{3}} lts*\n'
  E'📅 Detectado: {{4}}\n\n'
  E'Por favor coordinar reposición urgente.',
  'Sistema automático — Playa Lindor',
  '[
    {"index":1,"name":"tipo_combustible","description":"Tipo de combustible con stock bajo","example":"Diesel"},
    {"index":2,"name":"volumen_actual","description":"Volumen actual en litros","example":"1.200"},
    {"index":3,"name":"umbral_minimo","description":"Umbral de alerta configurado","example":"1.500"},
    {"index":4,"name":"fecha_deteccion","description":"Fecha y hora de detección","example":"20/05/2026 11:30"}
  ]',
  'APPROVED'
FROM tenants t WHERE t.slug = 'lindor';
