-- =============================================================================
-- MIGRACIÓN 002: Inserción de datos iniciales / semilla (Seed Data)
-- Permite poblar personas, grupos, gastos con los 3 repartos y liquidación
-- =============================================================================

-- Personas de prueba
INSERT INTO personas (id, nombre, email) VALUES
(1, 'Carlos Gómez', 'carlos.gomez@example.com'),
(2, 'Ana Martínez', 'ana.martinez@example.com'),
(3, 'Roberto Silva', 'roberto.silva@example.com'),
(4, 'Elena Torres', 'elena.torres@example.com'),
(5, 'Miguel Díaz', 'miguel.diaz@example.com')
ON CONFLICT (id) DO NOTHING;

SELECT setval('personas_id_seq', COALESCE((SELECT MAX(id) FROM personas), 1));

-- Grupos iniciales
INSERT INTO grupos (id, nombre) VALUES
(1, 'Viaje a la Playa'),
(2, 'Proyecto Departamento')
ON CONFLICT (id) DO NOTHING;

SELECT setval('grupos_id_seq', COALESCE((SELECT MAX(id) FROM grupos), 1));

-- Integrantes de cada grupo
INSERT INTO grupo_personas (grupo_id, persona_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),
(2, 1), (2, 2), (2, 5)
ON CONFLICT (grupo_id, persona_id) DO NOTHING;

-- Gasto 1: Reparto IGUALES sin centavos sobrantes
INSERT INTO gastos (id, grupo_id, descripcion, monto, pagado_por, fecha, tipo_reparto, categoria)
VALUES (1, 1, 'Hospedaje Cabaña Playa', 120.00, 1, CURRENT_DATE, 'IGUALES', 'Hospedaje')
ON CONFLICT (id) DO NOTHING;

INSERT INTO participaciones (gasto_id, persona_id, monto_asignado) VALUES
(1, 1, 30.00), (1, 2, 30.00), (1, 3, 30.00), (1, 4, 30.00)
ON CONFLICT (gasto_id, persona_id) DO NOTHING;

-- Gasto 2: Reparto IGUALES con centavos distribuidos exactamente
INSERT INTO gastos (id, grupo_id, descripcion, monto, pagado_por, fecha, tipo_reparto, categoria)
VALUES (2, 1, 'Cena de Mariscos', 100.01, 2, CURRENT_DATE, 'IGUALES', 'Comida')
ON CONFLICT (id) DO NOTHING;

INSERT INTO participaciones (gasto_id, persona_id, monto_asignado) VALUES
(2, 1, 33.34), (2, 2, 33.34), (2, 3, 33.33)
ON CONFLICT (gasto_id, persona_id) DO NOTHING;

-- Gasto 3: Reparto PORCENTAJE (suma 100.00%)
INSERT INTO gastos (id, grupo_id, descripcion, monto, pagado_por, fecha, tipo_reparto, categoria)
VALUES (3, 1, 'Combustible y Peajes', 50.00, 3, CURRENT_DATE, 'PORCENTAJE', 'Transporte')
ON CONFLICT (id) DO NOTHING;

INSERT INTO participaciones (gasto_id, persona_id, monto_asignado) VALUES
(3, 1, 20.00), (3, 2, 15.00), (3, 4, 15.00)
ON CONFLICT (gasto_id, persona_id) DO NOTHING;

-- Gasto 4: Reparto EXACTO (suma exacta al total)
INSERT INTO gastos (id, grupo_id, descripcion, monto, pagado_por, fecha, tipo_reparto, categoria)
VALUES (4, 1, 'Supermercado y Bebidas', 75.50, 1, CURRENT_DATE, 'EXACTO', 'Supermercado')
ON CONFLICT (id) DO NOTHING;

INSERT INTO participaciones (gasto_id, persona_id, monto_asignado) VALUES
(4, 1, 25.50), (4, 3, 30.00), (4, 4, 20.00)
ON CONFLICT (gasto_id, persona_id) DO NOTHING;

SELECT setval('gastos_id_seq', COALESCE((SELECT MAX(id) FROM gastos), 1));
SELECT setval('participaciones_id_seq', COALESCE((SELECT MAX(id) FROM participaciones), 1));

-- Liquidación de prueba
INSERT INTO liquidaciones (id, grupo_id, de_persona, a_persona, monto, fecha)
VALUES (1, 1, 3, 1, 35.00, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('liquidaciones_id_seq', COALESCE((SELECT MAX(id) FROM liquidaciones), 1));
