import { pool } from '../db.js';

/**
 * Modelo de Datos: Gasto
 * Encapsula todas las operaciones SQL sobre las tablas 'gastos' y 'participaciones'.
 */
export class GastoModel {
  /**
   * Obtiene la lista de gastos, con filtro opcional por grupo_id.
   * @param {number|null} grupoId 
   */
  static async findAll(grupoId = null) {
    let query = `
      SELECT 
        g.id,
        g.grupo_id,
        gr.nombre AS grupo_nombre,
        g.descripcion,
        g.monto::TEXT,
        g.pagado_por,
        p.nombre AS pagado_por_nombre,
        g.fecha::TEXT,
        g.tipo_reparto,
        g.categoria,
        g.creado_en
      FROM gastos g
      JOIN grupos gr ON g.grupo_id = gr.id
      JOIN personas p ON g.pagado_por = p.id
    `;
    const params = [];

    if (grupoId) {
      params.push(grupoId);
      query += ' WHERE g.grupo_id = $1';
    }

    query += ' ORDER BY g.fecha DESC, g.id DESC;';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Busca un gasto por ID con datos relacionados.
   * @param {number} id 
   */
  static async findById(id) {
    const query = `
      SELECT 
        g.id,
        g.grupo_id,
        gr.nombre AS grupo_nombre,
        g.descripcion,
        g.monto::TEXT,
        g.pagado_por,
        p.nombre AS pagado_por_nombre,
        g.fecha::TEXT,
        g.tipo_reparto,
        g.categoria,
        g.creado_en
      FROM gastos g
      JOIN grupos gr ON g.grupo_id = gr.id
      JOIN personas p ON g.pagado_por = p.id
      WHERE g.id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtiene las participaciones asociadas a un gasto.
   * @param {number} gastoId 
   */
  static async findParticipaciones(gastoId) {
    const query = `
      SELECT 
        part.id,
        part.persona_id,
        p.nombre AS persona_nombre,
        part.monto_asignado::TEXT
      FROM participaciones part
      JOIN personas p ON part.persona_id = p.id
      WHERE part.gasto_id = $1
      ORDER BY part.persona_id ASC;
    `;
    const result = await pool.query(query, [gastoId]);
    return result.rows;
  }

  /**
   * Elimina un gasto por ID (la base de datos elimina participaciones en cascada).
   * @param {number} id 
   */
  static async delete(id) {
    const query = 'DELETE FROM gastos WHERE id = $1 RETURNING id, descripcion;';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
}

export default GastoModel;
