-- =============================================================================
-- MIGRACIÓN 001: Creación de tablas, llaves primarias, foráneas e índices
-- Sistema de Control de Gastos Compartidos con Liquidaciones
-- =============================================================================

-- 1. TABLA: personas
CREATE TABLE IF NOT EXISTS personas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA: grupos
CREATE TABLE IF NOT EXISTS grupos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA: grupo_personas (Integrantes de cada grupo)
CREATE TABLE IF NOT EXISTS grupo_personas (
    grupo_id INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    persona_id INT NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,
    agregado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (grupo_id, persona_id)
);

-- 4. TABLA: gastos
CREATE TABLE IF NOT EXISTS gastos (
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

-- 5. TABLA: participaciones (Monto asignado a cada integrante en cada gasto)
CREATE TABLE IF NOT EXISTS participaciones (
    id SERIAL PRIMARY KEY,
    gasto_id INT NOT NULL REFERENCES gastos(id) ON DELETE CASCADE,
    persona_id INT NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,
    monto_asignado NUMERIC(12,2) NOT NULL CHECK (monto_asignado >= 0),
    CONSTRAINT uq_gasto_persona UNIQUE (gasto_id, persona_id)
);

-- 6. TABLA: liquidaciones (Transferencias de dinero para saldar deudas)
CREATE TABLE IF NOT EXISTS liquidaciones (
    id SERIAL PRIMARY KEY,
    grupo_id INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    de_persona INT NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,
    a_persona INT NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,
    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_personas_distintas CHECK (de_persona <> a_persona)
);

-- Índices para optimizar rendimiento de llaves foráneas y filtros frecuentes
CREATE INDEX IF NOT EXISTS idx_grupo_personas_persona ON grupo_personas(persona_id);
CREATE INDEX IF NOT EXISTS idx_gastos_grupo ON gastos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_gastos_pagado_por ON gastos(pagado_por);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_participaciones_gasto ON participaciones(gasto_id);
CREATE INDEX IF NOT EXISTS idx_participaciones_persona ON participaciones(persona_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_grupo ON liquidaciones(grupo_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_de_persona ON liquidaciones(de_persona);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_a_persona ON liquidaciones(a_persona);
