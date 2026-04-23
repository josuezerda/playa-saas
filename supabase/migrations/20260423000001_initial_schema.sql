-- ================================================================
-- Módulo Playa — SaaS Estación de Servicio
-- Schema v2.0 — Multi-Tenant
-- Hardware: Gilbarco Veeder-Root Prime PMD
-- Controladora: VOX Forecourt Controller (PAM 1000 / TCP-IP)
-- ================================================================

-- 1. Estaciones (Multi-Tenant)
CREATE TABLE stations (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    address       VARCHAR(200),
    cuit          VARCHAR(20),
    vox_ip        VARCHAR(20) NOT NULL,         -- IP fija de la VOX en la red local
    vox_port      INT NOT NULL DEFAULT 5000,     -- Puerto TCP de la VOX
    timezone      VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
    active        BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Surtidores (Pumps)
CREATE TABLE pumps (
    id                    SERIAL PRIMARY KEY,
    station_id            INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    position              INT NOT NULL,               -- Posición física en playa (1-6)
    vox_pump_address      INT NOT NULL,               -- Dirección en la VOX (1-32)
    label                 VARCHAR(50) NOT NULL,
    model                 VARCHAR(20) NOT NULL,        -- 'PMD-4821' | 'PMD-2421'
    model_type            VARCHAR(20) NOT NULL,        -- 'OCTUPLA' | 'CUADRUPLA'
    nozzle_count          INT NOT NULL,               -- 8 o 4
    nozzles_per_face      INT NOT NULL,               -- 4 o 2
    simultaneous_supplies INT DEFAULT 2,
    blocked               BOOLEAN DEFAULT false,
    block_reason          TEXT,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(station_id, position),
    UNIQUE(station_id, vox_pump_address)
);

-- 3. Picos / Mangueras (Nozzles)
CREATE TABLE nozzles (
    id             SERIAL PRIMARY KEY,
    pump_id        INT NOT NULL REFERENCES pumps(id) ON DELETE CASCADE,
    station_id     INT NOT NULL REFERENCES stations(id),
    nozzle_number  INT NOT NULL,               -- Número del pico en el surtidor (1-8 | 1-4)
    face           CHAR(1) NOT NULL CHECK (face IN ('A', 'B')),
    fuel_type      VARCHAR(30) NOT NULL,        -- 'NAFTA_SUPER' | 'NAFTA_PREMIUM' | 'DIESEL' | 'DIESEL_PREMIUM' | 'GNC'
    price          DECIMAL(10,3) NOT NULL DEFAULT 0,
    totalizer      DECIMAL(15,3) NOT NULL DEFAULT 0,   -- Totalizador acumulado (litros)
    state          VARCHAR(20) NOT NULL DEFAULT 'IDLE', -- Estado actual (máquina de estados)
    blocked        BOOLEAN DEFAULT false,
    block_reason   TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pump_id, nozzle_number)
);

-- 4. Historial de Precios
CREATE TABLE price_changes (
    id          SERIAL PRIMARY KEY,
    station_id  INT NOT NULL REFERENCES stations(id),
    nozzle_id   INT NOT NULL REFERENCES nozzles(id),
    fuel_type   VARCHAR(30) NOT NULL,
    old_price   DECIMAL(10,3) NOT NULL,
    new_price   DECIMAL(10,3) NOT NULL,
    changed_at  TIMESTAMPTZ DEFAULT NOW(),
    changed_by  VARCHAR(100)
);

-- 5. Eventos Crudos VOX (Verdad Absoluta — Inmutable)
CREATE TABLE vox_raw_events (
    id           SERIAL PRIMARY KEY,
    station_id   INT NOT NULL REFERENCES stations(id),
    pump_id      INT REFERENCES pumps(id),
    nozzle_id    INT REFERENCES nozzles(id),
    event_type   VARCHAR(50) NOT NULL,          -- 'NOZZLE_UP', 'FLOW_START', 'FLOW_STOP', 'TXN_END', 'ERROR', etc.
    raw_message  TEXT,                          -- Mensaje crudo tal como llega de la VOX
    raw_payload  JSONB,                         -- Mensaje parseado
    received_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_vox_events_station ON vox_raw_events(station_id, received_at DESC);
CREATE INDEX idx_vox_events_nozzle  ON vox_raw_events(nozzle_id, received_at DESC);

-- 6. Transacciones de Combustible
CREATE TABLE fuel_transactions (
    id                    SERIAL PRIMARY KEY,
    station_id            INT NOT NULL REFERENCES stations(id),
    pump_id               INT NOT NULL REFERENCES pumps(id),
    nozzle_id             INT NOT NULL REFERENCES nozzles(id),
    shift_id              VARCHAR(50),
    vox_event_id          INT REFERENCES vox_raw_events(id),
    external_id           VARCHAR(100) UNIQUE,  -- ID de transacción generado por la VOX
    fuel_type             VARCHAR(30) NOT NULL,
    liters                DECIMAL(10,3) NOT NULL DEFAULT 0,
    amount                DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit_price            DECIMAL(10,3) NOT NULL DEFAULT 0,
    totalizer_open        DECIMAL(15,3),         -- Totalizador al inicio del despacho
    totalizer_close       DECIMAL(15,3),         -- Totalizador al fin del despacho
    status                VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'ERROR'
    error_detail          TEXT,
    started_at            TIMESTAMPTZ,
    completed_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_txn_station_date ON fuel_transactions(station_id, completed_at DESC);
CREATE INDEX idx_txn_nozzle       ON fuel_transactions(nozzle_id, completed_at DESC);

-- 7. Ventas (Cola para ERP / Caja)
CREATE TABLE sales (
    id               VARCHAR(50) PRIMARY KEY,   -- ej: VTA-20260422-001
    station_id       INT NOT NULL REFERENCES stations(id),
    transaction_id   INT NOT NULL REFERENCES fuel_transactions(id),
    fuel_type        VARCHAR(30) NOT NULL,
    liters           DECIMAL(10,3) NOT NULL,
    amount           DECIMAL(10,2) NOT NULL,
    status           VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING' | 'PAID' | 'INVOICED' | 'CANCELLED'
    payment_method   VARCHAR(50),
    customer_id      INT,                        -- Ref. a clientes del ERP
    invoiced_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Stock / Tanques
CREATE TABLE stock (
    id                  SERIAL PRIMARY KEY,
    station_id          INT NOT NULL REFERENCES stations(id),
    fuel_type           VARCHAR(30) NOT NULL,
    tank_name           VARCHAR(30) NOT NULL,
    capacity_liters     DECIMAL(12,3) NOT NULL,
    current_volume      DECIMAL(12,3) NOT NULL,   -- Volumen físico (medición directa)
    theoretical_volume  DECIMAL(12,3) NOT NULL,   -- Volumen teórico (stock inicial - despachos)
    system_volume       DECIMAL(12,3) NOT NULL,   -- Volumen sistema (registros ERP)
    alert_threshold     DECIMAL(12,3) DEFAULT 500,
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(station_id, fuel_type)
);

-- 9. Turnos Operativos
CREATE TABLE shifts (
    id              VARCHAR(50) PRIMARY KEY,       -- ej: SHIFT-20260422-001
    station_id      INT NOT NULL REFERENCES stations(id),
    operator_name   VARCHAR(100) NOT NULL,
    opened_at       TIMESTAMPTZ DEFAULT NOW(),
    closed_at       TIMESTAMPTZ,
    total_liters    DECIMAL(12,3) DEFAULT 0,
    total_amount    DECIMAL(12,2) DEFAULT 0,
    sales_count     INT DEFAULT 0,
    pump_readings   JSONB,                         -- Snapshot totalizadores al cierre
    status          VARCHAR(10) DEFAULT 'OPEN'     -- 'OPEN' | 'CLOSED'
);
CREATE INDEX idx_shifts_station ON shifts(station_id, opened_at DESC);

-- 10. Errores / Fallas de Picos y Surtidores
CREATE TABLE pump_errors (
    id             SERIAL PRIMARY KEY,
    station_id     INT NOT NULL REFERENCES stations(id),
    pump_id        INT NOT NULL REFERENCES pumps(id),
    nozzle_id      INT REFERENCES nozzles(id),     -- NULL si el error es del surtidor completo
    error_code     VARCHAR(50),
    error_message  TEXT,
    raw_payload    JSONB,
    auto_blocked   BOOLEAN DEFAULT true,            -- Si se bloqueó automáticamente
    resolved_at    TIMESTAMPTZ,
    resolved_by    VARCHAR(100),
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_errors_station ON pump_errors(station_id, created_at DESC);
