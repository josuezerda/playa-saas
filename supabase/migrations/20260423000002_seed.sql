-- ================================================================
-- Seed de Datos — Estación de Servicio (Demo)
-- 6 Surtidores: 3x PMD-4821 (8 picos) + 3x PMD-2421 (4 picos)
-- Combustibles: Nafta Super, Nafta Premium, Diesel, Diesel Premium, GNC
-- ================================================================

-- Estación Demo (ajustar IP de VOX según instalación real)
INSERT INTO stations (name, address, cuit, vox_ip, vox_port)
VALUES ('Estación de Servicio Demo', 'Av. Ejemplo 1234, Ciudad', '30-12345678-9', '192.168.1.100', 5000);

-- ---------------------------------------------------------------
-- Surtidores PMD-4821 (Óctupla — 8 picos, 4 por cara)
-- Combustibles por cara: Super | Premium | Diesel | Diesel Premium
-- ---------------------------------------------------------------
INSERT INTO pumps (station_id, position, vox_pump_address, label, model, model_type, nozzle_count, nozzles_per_face)
VALUES
  (1, 1, 1, 'Surtidor 1', 'PMD-4821', 'OCTUPLA', 8, 4),
  (1, 2, 2, 'Surtidor 2', 'PMD-4821', 'OCTUPLA', 8, 4),
  (1, 3, 3, 'Surtidor 3', 'PMD-4821', 'OCTUPLA', 8, 4);

-- ---------------------------------------------------------------
-- Surtidores PMD-2421 (Cuádrupla — 4 picos, 2 por cara)
-- Pumps 4 & 5: Nafta Super | Nafta Premium por cara
-- Pump 6:      GNC por cara
-- ---------------------------------------------------------------
INSERT INTO pumps (station_id, position, vox_pump_address, label, model, model_type, nozzle_count, nozzles_per_face)
VALUES
  (1, 4, 4, 'Surtidor 4', 'PMD-2421', 'CUADRUPLA', 4, 2),
  (1, 5, 5, 'Surtidor 5', 'PMD-2421', 'CUADRUPLA', 4, 2),
  (1, 6, 6, 'Surtidor 6', 'PMD-2421', 'CUADRUPLA', 4, 2);

-- ---------------------------------------------------------------
-- Picos — Surtidor 1 (PMD-4821)  pump_id = 1
--   Cara A: picos 1-4  |  Cara B: picos 5-8
-- ---------------------------------------------------------------
INSERT INTO nozzles (pump_id, station_id, nozzle_number, face, fuel_type, price) VALUES
  (1, 1, 1, 'A', 'NAFTA_SUPER',    0.000),
  (1, 1, 2, 'A', 'NAFTA_PREMIUM',  0.000),
  (1, 1, 3, 'A', 'DIESEL',         0.000),
  (1, 1, 4, 'A', 'DIESEL_PREMIUM', 0.000),
  (1, 1, 5, 'B', 'NAFTA_SUPER',    0.000),
  (1, 1, 6, 'B', 'NAFTA_PREMIUM',  0.000),
  (1, 1, 7, 'B', 'DIESEL',         0.000),
  (1, 1, 8, 'B', 'DIESEL_PREMIUM', 0.000);

-- Surtidor 2 (PMD-4821)  pump_id = 2
INSERT INTO nozzles (pump_id, station_id, nozzle_number, face, fuel_type, price) VALUES
  (2, 1, 1, 'A', 'NAFTA_SUPER',    0.000),
  (2, 1, 2, 'A', 'NAFTA_PREMIUM',  0.000),
  (2, 1, 3, 'A', 'DIESEL',         0.000),
  (2, 1, 4, 'A', 'DIESEL_PREMIUM', 0.000),
  (2, 1, 5, 'B', 'NAFTA_SUPER',    0.000),
  (2, 1, 6, 'B', 'NAFTA_PREMIUM',  0.000),
  (2, 1, 7, 'B', 'DIESEL',         0.000),
  (2, 1, 8, 'B', 'DIESEL_PREMIUM', 0.000);

-- Surtidor 3 (PMD-4821)  pump_id = 3
INSERT INTO nozzles (pump_id, station_id, nozzle_number, face, fuel_type, price) VALUES
  (3, 1, 1, 'A', 'NAFTA_SUPER',    0.000),
  (3, 1, 2, 'A', 'NAFTA_PREMIUM',  0.000),
  (3, 1, 3, 'A', 'DIESEL',         0.000),
  (3, 1, 4, 'A', 'DIESEL_PREMIUM', 0.000),
  (3, 1, 5, 'B', 'NAFTA_SUPER',    0.000),
  (3, 1, 6, 'B', 'NAFTA_PREMIUM',  0.000),
  (3, 1, 7, 'B', 'DIESEL',         0.000),
  (3, 1, 8, 'B', 'DIESEL_PREMIUM', 0.000);

-- Surtidor 4 (PMD-2421) — Nafta  pump_id = 4
INSERT INTO nozzles (pump_id, station_id, nozzle_number, face, fuel_type, price) VALUES
  (4, 1, 1, 'A', 'NAFTA_SUPER',   0.000),
  (4, 1, 2, 'A', 'NAFTA_PREMIUM', 0.000),
  (4, 1, 3, 'B', 'NAFTA_SUPER',   0.000),
  (4, 1, 4, 'B', 'NAFTA_PREMIUM', 0.000);

-- Surtidor 5 (PMD-2421) — Diesel  pump_id = 5
INSERT INTO nozzles (pump_id, station_id, nozzle_number, face, fuel_type, price) VALUES
  (5, 1, 1, 'A', 'DIESEL',         0.000),
  (5, 1, 2, 'A', 'DIESEL_PREMIUM', 0.000),
  (5, 1, 3, 'B', 'DIESEL',         0.000),
  (5, 1, 4, 'B', 'DIESEL_PREMIUM', 0.000);

-- Surtidor 6 (PMD-2421) — GNC  pump_id = 6
INSERT INTO nozzles (pump_id, station_id, nozzle_number, face, fuel_type, price) VALUES
  (6, 1, 1, 'A', 'GNC', 0.000),
  (6, 1, 2, 'A', 'GNC', 0.000),
  (6, 1, 3, 'B', 'GNC', 0.000),
  (6, 1, 4, 'B', 'GNC', 0.000);

-- Stock inicial por combustible
INSERT INTO stock (station_id, fuel_type, tank_name, capacity_liters, current_volume, theoretical_volume, system_volume, alert_threshold)
VALUES
  (1, 'NAFTA_SUPER',    'Tanque-1', 25000, 25000, 25000, 25000, 1000),
  (1, 'NAFTA_PREMIUM',  'Tanque-2', 20000, 20000, 20000, 20000,  800),
  (1, 'DIESEL',         'Tanque-3', 30000, 30000, 30000, 30000, 1500),
  (1, 'DIESEL_PREMIUM', 'Tanque-4', 15000, 15000, 15000, 15000,  500),
  (1, 'GNC',            'Tanque-5', 10000, 10000, 10000, 10000,  300);

-- Turno inicial abierto
INSERT INTO shifts (id, station_id, operator_name, status)
VALUES ('SHIFT-INICIAL', 1, 'Operador Demo', 'OPEN');
