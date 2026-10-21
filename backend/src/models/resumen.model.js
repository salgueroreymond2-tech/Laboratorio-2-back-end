import { pool } from '../db.js';

/**
 * Modelo de Datos: Resumen / Métricas
 * Ejecuta agregaciones complejas en PostgreSQL (SUM, COUNT, GROUP BY).
 */
export class ResumenModel {
  /**
   * Obtiene los indicadores globales de la plataforma.
   */
  static async getKpis() {
    const query = `
      SELECT
        (SELECT COUNT(*)::INT FROM personas) AS total_personas,
        (SELECT COUNT(*)::INT FROM grupos) AS total_grupos,
        (SELECT COUNT(*)::INT FROM gastos) AS total_gastos,
        (SELECT COALESCE(SUM(monto), 0)::TEXT FROM gastos) AS monto_total_gastado,
        (SELECT COUNT(*)::INT FROM liquidaciones) AS total_liquidaciones,
        (SELECT COALESCE(SUM(monto), 0)::TEXT FROM liquidaciones) AS monto_total_liquidado;
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  /**
   * Obtiene la distribución de gastos por categoría.
   */
  static async getGastosPorCategoria() {
    const query = `
      SELECT
        categoria,
        COUNT(*)::INT AS cantidad_gastos,
        COALESCE(SUM(monto), 0)::TEXT AS monto_total
      FROM gastos
      GROUP BY categoria
      ORDER BY SUM(monto) DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Obtiene la distribución de gastos por tipo de reparto.
   */
  static async getGastosPorTipoReparto() {
    const query = `
      SELECT
        tipo_reparto,
        COUNT(*)::INT AS cantidad_gastos,
        COALESCE(SUM(monto), 0)::TEXT AS monto_total
      FROM gastos
      GROUP BY tipo_reparto
      ORDER BY cantidad_gastos DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Obtiene los grupos con mayor actividad financiera.
   */
  static async getTopGrupos() {
    const query = `
      SELECT
        g.id AS grupo_id,
        g.nombre AS grupo_nombre,
        COUNT(DISTINCT ga.id)::INT AS cantidad_gastos,
        COALESCE(SUM(ga.monto), 0)::TEXT AS total_gastado
      FROM grupos g
      LEFT JOIN gastos ga ON g.id = ga.grupo_id
      GROUP BY g.id, g.nombre
      ORDER BY COALESCE(SUM(ga.monto), 0) DESC
      LIMIT 5;
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

export default ResumenModel;
