-- ================================================================
-- Migration 007: Tenant AFIP Config
-- ================================================================

ALTER TABLE tenants
ADD COLUMN punto_de_venta INT,
ADD COLUMN afip_key TEXT,
ADD COLUMN afip_crt TEXT;
