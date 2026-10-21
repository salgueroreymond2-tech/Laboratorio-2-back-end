import { pool } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { parseId, validatePositiveAmount, validateRequiredString } from '../utils/validations.js';
import { toCents, fromCents, sumCents, percentageToBasisPoints } from '../utils/money.js';

export class GastosService {
  /**
   * Obtiene la lista de gastos, opcionalmente filtrada por grupo_id.
   * @param {object} filters - { grupo_id }
   */
  static async getAll(filters = {}) {
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

    if (filters.grupo_id !== undefined && filters.grupo_id !== null && filters.grupo_id !== '') {
      const gId = parseId(filters.grupo_id, 'grupo_id');
      params.push(gId);
      query += ` WHERE g.grupo_id = $${params.length}`;
    }

    query += ' ORDER BY g.fecha DESC, g.id DESC;';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Obtiene un gasto por ID con sus participaciones anidadas, incluyendo el nombre de cada participante.
   * @param {number} id 
   */
  static async getById(id) {
    const gastoId = parseId(id, 'id');

    const gastoQuery = `
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
    const gastoResult = await pool.query(gastoQuery, [gastoId]);

    if (gastoResult.rows.length === 0) {
      throw AppError.notFound(`No se encontró ningún gasto con el ID ${gastoId}.`);
    }

    const gasto = gastoResult.rows[0];

    const participacionesQuery = `
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
    const participacionesResult = await pool.query(participacionesQuery, [gastoId]);
    gasto.participaciones = participacionesResult.rows;

    return gasto;
  }

  /**
   * Calcula las participaciones de un gasto según su tipo de reparto y garantiza cuadre exacto en centavos.
   * @param {string} tipoReparto - 'IGUALES', 'PORCENTAJE', 'EXACTO'
   * @param {number} totalCents - Monto total en centavos
   * @param {Array} rawParticipantes - Entrada de participantes
   * @returns {Array<{ persona_id: number, monto_asignado_centavos: number }>}
   */
  static calculateParticipaciones(tipoReparto, totalCents, rawParticipantes) {
    if (!Array.isArray(rawParticipantes) || rawParticipantes.length === 0) {
      throw AppError.badRequest('Debe proporcionar al menos una persona participante para el gasto.');
    }

    // Verificar participantes duplicados
    const participantIds = rawParticipantes.map((p) => {
      const id = typeof p === 'object' && p !== null ? p.persona_id : p;
      return parseId(id, 'persona_id');
    });

    const uniqueIds = new Set(participantIds);
    if (uniqueIds.size !== participantIds.length) {
      throw AppError.conflict('No se permiten personas participantes duplicadas en el mismo gasto.');
    }

    switch (tipoReparto) {
      case 'IGUALES': {
        const sortedIds = [...participantIds].sort((a, b) => a - b);
        const count = sortedIds.length;
        const baseCents = Math.floor(totalCents / count);
        const remainderCents = totalCents % count;

        // Distribución determinista de centavos sobrantes a los primeros ordenados por persona_id
        return sortedIds.map((personaId, index) => {
          const extra = index < remainderCents ? 1 : 0;
          return {
            persona_id: personaId,
            monto_asignado_centavos: baseCents + extra,
          };
        });
      }

      case 'PORCENTAJE': {
        // Validar porcentajes y convertirlos a puntos básicos (100.00% = 10000 pb)
        const participantsData = rawParticipantes.map((p) => {
          if (typeof p !== 'object' || p === null) {
            throw AppError.badRequest('Para reparto por PORCENTAJE cada elemento debe contener "persona_id" y "porcentaje".');
          }
          const personaId = parseId(p.persona_id, 'persona_id');
          if (p.porcentaje === undefined || p.porcentaje === null) {
            throw AppError.badRequest(`Debe indicar el "porcentaje" para el participante con ID ${personaId}.`);
          }
          const basisPoints = percentageToBasisPoints(p.porcentaje);
          return {
            persona_id: personaId,
            basisPoints,
          };
        });

        // La suma de porcentajes debe ser exactamente 100% (10000 puntos básicos)
        const totalBasisPoints = participantsData.reduce((acc, p) => acc + p.basisPoints, 0);
        if (totalBasisPoints !== 10000) {
          throw AppError.conflict(
            `La suma de los porcentajes debe ser exactamente 100%. Actualmente suma ${(totalBasisPoints / 100).toFixed(2)}%.`
          );
        }

        // Método de mayores residuos (Hamilton-Hare)
        const initialCalculations = participantsData.map((p) => {
          const exactNumerator = totalCents * p.basisPoints;
          const floorCents = Math.floor(exactNumerator / 10000);
          const remainder = exactNumerator % 10000;
          return {
            persona_id: p.persona_id,
            floorCents,
            remainder,
          };
        });

        const sumFloor = sumCents(initialCalculations.map((c) => c.floorCents));
        const missingCents = totalCents - sumFloor;

        // Ordenar por residuo descendente; en empate, por persona_id ascendente para garantizar determinismo
        const sortedByRemainder = [...initialCalculations].sort((a, b) => {
          if (b.remainder !== a.remainder) {
            return b.remainder - a.remainder;
          }
          return a.persona_id - b.persona_id;
        });

        const winnersIds = new Set(sortedByRemainder.slice(0, missingCents).map((w) => w.persona_id));

        return initialCalculations.map((c) => ({
          persona_id: c.persona_id,
          monto_asignado_centavos: c.floorCents + (winnersIds.has(c.persona_id) ? 1 : 0),
        }));
      }

      case 'EXACTO': {
        const exactCalculations = rawParticipantes.map((p) => {
          if (typeof p !== 'object' || p === null) {
            throw AppError.badRequest('Para reparto EXACTO cada elemento debe contener "persona_id" y "monto_asignado".');
          }
          const personaId = parseId(p.persona_id, 'persona_id');
          if (p.monto_asignado === undefined || p.monto_asignado === null) {
            throw AppError.badRequest(`Debe especificar "monto_asignado" para el participante con ID ${personaId}.`);
          }

          let cents;
          try {
            cents = toCents(p.monto_asignado);
          } catch (err) {
            throw AppError.badRequest(err.message);
          }

          if (cents < 0) {
            throw AppError.badRequest(`El monto asignado al participante ${personaId} no puede ser negativo.`);
          }

          return {
            persona_id: personaId,
            monto_asignado_centavos: cents,
          };
        });

        const sumCalculated = sumCents(exactCalculations.map((c) => c.monto_asignado_centavos));
        if (sumCalculated !== totalCents) {
          throw AppError.conflict(
            `La suma de las participaciones (${fromCents(sumCalculated)}) no coincide con el monto total del gasto (${fromCents(totalCents)}).`
          );
        }

        return exactCalculations;
      }

      default:
        throw AppError.badRequest(`Tipo de reparto inválido: "${tipoReparto}". Valores permitidos: IGUALES, PORCENTAJE, EXACTO.`);
    }
  }

  /**
   * Crea un nuevo gasto y sus participaciones dentro de una transacción segura.
   * @param {object} data
   */
  static async create(data) {
    const {
      grupo_id,
      descripcion,
      monto,
      pagado_por,
      fecha,
      tipo_reparto,
      categoria = 'General',
      participantes,
      participaciones,
    } = data;

    const grupoId = parseId(grupo_id, 'grupo_id');
    const pagadoPorId = parseId(pagado_por, 'pagado_por');
    const validDesc = validateRequiredString(descripcion, 'descripcion', 255);
    const validCategoria = categoria ? validateRequiredString(categoria, 'categoria', 100) : 'General';
    const totalCents = validatePositiveAmount(monto, 'monto');

    if (!tipo_reparto || !['IGUALES', 'PORCENTAJE', 'EXACTO'].includes(tipo_reparto)) {
      throw AppError.badRequest('El campo "tipo_reparto" debe ser uno de: IGUALES, PORCENTAJE, EXACTO.');
    }

    const rawParticipantes = participantes || participaciones;
    if (!rawParticipantes || !Array.isArray(rawParticipantes) || rawParticipantes.length === 0) {
      throw AppError.badRequest('Debe proporcionar el listado de participantes para el gasto.');
    }

    // Calcular y cuadrar participaciones antes de tocar la base de datos
    const participacionesCalculadas = this.calculateParticipaciones(tipo_reparto, totalCents, rawParticipantes);

    // Iniciar conexión y transacción
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Validar que el grupo exista
      const grupoRes = await client.query('SELECT id FROM grupos WHERE id = $1;', [grupoId]);
      if (grupoRes.rows.length === 0) {
        throw AppError.notFound(`El grupo con ID ${grupoId} no existe.`);
      }

      // 2. Validar que la persona pagadora exista y pertenezca al grupo
      const pagadorRes = await client.query('SELECT id FROM personas WHERE id = $1;', [pagadoPorId]);
      if (pagadorRes.rows.length === 0) {
        throw AppError.notFound(`La persona pagadora con ID ${pagadoPorId} no existe.`);
      }

      const pagadorMiembroRes = await client.query(
        'SELECT 1 FROM grupo_personas WHERE grupo_id = $1 AND persona_id = $2;',
        [grupoId, pagadoPorId]
      );
      if (pagadorMiembroRes.rows.length === 0) {
        throw AppError.conflict(`La persona pagadora (ID ${pagadoPorId}) no es integrante del grupo ${grupoId}.`);
      }

      // 3. Validar que todas las personas participantes pertenezcan al grupo
      const partIds = participacionesCalculadas.map((p) => p.persona_id);
      const miembrosRes = await client.query(
        'SELECT persona_id FROM grupo_personas WHERE grupo_id = $1 AND persona_id = ANY($2::int[]);',
        [grupoId, partIds]
      );
      const miembrosEncontrados = new Set(miembrosRes.rows.map((r) => r.persona_id));

      for (const pId of partIds) {
        if (!miembrosEncontrados.has(pId)) {
          throw AppError.conflict(`El participante con ID ${pId} no es integrante del grupo ${grupoId}.`);
        }
      }

      // 4. Insertar el gasto
      const insertGastoQuery = `
        INSERT INTO gastos (grupo_id, descripcion, monto, pagado_por, fecha, tipo_reparto, categoria)
        VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6, $7)
        RETURNING id, grupo_id, descripcion, monto::TEXT, pagado_por, fecha::TEXT, tipo_reparto, categoria, creado_en;
      `;
      const gastoResult = await client.query(insertGastoQuery, [
        grupoId,
        validDesc,
        fromCents(totalCents),
        pagadoPorId,
        fecha || null,
        tipo_reparto,
        validCategoria,
      ]);
      const nuevoGasto = gastoResult.rows[0];

      // 5. Insertar participaciones
      const participacionesCreadas = [];
      for (const part of participacionesCalculadas) {
        const montoAsignado = fromCents(part.monto_asignado_centavos);
        const insertPartQuery = `
          INSERT INTO participaciones (gasto_id, persona_id, monto_asignado)
          VALUES ($1, $2, $3)
          RETURNING id, persona_id, monto_asignado::TEXT;
        `;
        const partResult = await client.query(insertPartQuery, [nuevoGasto.id, part.persona_id, montoAsignado]);
        participacionesCreadas.push(partResult.rows[0]);
      }

      await client.query('COMMIT');

      // Consultar y retornar el gasto completo con nombres de grupo, pagador y participantes
      return await this.getById(nuevoGasto.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Actualiza completamente un gasto (PUT).
   * Vuelve a validar cuadre de participaciones y ejecuta en transacción.
   */
  static async update(id, data) {
    const gastoId = parseId(id, 'id');
    const existing = await this.getById(gastoId);

    const {
      grupo_id = existing.grupo_id,
      descripcion,
      monto,
      pagado_por,
      fecha = existing.fecha,
      tipo_reparto,
      categoria = existing.categoria,
      participantes,
      participaciones,
    } = data;

    const grupoId = parseId(grupo_id, 'grupo_id');
    const pagadoPorId = parseId(pagado_por, 'pagado_por');
    const validDesc = validateRequiredString(descripcion, 'descripcion', 255);
    const validCategoria = validateRequiredString(categoria, 'categoria', 100);
    const totalCents = validatePositiveAmount(monto, 'monto');

    if (!tipo_reparto || !['IGUALES', 'PORCENTAJE', 'EXACTO'].includes(tipo_reparto)) {
      throw AppError.badRequest('El campo "tipo_reparto" debe ser uno de: IGUALES, PORCENTAJE, EXACTO.');
    }

    const rawParticipantes = participantes || participaciones;
    if (!rawParticipantes || !Array.isArray(rawParticipantes) || rawParticipantes.length === 0) {
      throw AppError.badRequest('Debe proporcionar el listado de participantes para el gasto.');
    }

    const participacionesCalculadas = this.calculateParticipaciones(tipo_reparto, totalCents, rawParticipantes);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Validar que el grupo exista
      const grupoRes = await client.query('SELECT id FROM grupos WHERE id = $1;', [grupoId]);
      if (grupoRes.rows.length === 0) {
        throw AppError.notFound(`El grupo con ID ${grupoId} no existe.`);
      }

      // 2. Validar que la persona pagadora exista y pertenezca al grupo
      const pagadorRes = await client.query('SELECT id FROM personas WHERE id = $1;', [pagadoPorId]);
      if (pagadorRes.rows.length === 0) {
        throw AppError.notFound(`La persona pagadora con ID ${pagadoPorId} no existe.`);
      }

      const pagadorMiembroRes = await client.query(
        'SELECT 1 FROM grupo_personas WHERE grupo_id = $1 AND persona_id = $2;',
        [grupoId, pagadoPorId]
      );
      if (pagadorMiembroRes.rows.length === 0) {
        throw AppError.conflict(`La persona pagadora (ID ${pagadoPorId}) no es integrante del grupo ${grupoId}.`);
      }

      const partIds = participacionesCalculadas.map((p) => p.persona_id);
      const miembrosRes = await client.query(
        'SELECT persona_id FROM grupo_personas WHERE grupo_id = $1 AND persona_id = ANY($2::int[]);',
        [grupoId, partIds]
      );
      const miembrosEncontrados = new Set(miembrosRes.rows.map((r) => r.persona_id));
      for (const pId of partIds) {
        if (!miembrosEncontrados.has(pId)) {
          throw AppError.conflict(`El participante con ID ${pId} no es integrante del grupo ${grupoId}.`);
        }
      }

      // Actualizar cabecera del gasto
      const updateGastoQuery = `
        UPDATE gastos
        SET grupo_id = $1, descripcion = $2, monto = $3, pagado_por = $4, fecha = $5, tipo_reparto = $6, categoria = $7
        WHERE id = $8
        RETURNING id, grupo_id, descripcion, monto::TEXT, pagado_por, fecha::TEXT, tipo_reparto, categoria, creado_en;
      `;
      await client.query(updateGastoQuery, [
        grupoId,
        validDesc,
        fromCents(totalCents),
        pagadoPorId,
        fecha,
        tipo_reparto,
        validCategoria,
        gastoId,
      ]);

      // Reemplazar participaciones
      await client.query('DELETE FROM participaciones WHERE gasto_id = $1;', [gastoId]);

      for (const part of participacionesCalculadas) {
        const montoAsignado = fromCents(part.monto_asignado_centavos);
        const insertPartQuery = `
          INSERT INTO participaciones (gasto_id, persona_id, monto_asignado)
          VALUES ($1, $2, $3)
          RETURNING id, persona_id, monto_asignado::TEXT;
        `;
        await client.query(insertPartQuery, [gastoId, part.persona_id, montoAsignado]);
      }

      await client.query('COMMIT');

      return await this.getById(gastoId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Actualiza parcialmente un gasto (PATCH).
   * Si se alteran monto, tipo_reparto o participaciones, revalida el cuadre completo.
   */
  static async partialUpdate(id, data) {
    const gastoId = parseId(id, 'id');
    const existing = await this.getById(gastoId);

    const requiresRepartition =
      data.monto !== undefined ||
      data.tipo_reparto !== undefined ||
      data.participantes !== undefined ||
      data.participaciones !== undefined;

    if (requiresRepartition) {
      const mergedData = {
        grupo_id: data.grupo_id !== undefined ? data.grupo_id : existing.grupo_id,
        descripcion: data.descripcion !== undefined ? data.descripcion : existing.descripcion,
        monto: data.monto !== undefined ? data.monto : existing.monto,
        pagado_por: data.pagado_por !== undefined ? data.pagado_por : existing.pagado_por,
        fecha: data.fecha !== undefined ? data.fecha : existing.fecha,
        tipo_reparto: data.tipo_reparto !== undefined ? data.tipo_reparto : existing.tipo_reparto,
        categoria: data.categoria !== undefined ? data.categoria : existing.categoria,
        participaciones: data.participaciones || data.participantes || existing.participaciones,
      };
      return await this.update(gastoId, mergedData);
    }

    // Modificaciones menores de cabecera (descripcion, categoria, fecha, pagado_por)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let finalPagadoPor = existing.pagado_por;
      if (data.pagado_por !== undefined) {
        finalPagadoPor = parseId(data.pagado_por, 'pagado_por');
        const miembroRes = await client.query(
          'SELECT 1 FROM grupo_personas WHERE grupo_id = $1 AND persona_id = $2;',
          [existing.grupo_id, finalPagadoPor]
        );
        if (miembroRes.rows.length === 0) {
          throw AppError.conflict(`La persona pagadora (ID ${finalPagadoPor}) no es integrante del grupo ${existing.grupo_id}.`);
        }
      }

      const finalDesc = data.descripcion !== undefined ? validateRequiredString(data.descripcion, 'descripcion', 255) : existing.descripcion;
      const finalCat = data.categoria !== undefined ? validateRequiredString(data.categoria, 'categoria', 100) : existing.categoria;
      const finalFecha = data.fecha !== undefined ? data.fecha : existing.fecha;

      const updateQuery = `
        UPDATE gastos
        SET descripcion = $1, categoria = $2, fecha = $3, pagado_por = $4
        WHERE id = $5
        RETURNING id, grupo_id, descripcion, monto::TEXT, pagado_por, fecha::TEXT, tipo_reparto, categoria, creado_en;
      `;
      const updateResult = await client.query(updateQuery, [
        finalDesc,
        finalCat,
        finalFecha,
        finalPagadoPor,
        gastoId,
      ]);

      await client.query('COMMIT');
      const updatedGasto = updateResult.rows[0];
      updatedGasto.participaciones = existing.participaciones;
      return updatedGasto;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Elimina un gasto del sistema. Las participaciones asociadas se eliminan en cascada por BD.
   * @param {number} id 
   */
  static async delete(id) {
    const gastoId = parseId(id, 'id');
    await this.getById(gastoId);

    const query = 'DELETE FROM gastos WHERE id = $1 RETURNING id;';
    await pool.query(query, [gastoId]);
    return { mensaje: `Gasto con ID ${gastoId} y sus participaciones eliminados correctamente.` };
  }
}
