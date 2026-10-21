import { pool } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { parseId, validatePositiveAmount } from '../utils/validations.js';
import { fromCents } from '../utils/money.js';

export class LiquidacionesService {
  /**
   * Obtiene la lista de liquidaciones registradas, con nombres y filtro opcional por grupo_id.
   * @param {object} filters - { grupo_id }
   */
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        l.id,
        l.grupo_id,
        g.nombre AS grupo_nombre,
        l.de_persona,
        p_de.nombre AS de_persona_nombre,
        l.a_persona,
        p_a.nombre AS a_persona_nombre,
        l.monto::TEXT,
        l.fecha::TEXT,
        l.creado_en
      FROM liquidaciones l
      JOIN grupos g ON l.grupo_id = g.id
      JOIN personas p_de ON l.de_persona = p_de.id
      JOIN personas p_a ON l.a_persona = p_a.id
    `;
    const params = [];

    if (filters.grupo_id !== undefined && filters.grupo_id !== null && filters.grupo_id !== '') {
      const gId = parseId(filters.grupo_id, 'grupo_id');
      params.push(gId);
      query += ` WHERE l.grupo_id = $${params.length}`;
    }

    query += ' ORDER BY l.fecha DESC, l.id DESC;';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Registra una nueva liquidación entre dos integrantes de un grupo.
   * @param {object} data - { grupo_id, de_persona, a_persona, monto, fecha }
   */
  static async create(data) {
    const { grupo_id, de_persona, a_persona, monto, fecha } = data;

    const grupoId = parseId(grupo_id, 'grupo_id');
    const dePersonaId = parseId(de_persona, 'de_persona');
    const aPersonaId = parseId(a_persona, 'a_persona');
    const totalCents = validatePositiveAmount(monto, 'monto');

    if (dePersonaId === aPersonaId) {
      throw AppError.badRequest('La persona origen (de_persona) y la persona destino (a_persona) no pueden ser la misma.');
    }

    // 1. Validar que el grupo exista
    const grupoRes = await pool.query('SELECT id, nombre FROM grupos WHERE id = $1;', [grupoId]);
    if (grupoRes.rows.length === 0) {
      throw AppError.notFound(`El grupo con ID ${grupoId} no existe.`);
    }

    // 2. Validar que ambas personas existan en el sistema
    const dePersonaRes = await pool.query('SELECT id, nombre FROM personas WHERE id = $1;', [dePersonaId]);
    if (dePersonaRes.rows.length === 0) {
      throw AppError.notFound(`La persona pagadora con ID ${dePersonaId} no existe.`);
    }

    const aPersonaRes = await pool.query('SELECT id, nombre FROM personas WHERE id = $1;', [aPersonaId]);
    if (aPersonaRes.rows.length === 0) {
      throw AppError.notFound(`La persona receptora con ID ${aPersonaId} no existe.`);
    }

    // 3. Validar que ambas personas pertenezcan al grupo
    const deMiembroRes = await pool.query(
      'SELECT 1 FROM grupo_personas WHERE grupo_id = $1 AND persona_id = $2;',
      [grupoId, dePersonaId]
    );
    if (deMiembroRes.rows.length === 0) {
      throw AppError.conflict(`La persona pagadora (ID ${dePersonaId}) no es integrante del grupo ${grupoId}.`);
    }

    const aMiembroRes = await pool.query(
      'SELECT 1 FROM grupo_personas WHERE grupo_id = $1 AND persona_id = $2;',
      [grupoId, aPersonaId]
    );
    if (aMiembroRes.rows.length === 0) {
      throw AppError.conflict(`La persona receptora (ID ${aPersonaId}) no es integrante del grupo ${grupoId}.`);
    }

    // 4. Insertar la liquidación
    const insertQuery = `
      INSERT INTO liquidaciones (grupo_id, de_persona, a_persona, monto, fecha)
      VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE))
      RETURNING id, grupo_id, de_persona, a_persona, monto::TEXT, fecha::TEXT, creado_en;
    `;
    const result = await pool.query(insertQuery, [
      grupoId,
      dePersonaId,
      aPersonaId,
      fromCents(totalCents),
      fecha || null,
    ]);

    const liquidacion = result.rows[0];
    liquidacion.de_persona_nombre = dePersonaRes.rows[0].nombre;
    liquidacion.a_persona_nombre = aPersonaRes.rows[0].nombre;
    liquidacion.grupo_nombre = grupoRes.rows[0].nombre;

    return liquidacion;
  }
}
