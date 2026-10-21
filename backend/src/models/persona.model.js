import { pool } from '../db.js';

/**
 * Modelo de Datos: Persona
 * Encapsula todas las operaciones SQL sobre la tabla 'personas'.
 */
export class PersonaModel {
  /**
   * Obtiene todas las personas ordenadas por ID.
   */
  static async findAll() {
    const query = 'SELECT id, nombre, email, creado_en FROM personas ORDER BY id ASC;';
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Busca una persona por ID.
   * @param {number} id 
   */
  static async findById(id) {
    const query = 'SELECT id, nombre, email, creado_en FROM personas WHERE id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Busca una persona por email.
   * @param {string} email 
   */
  static async findByEmail(email) {
    const query = 'SELECT id, nombre, email, creado_en FROM personas WHERE email = $1;';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Busca si un email existe en otra persona (para validar duplicados en updates).
   * @param {string} email 
   * @param {number} excludeId 
   */
  static async findDuplicateEmail(email, excludeId) {
    const query = 'SELECT id FROM personas WHERE email = $1 AND id <> $2;';
    const result = await pool.query(query, [email, excludeId]);
    return result.rows[0] || null;
  }

  /**
   * Inserta una nueva persona en la base de datos.
   * @param {string} nombre 
   * @param {string} email 
   */
  static async create(nombre, email) {
    const query = `
      INSERT INTO personas (nombre, email)
      VALUES ($1, $2)
      RETURNING id, nombre, email, creado_en;
    `;
    const result = await pool.query(query, [nombre, email]);
    return result.rows[0];
  }

  /**
   * Actualiza el nombre y email de una persona.
   * @param {number} id 
   * @param {string} nombre 
   * @param {string} email 
   */
  static async update(id, nombre, email) {
    const query = `
      UPDATE personas
      SET nombre = $1, email = $2
      WHERE id = $3
      RETURNING id, nombre, email, creado_en;
    `;
    const result = await pool.query(query, [nombre, email, id]);
    return result.rows[0] || null;
  }

  /**
   * Elimina una persona por ID.
   * @param {number} id 
   */
  static async delete(id) {
    const query = 'DELETE FROM personas WHERE id = $1 RETURNING id, nombre;';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
}

export default PersonaModel;
