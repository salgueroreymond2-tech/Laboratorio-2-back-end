import { pool } from '../db.js';
import { AppError } from '../errors/AppError.js';
import { parseId, validateRequiredString } from '../utils/validations.js';
import { toCents, fromCents, sumCents } from '../utils/money.js';

export class GruposService {
  /**
   * Obtiene todos los grupos registrados con el recuento de integrantes.
   */
  static async getAll() {
    const query = `
      SELECT 
        g.id, 
        g.nombre, 
        g.creado_en,
        COUNT(gp.persona_id)::INT AS cantidad_integrantes
      FROM grupos g
      LEFT JOIN grupo_personas gp ON g.id = gp.grupo_id
      GROUP BY g.id, g.nombre, g.creado_en
      ORDER BY g.id ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Obtiene un grupo por su ID junto con la lista detallada de sus integrantes.
   * @param {number} id 
   */
  static async getById(id) {
    const grupoId = parseId(id, 'id');
    const grupoQuery = 'SELECT id, nombre, creado_en FROM grupos WHERE id = $1;';
    const grupoResult = await pool.query(grupoQuery, [grupoId]);

    if (grupoResult.rows.length === 0) {
      throw AppError.notFound(`No se encontró ningún grupo con el ID ${grupoId}.`);
    }

    const grupo = grupoResult.rows[0];

    const integrantesQuery = `
      SELECT p.id, p.nombre, p.email, gp.agregado_en
      FROM grupo_personas gp
      JOIN personas p ON gp.persona_id = p.id
      WHERE gp.grupo_id = $1
      ORDER BY p.id ASC;
    `;
    const integrantesResult = await pool.query(integrantesQuery, [grupoId]);
    grupo.integrantes = integrantesResult.rows;

    return grupo;
  }

  /**
   * Registra un nuevo grupo.
   * @param {object} data - { nombre }
   */
  static async create({ nombre }) {
    const validNombre = validateRequiredString(nombre, 'nombre', 100);

    const query = `
      INSERT INTO grupos (nombre)
      VALUES ($1)
      RETURNING id, nombre, creado_en;
    `;
    const result = await pool.query(query, [validNombre]);
    return result.rows[0];
  }

  /**
   * Agrega un integrante a un grupo.
   * @param {number} grupoId 
   * @param {number} personaId 
   */
  static async addPersona(grupoId, personaId) {
    const gId = parseId(grupoId, 'grupoId');
    const pId = parseId(personaId, 'personaId');

    // Verificar existencia del grupo
    await this.getById(gId);

    // Verificar existencia de la persona
    const personaQuery = 'SELECT id, nombre, email FROM personas WHERE id = $1;';
    const personaResult = await pool.query(personaQuery, [pId]);
    if (personaResult.rows.length === 0) {
      throw AppError.notFound(`No se encontró la persona con ID ${pId}.`);
    }

    // Verificar si ya pertenece al grupo
    const checkQuery = 'SELECT 1 FROM grupo_personas WHERE grupo_id = $1 AND persona_id = $2;';
    const checkResult = await pool.query(checkQuery, [gId, pId]);
    if (checkResult.rows.length > 0) {
      throw AppError.conflict(`La persona con ID ${pId} ya es integrante del grupo ${gId}.`);
    }

    const insertQuery = `
      INSERT INTO grupo_personas (grupo_id, persona_id)
      VALUES ($1, $2)
      RETURNING grupo_id, persona_id, agregado_en;
    `;
    const result = await pool.query(insertQuery, [gId, pId]);
    return {
      mensaje: 'Persona agregada al grupo exitosamente.',
      asociacion: result.rows[0],
    };
  }

  /**
   * Calcula los balances netos de todos los integrantes de un grupo.
   * 
   * Fórmula oficial de balance:
   * balance = pagado - consumido + liquidaciones_pagadas - liquidaciones_recibidas
   * 
   * Convención:
   * - Balance > 0: Acreedor (debe recibir dinero)
   * - Balance < 0: Deudor (debe pagar dinero)
   * - Balance = 0: Saldado
   * 
   * @param {number} grupoId 
   */
  static async getBalances(grupoId) {
    const gId = parseId(grupoId, 'grupoId');
    const grupo = await this.getById(gId);

    const query = `
      WITH integrantes AS (
        SELECT p.id AS persona_id, p.nombre, p.email
        FROM grupo_personas gp
        JOIN personas p ON gp.persona_id = p.id
        WHERE gp.grupo_id = $1
      ),
      pagado AS (
        SELECT pagado_por AS persona_id, COALESCE(SUM(monto), 0) AS total_pagado
        FROM gastos
        WHERE grupo_id = $1
        GROUP BY pagado_por
      ),
      consumido AS (
        SELECT part.persona_id, COALESCE(SUM(part.monto_asignado), 0) AS total_consumido
        FROM participaciones part
        JOIN gastos g ON part.gasto_id = g.id
        WHERE g.grupo_id = $1
        GROUP BY part.persona_id
      ),
      liq_pagadas AS (
        SELECT de_persona AS persona_id, COALESCE(SUM(monto), 0) AS total_liq_pagadas
        FROM liquidaciones
        WHERE grupo_id = $1
        GROUP BY de_persona
      ),
      liq_recibidas AS (
        SELECT a_persona AS persona_id, COALESCE(SUM(monto), 0) AS total_liq_recibidas
        FROM liquidaciones
        WHERE grupo_id = $1
        GROUP BY a_persona
      )
      SELECT
        i.persona_id,
        i.nombre,
        i.email,
        COALESCE(p.total_pagado, 0)::TEXT AS pagado,
        COALESCE(c.total_consumido, 0)::TEXT AS consumido,
        COALESCE(lp.total_liq_pagadas, 0)::TEXT AS liquidaciones_pagadas,
        COALESCE(lr.total_liq_recibidas, 0)::TEXT AS liquidaciones_recibidas
      FROM integrantes i
      LEFT JOIN pagado p ON i.persona_id = p.persona_id
      LEFT JOIN consumido c ON i.persona_id = c.persona_id
      LEFT JOIN liq_pagadas lp ON i.persona_id = lp.persona_id
      LEFT JOIN liq_recibidas lr ON i.persona_id = lr.persona_id
      ORDER BY i.persona_id ASC;
    `;

    const result = await pool.query(query, [gId]);

    const balances = result.rows.map((row) => {
      const pagadoCents = toCents(row.pagado);
      const consumidoCents = toCents(row.consumido);
      const liqPagadasCents = toCents(row.liquidaciones_pagadas);
      const liqRecibidasCents = toCents(row.liquidaciones_recibidas);

      // balance = pagado - consumido + liquidaciones_pagadas - liquidaciones_recibidas
      const balanceCents = pagadoCents - consumidoCents + liqPagadasCents - liqRecibidasCents;

      let estado = 'Saldado';
      if (balanceCents > 0) estado = 'Acreedor';
      else if (balanceCents < 0) estado = 'Deudor';

      return {
        persona_id: row.persona_id,
        nombre: row.nombre,
        email: row.email,
        pagado: fromCents(pagadoCents),
        consumido: fromCents(consumidoCents),
        liquidaciones_pagadas: fromCents(liqPagadasCents),
        liquidaciones_recibidas: fromCents(liqRecibidasCents),
        balance_neto: fromCents(balanceCents),
        balance_centavos: balanceCents,
        estado,
      };
    });

    return {
      grupo_id: gId,
      grupo_nombre: grupo.nombre,
      formula: 'balance = pagado - consumido + liquidaciones_pagadas - liquidaciones_recibidas',
      balances,
    };
  }

  /**
   * Elimina un integrante de un grupo bloqueando la operación si su balance no es exactamente cero.
   * Utiliza una transacción y bloqueo de fila (FOR UPDATE) para prevenir condiciones de carrera.
   * @param {number} grupoId 
   * @param {number} personaId 
   */
  static async removePersona(grupoId, personaId) {
    const gId = parseId(grupoId, 'grupoId');
    const pId = parseId(personaId, 'personaId');

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Bloquear el grupo para evitar inserciones concurrentes de gastos o liquidaciones
      const grupoCheck = await client.query('SELECT id, nombre FROM grupos WHERE id = $1 FOR UPDATE;', [gId]);
      if (grupoCheck.rows.length === 0) {
        throw AppError.notFound(`No se encontró el grupo con ID ${gId}.`);
      }

      // 2. Verificar que la persona sea integrante del grupo
      const memberCheck = await client.query(
        'SELECT 1 FROM grupo_personas WHERE grupo_id = $1 AND persona_id = $2 FOR UPDATE;',
        [gId, pId]
      );
      if (memberCheck.rows.length === 0) {
        throw AppError.notFound(`La persona con ID ${pId} no pertenece al grupo ${gId}.`);
      }

      // 3. Calcular el balance exacto dentro de la transacción
      const balanceQuery = `
        WITH pagado AS (
          SELECT COALESCE(SUM(monto), 0) AS total_pagado
          FROM gastos
          WHERE grupo_id = $1 AND pagado_por = $2
        ),
        consumido AS (
          SELECT COALESCE(SUM(part.monto_asignado), 0) AS total_consumido
          FROM participaciones part
          JOIN gastos g ON part.gasto_id = g.id
          WHERE g.grupo_id = $1 AND part.persona_id = $2
        ),
        liq_pagadas AS (
          SELECT COALESCE(SUM(monto), 0) AS total_liq_pagadas
          FROM liquidaciones
          WHERE grupo_id = $1 AND de_persona = $2
        ),
        liq_recibidas AS (
          SELECT COALESCE(SUM(monto), 0) AS total_liq_recibidas
          FROM liquidaciones
          WHERE grupo_id = $1 AND a_persona = $2
        )
        SELECT
          p.total_pagado::TEXT AS pagado,
          c.total_consumido::TEXT AS consumido,
          lp.total_liq_pagadas::TEXT AS liquidaciones_pagadas,
          lr.total_liq_recibidas::TEXT AS liquidaciones_recibidas
        FROM pagado p, consumido c, liq_pagadas lp, liq_recibidas lr;
      `;

      const bResult = await client.query(balanceQuery, [gId, pId]);
      const { pagado, consumido, liquidaciones_pagadas, liquidaciones_recibidas } = bResult.rows[0];

      const pagadoCents = toCents(pagado);
      const consumidoCents = toCents(consumido);
      const liqPagadasCents = toCents(liquidaciones_pagadas);
      const liqRecibidasCents = toCents(liquidaciones_recibidas);

      const balanceCents = pagadoCents - consumidoCents + liqPagadasCents - liqRecibidasCents;

      // 4. Exigir que el balance sea exactamente cero
      if (balanceCents !== 0) {
        const montoPendiente = fromCents(balanceCents);
        const tipoPendiente = balanceCents > 0 ? 'un saldo a favor (crédito)' : 'una deuda pendiente';
        throw AppError.conflict(
          `No se puede eliminar a la persona del grupo porque tiene ${tipoPendiente} de $${montoPendiente}. El balance debe ser exactamente 0.00 para retirarse.`
        );
      }

      // 5. Proceder con la eliminación del integrante del grupo
      await client.query('DELETE FROM grupo_personas WHERE grupo_id = $1 AND persona_id = $2;', [gId, pId]);

      await client.query('COMMIT');

      return {
        mensaje: `La persona con ID ${pId} fue eliminada exitosamente del grupo ${gId} con balance saldado (0.00).`,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Algoritmo de Liquidaciones Sugeridas para saldar deudas pendientes de forma óptima.
   * No inserta transferencias en la base de datos; únicamente devuelve sugerencias.
   * @param {number} grupoId 
   */
  static async getLiquidacionesSugeridas(grupoId) {
    const data = await this.getBalances(grupoId);
    const balances = data.balances;

    // 1. Convertir balances a centavos enteros
    const allCents = balances.map((b) => b.balance_centavos);
    const sumTotalCents = sumCents(allCents);

    // Verificación de integridad financiera (la suma total del grupo debe cuadrar en 0)
    if (sumTotalCents !== 0) {
      throw AppError.conflict(
        `Inconsistencia financiera en el grupo: la suma de todos los balances es ${fromCents(sumTotalCents)} y debería ser 0.00.`
      );
    }

    // 2. Separar acreedores y deudores ignorando a los saldados (balance === 0)
    const acreedores = [];
    const deudores = [];

    for (const b of balances) {
      if (b.balance_centavos > 0) {
        acreedores.push({
          persona_id: b.persona_id,
          nombre: b.nombre,
          saldo_centavos: b.balance_centavos,
        });
      } else if (b.balance_centavos < 0) {
        deudores.push({
          persona_id: b.persona_id,
          nombre: b.nombre,
          // La deuda se maneja en valor absoluto positivo para el algoritmo voraz
          saldo_centavos: Math.abs(b.balance_centavos),
        });
      }
    }

    // 3. Ordenar descendentemente por monto pendiente
    acreedores.sort((a, b) => b.saldo_centavos - a.saldo_centavos);
    deudores.sort((a, b) => b.saldo_centavos - a.saldo_centavos);

    const liquidacionesSugeridas = [];
    let iAcreedor = 0;
    let iDeudor = 0;

    // 4. Algoritmo voraz (Greedy) emparejando mayor deudor con mayor acreedor
    while (iAcreedor < acreedores.length && iDeudor < deudores.length) {
      const acreedor = acreedores[iAcreedor];
      const deudor = deudores[iDeudor];

      const montoTransferenciaCents = Math.min(acreedor.saldo_centavos, deudor.saldo_centavos);

      if (montoTransferenciaCents > 0) {
        liquidacionesSugeridas.push({
          de_persona: deudor.persona_id,
          de_nombre: deudor.nombre,
          a_persona: acreedor.persona_id,
          a_nombre: acreedor.nombre,
          monto: fromCents(montoTransferenciaCents),
        });

        acreedor.saldo_centavos -= montoTransferenciaCents;
        deudor.saldo_centavos -= montoTransferenciaCents;
      }

      if (acreedor.saldo_centavos === 0) {
        iAcreedor++;
      }

      if (deudor.saldo_centavos === 0) {
        iDeudor++;
      }
    }

    // Proyectar balances limpios sin los centavos de cálculo interno
    const cleanBalances = balances.map(({ balance_centavos, ...rest }) => rest);

    return {
      grupo_id: data.grupo_id,
      balances: cleanBalances,
      liquidaciones_sugeridas: liquidacionesSugeridas,
      cantidad_transferencias: liquidacionesSugeridas.length,
    };
  }
}
