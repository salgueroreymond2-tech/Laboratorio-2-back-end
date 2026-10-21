import { pool } from '../db.js';

export class ResumenService {
  /**
   * Obtiene métricas agregadas globales y por grupo calculadas íntegramente mediante SQL.
   * Evita duplicación de montos procesando cada agregación en CTEs independientes antes del JOIN.
   */
  static async getResumen() {
    // 1. Métricas globales del sistema
    const globalQuery = `
      SELECT
        (SELECT COUNT(*)::INT FROM personas) AS total_personas,
        (SELECT COUNT(*)::INT FROM grupos) AS total_grupos,
        (SELECT COUNT(*)::INT FROM gastos) AS total_gastos,
        (SELECT COALESCE(SUM(monto), 0)::TEXT FROM gastos) AS monto_global_gastado,
        (SELECT COUNT(*)::INT FROM liquidaciones) AS total_liquidaciones,
        (SELECT COALESCE(SUM(monto), 0)::TEXT FROM liquidaciones) AS monto_global_liquidaciones;
    `;
    const globalResult = await pool.query(globalQuery);
    const globalStats = globalResult.rows[0];

    // 2. Métricas detalladas por grupo usando CTEs y GROUP BY
    const gruposQuery = `
      WITH gastos_grupo AS (
        SELECT
          grupo_id,
          COUNT(*)::INT AS numero_gastos,
          COALESCE(SUM(monto), 0)::TEXT AS total_gastado,
          COALESCE(ROUND(AVG(monto), 2), 0)::TEXT AS promedio_gasto
        FROM gastos
        GROUP BY grupo_id
      ),
      integrantes_grupo AS (
        SELECT
          grupo_id,
          COUNT(*)::INT AS cantidad_integrantes
        FROM grupo_personas
        GROUP BY grupo_id
      ),
      liquidaciones_grupo AS (
        SELECT
          grupo_id,
          COUNT(*)::INT AS cantidad_liquidaciones,
          COALESCE(SUM(monto), 0)::TEXT AS monto_liquidaciones
        FROM liquidaciones
        GROUP BY grupo_id
      )
      SELECT
        g.id AS grupo_id,
        g.nombre AS grupo_nombre,
        COALESCE(i.cantidad_integrantes, 0) AS cantidad_integrantes,
        COALESCE(gg.numero_gastos, 0) AS numero_gastos,
        COALESCE(gg.total_gastado, '0.00') AS total_gastado,
        COALESCE(gg.promedio_gasto, '0.00') AS promedio_gasto,
        COALESCE(l.cantidad_liquidaciones, 0) AS cantidad_liquidaciones,
        COALESCE(l.monto_liquidaciones, '0.00') AS monto_liquidaciones
      FROM grupos g
      LEFT JOIN integrantes_grupo i ON g.id = i.grupo_id
      LEFT JOIN gastos_grupo gg ON g.id = gg.grupo_id
      LEFT JOIN liquidaciones_grupo l ON g.id = l.grupo_id
      ORDER BY g.id ASC;
    `;
    const gruposResult = await pool.query(gruposQuery);

    return {
      global: {
        total_personas: globalStats.total_personas,
        total_grupos: globalStats.total_grupos,
        total_gastos: globalStats.total_gastos,
        monto_global_gastado: globalStats.monto_global_gastado,
        total_liquidaciones: globalStats.total_liquidaciones,
        monto_global_liquidaciones: globalStats.monto_global_liquidaciones,
      },
      grupos: gruposResult.rows,
    };
  }
}
