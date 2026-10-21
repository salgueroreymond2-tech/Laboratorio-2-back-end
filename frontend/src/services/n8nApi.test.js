import { describe, it, expect } from 'vitest';
import { validateN8nContract } from './n8nApi.js';

describe('n8nApi contract validation', () => {
  it('acepta una respuesta correcta con { ok: true, data: { ... } }', () => {
    const valid = {
      ok: true,
      data: {
        categoria: 'Alimentación',
        confianza: 0.95,
        justificacion: 'Compra de alimentos',
      },
      error: null,
    };
    const data = validateN8nContract(valid);
    expect(data.categoria).toBe('Alimentación');
    expect(data.confianza).toBe(0.95);
  });

  it('lanza un error controlado cuando n8n responde { ok: false, error: { ... } }', () => {
    const errorResponse = {
      ok: false,
      data: null,
      error: {
        code: 'ACTION_UNKNOWN',
        message: 'Acción no soportada por el agente.',
      },
    };

    expect(() => validateN8nContract(errorResponse)).toThrowError(
      'Acción no soportada por el agente.'
    );
  });

  it('rechaza respuestas que no cumplen la estructura { ok, data, error }', () => {
    expect(() => validateN8nContract(null)).toThrowError('no es un objeto JSON');
    expect(() => validateN8nContract('cadena')).toThrowError('no es un objeto JSON');
    expect(() => validateN8nContract({ foo: 'bar' })).toThrowError('campo "ok" ausente');
    expect(() => validateN8nContract({ ok: true, data: null })).toThrowError('no contiene el campo "data"');
  });
});
