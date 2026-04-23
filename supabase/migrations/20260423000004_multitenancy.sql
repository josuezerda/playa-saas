-- ================================================================
-- Módulo Playa SaaS — Multi-Tenant
-- Migration 004: Tenants + User Profiles
-- ================================================================

-- 1. Tabla de empresas (tenants)
CREATE TABLE tenants (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  slug         VARCHAR(50)  NOT NULL UNIQUE,
  cuit         VARCHAR(20),
  plan         VARCHAR(20)  NOT NULL DEFAULT 'starter', -- 'starter' | 'pro'
  active       BOOLEAN      NOT NULL DEFAULT true,
  logo_url     TEXT,
  contact_email VARCHAR(100),
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- 2. Vincular estaciones a un tenant
ALTER TABLE stations ADD COLUMN tenant_id INT REFERENCES tenants(id);

-- 3. Perfiles de usuario (vincula auth.users → tenant + role)
CREATE TABLE user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  INT REFERENCES tenants(id),         -- NULL = superadmin (ve todo)
  role       VARCHAR(20) NOT NULL DEFAULT 'operator', -- 'superadmin' | 'admin' | 'operator'
  full_name  VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para lookup rápido
CREATE INDEX idx_profiles_tenant ON user_profiles(tenant_id);

-- 4. Tenant inicial: Playa HT
INSERT INTO tenants (name, slug, plan, active)
VALUES ('Playa HT', 'playa-ht', 'pro', true);

-- 5. Vincular la estación demo (id=1) al tenant Playa HT (id=1)
UPDATE stations SET tenant_id = 1 WHERE id = 1;
