-- ================================================================
-- Migration 008: Módulos ERP (Empleados, Facturación, Integraciones)
-- ================================================================

-- 1. Añadir columnas de integración a tenants
ALTER TABLE tenants
ADD COLUMN whatsapp_api_token TEXT,
ADD COLUMN whatsapp_phone_id VARCHAR(50),
ADD COLUMN gemini_api_key TEXT,
ADD COLUMN ai_system_prompt TEXT;

-- 2. Empleados
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL, -- Opcional, si tiene acceso al sistema
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    document_number VARCHAR(20),
    email VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'operador', -- 'operador' | 'supervisor' | 'administrador'
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, document_number)
);

-- RLS para Employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin reads all employees" ON employees
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Tenant reads own employees" ON employees
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- 3. Facturación (Invoices)
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id VARCHAR(50) REFERENCES sales(id) ON DELETE SET NULL, -- Puede referenciar a una venta
    shift_id VARCHAR(50) REFERENCES shifts(id) ON DELETE SET NULL, -- O a un turno completo
    customer_name VARCHAR(100) NOT NULL,
    customer_cuit VARCHAR(20) NOT NULL,
    invoice_type VARCHAR(10) NOT NULL, -- 'A', 'B', 'C'
    total_amount DECIMAL(10,2) NOT NULL,
    cae VARCHAR(50),
    cae_due_date DATE,
    pdf_url TEXT,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    afip_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin reads all invoices" ON invoices
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Tenant reads own invoices" ON invoices
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
