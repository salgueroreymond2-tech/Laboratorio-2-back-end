import { pool } from '../db.js';

/**
 * Modelo de Datos: Grupo
 * Encapsula todas las operaciones SQL sobre las tablas 'grupos' y 'grupo_personas'.
 */
export class GrupoModel {
  /**
   * Obtiene todos los grupos junto con el conteo de integrantes y gastos.
   */
  static async findAll() {
    const query = `
      SELECT 
        g.id,
        g.nombre,
        g.creado_en,
        COUNT(DISTINCT gp.persona_id)::INT AS total_integrantes,
        COUNT(DISTINCT ga.id)::INT AS total_gastos,
        COALESCE(SUM(ga.monto), 0)::TEXT AS monto_total_gastos
      FROM grupos g
      LEFT JOIN grupo_personas gp ON g.id = gp.grupo_id
      LEFT JOIN gastos ga ON g.id = ga.grupo_id
      GROUP BY g.id, g.nombre, g.creado_en
      ORDER BY g.id ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Busca un grupo por ID.
   * @param {number} id 
   */
  static async findById(id) {
    const query = 'SELECT id, nombre, creado_en FROM grupos WHERE id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtiene los integrantes pertenecientes a un grupo.
   * @param {number} grupoId 
   */
  static async findIntegrantes(grupoId) {
    const query = `
      SELECT 
        p.id,
        p.nombre,
        p.email,
        gp.agregado_en
      FROM grupo_personas gp
      JOIN personas p ON gp.persona_id = p.id
      WHERE gp.grupo_id = $1
      ORDER BY p.id ASC;
    `;
    const result = await pool.query(query, [grupoId]);
    return result.rows;
  }

  /**
   * Inserta un nuevo grupo.
   * @param {string} nombre 
   */
  static async create(nombre) {
    const query = `
      INSERT INTO grupos (nombre)
      VALUES ($1)
      RETURNING id, nombre, creado_en;
    `;
    const result = await pool.query(query, [nombre]);
    return result.rows[0];
  }

  /**
   * Agrega un integrante al grupo en 'grupo_personas'.
   * @param {number} grupoId 
   * @param {number} personaId 
   */
  static async addMember(grupoId, personaId) {
    const query = `
      INSERT INTO grupo_personas (grupo_id, persona_id)
      VALUES ($1, $2)
      RETURNING grupo_id, persona_id, agregado_en;
    `;
    const result = await pool.query(query, [grupoId, personaId]);
    return result.rows[0];
  }

  /**
   * Remueve un integrante del grupo.
   * @param {number} grupoId 
   * @param {number} personaId 
   */
  static async removeMember(grupoId, personaId) {
    const query = 'DELETE FROM grupo_personas WHERE grupo_id = $1 AND persona_id = $2 RETURNING persona_id;';
    const result = await pool.query(query, [grupoId, personaId]);
    return result.rows[0] || null;
  }

  /**
   * Verifica si una persona pertenece a un grupo.
   * @param {number} grupoId 
   * @param {number} personaId 
   */
  static async isMember(grupoId, personaId) {
    const query = 'SELECT 1 FROM grupo_personas WHERE grupo_id = $1 AND persona_id = $2;';
    const result = await pool.query(query, [grupoId, personaId]);
    return result.rows.length > 0;
  }
}

export default GrupoModel;
