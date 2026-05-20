-- Migration 010: Columnas AFIP/ARCA en tenants + VOX config en stations
-- ================================================================

-- Agregar campos AFIP al tenant
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS address           TEXT,
  ADD COLUMN IF NOT EXISTS phone             VARCHAR(30),
  ADD COLUMN IF NOT EXISTS afip_punto_venta  INT DEFAULT 11,
  ADD COLUMN IF NOT EXISTS afip_condition    VARCHAR(10) DEFAULT 'RI', -- 'RI' | 'MONO' | 'EXENTO'
  ADD COLUMN IF NOT EXISTS afip_razon_social VARCHAR(150),
  ADD COLUMN IF NOT EXISTS afip_cert_status  VARCHAR(20) DEFAULT 'MISSING', -- 'OK' | 'MISSING' | 'EXPIRED'
  ADD COLUMN IF NOT EXISTS afip_cert_url     TEXT,  -- URL del .crt subido a Supabase Storage
  ADD COLUMN IF NOT EXISTS afip_key_url      TEXT;  -- URL de la .key privada (cifrada)

-- Actualizar tenant HT Refinor con los datos del PDF de constancia
UPDATE tenants SET
  cuit              = '30710217641',
  afip_razon_social = 'HT REFINOR SRL',
  afip_punto_venta  = 11,
  afip_condition    = 'RI',
  afip_cert_status  = 'MISSING'
WHERE slug = 'playa-ht';

-- Agregar columna de stats a shifts para mejorar planillas
ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS nozzle_readings JSONB; -- Totalizadores por pico al cierre

-- Índice para búsqueda rápida por fecha en planillas
CREATE INDEX IF NOT EXISTS idx_shifts_opened ON shifts(station_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_txn_date ON fuel_transactions(station_id, completed_at DESC, status);
