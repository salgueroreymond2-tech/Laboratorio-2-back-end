import { pool } from '../db.js';

/**
 * Modelo de Datos: Liquidación
 * Encapsula todas las operaciones SQL sobre la tabla 'liquidaciones'.
 */
export class LiquidacionModel {
  /**
   * Obtiene todas las liquidaciones registradas con nombres de personas y grupo.
   * @param {number|null} grupoId 
   */
  static async findAll(grupoId = null) {
    let query = `
      SELECT 
        l.id,
        l.grupo_id,
        gr.nombre AS grupo_nombre,
        l.de_persona,
        p_de.nombre AS de_persona_nombre,
        l.a_persona,
        p_a.nombre AS a_persona_nombre,
        l.monto::TEXT,
        l.fecha::TEXT,
        l.creado_en
      FROM liquidaciones l
      JOIN grupos gr ON l.grupo_id = gr.id
      JOIN personas p_de ON l.de_persona = p_de.id
      JOIN personas p_a ON l.a_persona = p_a.id
    `;
    const params = [];

    if (grupoId) {
      params.push(grupoId);
      query += ' WHERE l.grupo_id = $1';
    }

    query += ' ORDER BY l.fecha DESC, l.id DESC;';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Busca una liquidación por ID.
   * @param {number} id 
   */
  static async findById(id) {
    const query = `
      SELECT 
        l.id,
        l.grupo_id,
        gr.nombre AS grupo_nombre,
        l.de_persona,
        p_de.nombre AS de_persona_nombre,
        l.a_persona,
        p_a.nombre AS a_persona_nombre,
        l.monto::TEXT,
        l.fecha::TEXT,
        l.creado_en
      FROM liquidaciones l
      JOIN grupos gr ON l.grupo_id = gr.id
      JOIN personas p_de ON l.de_persona = p_de.id
      JOIN personas p_a ON l.a_persona = p_a.id
      WHERE l.id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Registra una nueva liquidación en la base de datos.
   * @param {number} grupoId 
   * @param {number} dePersona 
   * @param {number} aPersona 
   * @param {number} monto 
   * @param {string} fecha 
   */
  static async create(grupoId, dePersona, aPersona, monto, fecha) {
    const query = `
      INSERT INTO liquidaciones (grupo_id, de_persona, a_persona, monto, fecha)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, grupo_id, de_persona, a_persona, monto::TEXT, fecha::TEXT, creado_en;
    `;
    const result = await pool.query(query, [grupoId, dePersona, aPersona, monto, fecha]);
    return result.rows[0];
  }

  /**
   * Elimina una liquidación por ID.
   * @param {number} id 
   */
  static async delete(id) {
    const query = 'DELETE FROM liquidaciones WHERE id = $1 RETURNING id;';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
}

export default LiquidacionModel;
