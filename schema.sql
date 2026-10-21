-- =============================================================================
-- BASE DE DATOS: Control de Gastos Compartidos con Liquidaciones
-- Laboratorio 2, Día 1, Caso 3
-- =============================================================================

-- Eliminar tablas previas en orden inverso de dependencias para permitir recargas limpias
DROP TABLE IF EXISTS liquidaciones CASCADE;
DROP TABLE IF EXISTS participaciones CASCADE;
DROP TABLE IF EXISTS gastos CASCADE;
DROP TABLE IF EXISTS grupo_personas CASCADE;
DROP TABLE IF EXISTS grupos CASCADE;
DROP TABLE IF EXISTS personas CASCADE;

-- -----------------------------------------------------------------------------
-- 1. TABLA: personas
-- -----------------------------------------------------------------------------
CREATE TABLE personas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. TABLA: grupos
-- -----------------------------------------------------------------------------
CREATE TABLE grupos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. TABLA: grupo_personas (Integrantes de cada grupo)
-- -----------------------------------------------------------------------------
CREATE TABLE grupo_personas (
    grupo_id INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    persona_id INT NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,
    agregado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (grupo_id, persona_id)
);

-- -----------------------------------------------------------------------------
-- 4. TABLA: gastos
-- -----------------------------------------------------------------------------
CREATE TABLE gastos (
    id SERIAL PRIMARY KEY,
    grupo_id INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    descripcion VARCHAR(255) NOT NULL,
    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    pagado_por INT NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_reparto VARCHAR(20) NOT NULL CHECK (tipo_reparto IN ('IGUALES', 'PORCENTAJE', 'EXACTO')),
    categoria VARCHAR(100) DEFAULT 'General',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. TABLA: participaciones (Monto asignado a cada integrante en cada gasto)
-- -----------------------------------------------------------------------------
CREATE TABLE participaciones (
    id SERIAL PRIMARY KEY,
    gasto_id INT NOT NULL REFERENCES gastos(id) ON DELETE CASCADE,
    persona_id INT NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,
    monto_asignado NUMERIC(12,2) NOT NULL CHECK (monto_asignado >= 0),
    CONSTRAINT uq_gasto_persona UNIQUE (gasto_id, persona_id)
);

-- -----------------------------------------------------------------------------
-- 6. TABLA: liquidaciones (Transferencias de dinero para saldar deudas)
-- -----------------------------------------------------------------------------
CREATE TABLE liquidaciones (
    id SERIAL PRIMARY KEY,
    grupo_id INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    de_persona INT NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,
    a_persona INT NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,
    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_personas_distintas CHECK (de_persona <> a_persona)
);

-- -----------------------------------------------------------------------------
-- ÍNDICES PARA OPTIMIZAR CONSULTAS FRECUENTES Y LLAVES FORÁNEAS
-- -----------------------------------------------------------------------------
CREATE INDEX idx_grupo_personas_persona ON grupo_personas(persona_id);
CREATE INDEX idx_gastos_grupo ON gastos(grupo_id);
CREATE INDEX idx_gastos_pagado_por ON gastos(pagado_por);
CREATE INDEX idx_gastos_fecha ON gastos(fecha);
CREATE INDEX idx_participaciones_gasto ON participaciones(gasto_id);
CREATE INDEX idx_participaciones_persona ON participaciones(persona_id);
CREATE INDEX idx_liquidaciones_grupo ON liquidaciones(grupo_id);
CREATE INDEX idx_liquidaciones_de_persona ON liquidaciones(de_persona);
CREATE INDEX idx_liquidaciones_a_persona ON liquidaciones(a_persona);

-- -----------------------------------------------------------------------------
-- DATOS SEMILLA (SEED DATA)
-- -----------------------------------------------------------------------------

-- Personas (al menos 4 personas)
INSERT INTO personas (id, nombre, email) VALUES
(1, 'Carlos Gómez', 'carlos.gomez@example.com'),
(2, 'Ana Martínez', 'ana.martinez@example.com'),
(3, 'Roberto Silva', 'roberto.silva@example.com'),
(4, 'Elena Torres', 'elena.torres@example.com'),
(5, 'Miguel Díaz', 'miguel.diaz@example.com');

-- Ajustar secuencia de personas
SELECT setval('personas_id_seq', (SELECT MAX(id) FROM personas));

-- Grupos (al menos 2 grupos)
INSERT INTO grupos (id, nombre) VALUES
(1, 'Viaje a la Playa'),
(2, 'Proyecto Departamento');

-- Ajustar secuencia de grupos
SELECT setval('grupos_id_seq', (SELECT MAX(id) FROM grupos));

-- Integrantes de los grupos
-- Grupo 1: Carlos, Ana, Roberto, Elena
INSERT INTO grupo_personas (grupo_id, persona_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4);

-- Grupo 2: Carlos, Ana, Miguel
INSERT INTO grupo_personas (grupo_id, persona_id) VALUES
(2, 1),
(2, 2),
(2, 5);

-- Gastos con los 3 tipos de reparto y participaciones que cuadran exactamente:

-- Gasto 1: Reparto IGUALES sin sobrante (120.00 entre 4 personas = 30.00 c/u)
INSERT INTO gastos (id, grupo_id, descripcion, monto, pagado_por, fecha, tipo_reparto, categoria)
VALUES (1, 1, 'Hospedaje Cabaña Playa', 120.00, 1, CURRENT_DATE, 'IGUALES', 'Hospedaje');

INSERT INTO participaciones (gasto_id, persona_id, monto_asignado) VALUES
(1, 1, 30.00),
(1, 2, 30.00),
(1, 3, 30.00),
(1, 4, 30.00);

-- Gasto 2: Reparto IGUALES con centavos sobrantes (100.01 entre 3 personas: 33.34, 33.34, 33.33)
INSERT INTO gastos (id, grupo_id, descripcion, monto, pagado_por, fecha, tipo_reparto, categoria)
VALUES (2, 1, 'Cena de Mariscos', 100.01, 2, CURRENT_DATE, 'IGUALES', 'Comida');

INSERT INTO participaciones (gasto_id, persona_id, monto_asignado) VALUES
(2, 1, 33.34),
(2, 2, 33.34),
(2, 3, 33.33);

-- Gasto 3: Reparto PORCENTAJE (50.00: Carlos 40% = 20.00, Ana 30% = 15.00, Elena 30% = 15.00)
INSERT INTO gastos (id, grupo_id, descripcion, monto, pagado_por, fecha, tipo_reparto, categoria)
VALUES (3, 1, 'Combustible y Peajes', 50.00, 3, CURRENT_DATE, 'PORCENTAJE', 'Transporte');

INSERT INTO participaciones (gasto_id, persona_id, monto_asignado) VALUES
(3, 1, 20.00),
(3, 2, 15.00),
(3, 4, 15.00);

-- Gasto 4: Reparto EXACTO (75.50: Carlos 25.50, Roberto 30.00, Elena 20.00)
INSERT INTO gastos (id, grupo_id, descripcion, monto, pagado_por, fecha, tipo_reparto, categoria)
VALUES (4, 1, 'Supermercado y Bebidas', 75.50, 1, CURRENT_DATE, 'EXACTO', 'Supermercado');

INSERT INTO participaciones (gasto_id, persona_id, monto_asignado) VALUES
(4, 1, 25.50),
(4, 3, 30.00),
(4, 4, 20.00);

-- Ajustar secuencias de gastos y participaciones
SELECT setval('gastos_id_seq', (SELECT MAX(id) FROM gastos));
SELECT setval('participaciones_id_seq', (SELECT MAX(id) FROM participaciones));

-- Liquidación: Roberto paga a Carlos 35.00 para saldar parte de su deuda
INSERT INTO liquidaciones (id, grupo_id, de_persona, a_persona, monto, fecha)
VALUES (1, 1, 3, 1, 35.00, CURRENT_DATE);

SELECT setval('liquidaciones_id_seq', (SELECT MAX(id) FROM liquidaciones));
