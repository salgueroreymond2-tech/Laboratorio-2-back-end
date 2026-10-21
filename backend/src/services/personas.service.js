import { pool } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { validateEmail, validateRequiredString, parseId } from '../utils/validations.js';

export class PersonasService {
  /**
   * Obtiene la lista completa de personas registradas.
   */
  static async getAll() {
    const query = 'SELECT id, nombre, email, creado_en FROM personas ORDER BY id ASC;';
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Obtiene una persona por su identificador único.
   * @param {number} id 
   */
  static async getById(id) {
    const personaId = parseId(id, 'id');
    const query = 'SELECT id, nombre, email, creado_en FROM personas WHERE id = $1;';
    const result = await pool.query(query, [personaId]);

    if (result.rows.length === 0) {
      throw AppError.notFound(`No se encontró ninguna persona con el ID ${personaId}.`);
    }

    return result.rows[0];
  }

  /**
   * Crea una nueva persona en el sistema.
   * @param {object} data - { nombre, email }
   */
  static async create({ nombre, email }) {
    const validNombre = validateRequiredString(nombre, 'nombre', 100);
    const validEmail = validateEmail(email);

    // Verificar si el correo ya existe
    const existsQuery = 'SELECT id FROM personas WHERE email = $1;';
    const existsResult = await pool.query(existsQuery, [validEmail]);
    if (existsResult.rows.length > 0) {
      throw AppError.conflict(`El correo electrónico "${validEmail}" ya se encuentra registrado.`);
    }

    const insertQuery = `
      INSERT INTO personas (nombre, email)
      VALUES ($1, $2)
      RETURNING id, nombre, email, creado_en;
    `;
    const result = await pool.query(insertQuery, [validNombre, validEmail]);
    return result.rows[0];
  }

  /**
   * Actualiza completamente los datos de una persona (PUT).
   * @param {number} id 
   * @param {object} data - { nombre, email }
   */
  static async update(id, { nombre, email }) {
    const personaId = parseId(id, 'id');
    const validNombre = validateRequiredString(nombre, 'nombre', 100);
    const validEmail = validateEmail(email);

    // Verificar existencia previa
    await this.getById(personaId);

    // Verificar si el nuevo correo pertenece a otra persona
    const emailConflictQuery = 'SELECT id FROM personas WHERE email = $1 AND id <> $2;';
    const emailConflict = await pool.query(emailConflictQuery, [validEmail, personaId]);
    if (emailConflict.rows.length > 0) {
      throw AppError.conflict(`El correo electrónico "${validEmail}" ya está en uso por otra persona.`);
    }

    const updateQuery = `
      UPDATE personas
      SET nombre = $1, email = $2
      WHERE id = $3
      RETURNING id, nombre, email, creado_en;
    `;
    const result = await pool.query(updateQuery, [validNombre, validEmail, personaId]);
    return result.rows[0];
  }

  /**
   * Actualiza parcialmente los datos de una persona (PATCH).
   * @param {number} id 
   * @param {object} data - { nombre, email }
   */
  static async partialUpdate(id, { nombre, email }) {
    const personaId = parseId(id, 'id');
    const existing = await this.getById(personaId);

    if (nombre === undefined && email === undefined) {
      throw AppError.badRequest('Debe proporcionar al menos un campo para actualizar ("nombre" o "email").');
    }

    let finalNombre = existing.nombre;
    let finalEmail = existing.email;

    if (nombre !== undefined) {
      finalNombre = validateRequiredString(nombre, 'nombre', 100);
    }

    if (email !== undefined) {
      finalEmail = validateEmail(email);
      // Validar si el nuevo email ya está tomado por otra persona
      const emailConflictQuery = 'SELECT id FROM personas WHERE email = $1 AND id <> $2;';
      const emailConflict = await pool.query(emailConflictQuery, [finalEmail, personaId]);
      if (emailConflict.rows.length > 0) {
        throw AppError.conflict(`El correo electrónico "${finalEmail}" ya está en uso por otra persona.`);
      }
    }

    const updateQuery = `
      UPDATE personas
      SET nombre = $1, email = $2
      WHERE id = $3
      RETURNING id, nombre, email, creado_en;
    `;
    const result = await pool.query(updateQuery, [finalNombre, finalEmail, personaId]);
    return result.rows[0];
  }

  /**
   * Elimina una persona del sistema global si no tiene restricciones de integridad referencial.
   * @param {number} id 
   */
  static async delete(id) {
    const personaId = parseId(id, 'id');
    await this.getById(personaId);

    // Verificar dependencias explícitas para entregar mensajes amigables
    const depsQuery = `
      SELECT
        (SELECT COUNT(*) FROM grupo_personas WHERE persona_id = $1) AS grupos_count,
        (SELECT COUNT(*) FROM gastos WHERE pagado_por = $1) AS gastos_count,
        (SELECT COUNT(*) FROM participaciones WHERE persona_id = $1) AS participaciones_count,
        (SELECT COUNT(*) FROM liquidaciones WHERE de_persona = $1 OR a_persona = $1) AS liquidaciones_count;
    `;
    const depsResult = await pool.query(depsQuery, [personaId]);
    const { grupos_count, gastos_count, participaciones_count, liquidaciones_count } = depsResult.rows[0];

    if (
      parseInt(grupos_count, 10) > 0 ||
      parseInt(gastos_count, 10) > 0 ||
      parseInt(participaciones_count, 10) > 0 ||
      parseInt(liquidaciones_count, 10) > 0
    ) {
      throw AppError.conflict(
        'No se puede eliminar la persona porque tiene registros asociados (pertenece a grupos, ha pagado gastos, tiene participaciones o liquidaciones registradas).'
      );
    }

    const deleteQuery = 'DELETE FROM personas WHERE id = $1 RETURNING id;';
    await pool.query(deleteQuery, [personaId]);
    return { mensaje: `Persona con ID ${personaId} eliminada exitosamente.` };
  }
}
