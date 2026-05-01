-- ================================================================
-- Migration 009: CRM, Contactos, Mensajería WhatsApp, Invitaciones
-- ================================================================

-- 1. Invitaciones de empleados al sistema
CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    email VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'operador',
    token VARCHAR(100) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Contactos CRM (clientes de la estación)
CREATE TABLE crm_contacts (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    total_spent DECIMAL(12,2) DEFAULT 0,
    visits_count INT DEFAULT 0,
    last_visit TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, phone)
);

-- 3. Mensajes CRM (historial de WhatsApp)
CREATE TABLE crm_messages (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id INT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    type VARCHAR(20) NOT NULL DEFAULT 'text', -- 'text', 'image', 'audio', 'document'
    content TEXT,
    media_url TEXT,
    wa_message_id VARCHAR(100), -- ID del mensaje en WhatsApp
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_crm_messages_contact ON crm_messages(contact_id, created_at DESC);
CREATE INDEX idx_crm_messages_tenant ON crm_messages(tenant_id, created_at DESC);

-- 4. Campañas de difusión (broadcast)
CREATE TABLE crm_campaigns (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    media_url TEXT,
    target_tags TEXT[], -- Filtrar contactos por tags
    status VARCHAR(20) DEFAULT 'DRAFT', -- 'DRAFT', 'RUNNING', 'DONE', 'CANCELLED'
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    created_by VARCHAR(100),
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS Policies
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Superadmin puede todo
CREATE POLICY "Superadmin all crm_contacts" ON crm_contacts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin'));
CREATE POLICY "Tenant own crm_contacts" ON crm_contacts FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Superadmin all crm_messages" ON crm_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin'));
CREATE POLICY "Tenant own crm_messages" ON crm_messages FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Superadmin all crm_campaigns" ON crm_campaigns FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin'));
CREATE POLICY "Tenant own crm_campaigns" ON crm_campaigns FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
