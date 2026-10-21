/**
 * Capa centralizada de comunicación con la API REST del backend.
 * Conecta con http://localhost:3000/api (o valor en VITE_API_URL).
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Clase para representar errores de la API con código HTTP y detalles estructurados.
 */
export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Ejecutor central de peticiones HTTP con manejo estricto de JSON, AbortSignal y errores.
 * @param {string} endpoint - Ruta relativa (ej: '/gastos')
 * @param {object} options - Opciones de fetch (method, body, signal, etc.)
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    throw new ApiError(
      0,
      'No se pudo establecer conexión con el servidor. Verifica que el backend esté en ejecución.',
      err.message
    );
  }

  // Parsear respuesta de forma segura
  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = text ? { message: text } : null;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // El backend entrega { "error": "Mensaje descriptivo" }
    const errorMessage =
      data && typeof data === 'object' && data.error
        ? data.error
        : data && data.message
        ? data.message
        : `Error en la solicitud (${response.status} ${response.statusText})`;

    throw new ApiError(response.status, errorMessage, data);
  }

  return data;
}

/* ==========================================================================
   PERSONAS
   ========================================================================== */

export async function getPersonas(signal) {
  return request('/personas', { method: 'GET', signal });
}

export async function getPersona(id, signal) {
  return request(`/personas/${id}`, { method: 'GET', signal });
}

export async function createPersona(data, signal) {
  return request('/personas', { method: 'POST', body: data, signal });
}

export async function updatePersona(id, data, signal) {
  return request(`/personas/${id}`, { method: 'PUT', body: data, signal });
}

export async function deletePersona(id, signal) {
  return request(`/personas/${id}`, { method: 'DELETE', signal });
}

/* ==========================================================================
   GRUPOS
   ========================================================================== */

export async function getGrupos(signal) {
  return request('/grupos', { method: 'GET', signal });
}

export async function getGrupo(id, signal) {
  return request(`/grupos/${id}`, { method: 'GET', signal });
}

export async function createGrupo(data, signal) {
  return request('/grupos', { method: 'POST', body: data, signal });
}

export async function addPersonToGroup(groupId, personId, signal) {
  return request(`/grupos/${groupId}/personas`, {
    method: 'POST',
    body: { persona_id: personId },
    signal,
  });
}

export async function removePersonFromGroup(groupId, personId, signal) {
  return request(`/grupos/${groupId}/personas/${personId}`, {
    method: 'DELETE',
    signal,
  });
}

export async function getBalancesGrupo(id, signal) {
  return request(`/grupos/${id}/balances`, { method: 'GET', signal });
}

export async function getLiquidacionesSugeridas(id, signal) {
  return request(`/grupos/${id}/liquidaciones-sugeridas`, { method: 'GET', signal });
}

/* ==========================================================================
   GASTOS
   ========================================================================== */

export async function getGastos(params = {}, signal) {
  const query = new URLSearchParams();
  if (params.grupo_id) query.append('grupo_id', params.grupo_id);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return request(`/gastos${qs}`, { method: 'GET', signal });
}

export async function getGasto(id, signal) {
  return request(`/gastos/${id}`, { method: 'GET', signal });
}

export async function createGasto(data, signal) {
  return request('/gastos', { method: 'POST', body: data, signal });
}

export async function updateGasto(id, data, signal) {
  return request(`/gastos/${id}`, { method: 'PUT', body: data, signal });
}

export async function deleteGasto(id, signal) {
  return request(`/gastos/${id}`, { method: 'DELETE', signal });
}

/* ==========================================================================
   LIQUIDACIONES
   ========================================================================== */

export async function getLiquidaciones(params = {}, signal) {
  const query = new URLSearchParams();
  if (params.grupo_id) query.append('grupo_id', params.grupo_id);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return request(`/liquidaciones${qs}`, { method: 'GET', signal });
}

export async function createLiquidacion(data, signal) {
  return request('/liquidaciones', { method: 'POST', body: data, signal });
}

/* ==========================================================================
   RESUMEN Y MÉTRICAS
   ========================================================================== */

export async function getResumen(signal) {
  return request('/resumen', { method: 'GET', signal });
}
