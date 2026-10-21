/**
 * Servicio de comunicación con el agente de IA en n8n mediante Webhook.
 * Valida de forma estricta el contrato { ok, data, error }.
 */

const N8N_WEBHOOK_URL =
  import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/gastos-ia';

export const ALLOWED_CATEGORIES = [
  'Vivienda',
  'Alimentación',
  'Transporte',
  'Servicios',
  'Entretenimiento',
  'Salud',
  'Educación',
  'Viajes',
  'Compras',
  'Otros',
];

/**
 * Valida la estructura devuelta por n8n para asegurar que cumple con el contrato.
 * @param {any} resJson 
 */
export function validateN8nContract(resJson) {
  if (!resJson || typeof resJson !== 'object') {
    throw new Error('La respuesta de n8n no es un objeto JSON válido.');
  }

  if (typeof resJson.ok !== 'boolean') {
    throw new Error('La respuesta de n8n no cumple el contrato: campo "ok" ausente o no booleano.');
  }

  if (resJson.ok === false) {
    const errorObj = resJson.error;
    const msg =
      errorObj && typeof errorObj === 'object' && errorObj.message
        ? errorObj.message
        : typeof errorObj === 'string'
        ? errorObj
        : 'Error desconocido retornado por el agente de n8n.';
    const err = new Error(msg);
    err.code = (errorObj && errorObj.code) || 'N8N_AGENT_ERROR';
    throw err;
  }

  if (resJson.ok === true && (resJson.data === undefined || resJson.data === null)) {
    throw new Error('La respuesta de n8n indica "ok: true" pero no contiene el campo "data".');
  }

  return resJson.data;
}

/**
 * Envía una solicitud al webhook de n8n con timeout y validación estricta.
 * @param {object} payload 
 * @param {AbortSignal} externalSignal 
 * @returns {Promise<any>}
 */
async function callN8nWebhook(payload, externalSignal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

  const combinedSignal = externalSignal
    ? AbortSignal.any
      ? AbortSignal.any([controller.signal, externalSignal])
      : externalSignal
    : controller.signal;

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`El webhook de n8n respondió con error HTTP ${response.status} (${response.statusText}).`);
    }

    const json = await response.json();
    return validateN8nContract(json);
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new Error('La solicitud al agente de IA en n8n excedió el tiempo límite de espera.');
    }

    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error(
        'No se pudo conectar con el webhook de n8n. Verifica que n8n esté ejecutándose en http://localhost:5678 y el workflow esté activo.'
      );
    }

    throw err;
  }
}

/**
 * Solicita al agente de n8n la clasificación inteligente de un gasto.
 * @param {string} description - Descripción del gasto
 * @param {AbortSignal} signal 
 * @returns {Promise<{ categoria: string, confianza: number, justificacion: string }>}
 */
export async function classifyExpense(description, signal) {
  if (!description || !description.trim()) {
    throw new Error('Debe proporcionar una descripción para clasificar el gasto.');
  }

  const payload = {
    action: 'clasificar_gasto',
    descripcion: description.trim(),
  };

  const data = await callN8nWebhook(payload, signal);

  // Normalizar categoría
  let categoria = data.categoria || 'Otros';
  const match = ALLOWED_CATEGORIES.find(
    (c) => c.toLowerCase() === String(categoria).trim().toLowerCase()
  );
  if (match) {
    categoria = match;
  } else {
    categoria = 'Otros';
  }

  return {
    categoria,
    confianza: typeof data.confianza === 'number' ? data.confianza : 0.9,
    justificacion: data.justificacion || 'Clasificado según la descripción del gasto.',
  };
}

/**
 * Solicita al agente de n8n la generación del resumen mensual del grupo en lenguaje natural.
 * @param {object} payload - { grupo_id, mes, gastos, balances }
 * @param {AbortSignal} signal 
 * @returns {Promise<{ grupo_id: number, mes: string, total_gastado: string, categoria_principal: string, resumen: string, recomendaciones: string[] }>}
 */
export async function generateMonthlySummary(payload, signal) {
  if (!payload || !payload.grupo_id) {
    throw new Error('Debe especificar el grupo para generar el resumen.');
  }

  const sanitizedPayload = {
    action: 'resumen_mensual',
    grupo_id: payload.grupo_id,
    mes: payload.mes || new Date().toISOString().slice(0, 7),
    gastos: (payload.gastos || []).map((g) => ({
      id: g.id,
      descripcion: g.descripcion,
      monto: g.monto,
      categoria: g.categoria,
      fecha: g.fecha,
      pagado_por_nombre: g.pagado_por_nombre,
    })),
    balances: (payload.balances || []).map((b) => ({
      persona_id: b.persona_id,
      nombre: b.nombre,
      balance_neto: b.balance_neto,
      estado: b.estado,
    })),
  };

  return await callN8nWebhook(sanitizedPayload, signal);
}
