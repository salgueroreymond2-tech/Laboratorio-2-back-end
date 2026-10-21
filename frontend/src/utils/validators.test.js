import { describe, it, expect } from 'vitest';
import { validatePercentageSum, validateExactSum, validatePositiveAmount, validateEmail } from './validators.js';

describe('validators.js', () => {
  it('valida que la suma de porcentajes sea exactamente 100.00%', () => {
    const valid = [
      { persona_id: 1, porcentaje: '50.00' },
      { persona_id: 2, porcentaje: '25.00' },
      { persona_id: 3, porcentaje: '25.00' },
    ];
    const resValid = validatePercentageSum(valid);
    expect(resValid.isValid).toBe(true);
    expect(resValid.totalPct).toBe(100);
    expect(resValid.error).toBeNull();

    const invalidUnder = [
      { persona_id: 1, porcentaje: '40.00' },
      { persona_id: 2, porcentaje: '50.00' },
    ];
    const resUnder = validatePercentageSum(invalidUnder);
    expect(resUnder.isValid).toBe(false);
    expect(resUnder.error).toContain('Falta un 10.00%');

    const invalidOver = [
      { persona_id: 1, porcentaje: '60.00' },
      { persona_id: 2, porcentaje: '50.00' },
    ];
    const resOver = validatePercentageSum(invalidOver);
    expect(resOver.isValid).toBe(false);
    expect(resOver.error).toContain('Se excede en un 10.00%');
  });

  it('valida que los montos exactos asignados coincidan al centavo con el total', () => {
    const valid = [
      { persona_id: 1, monto_asignado: '25.50' },
      { persona_id: 2, monto_asignado: '30.00' },
      { persona_id: 3, monto_asignado: '20.00' },
    ];
    const resValid = validateExactSum(valid, '75.50');
    expect(resValid.isValid).toBe(true);
    expect(resValid.diffCents).toBe(0);
    expect(resValid.error).toBeNull();

    const invalid = [
      { persona_id: 1, monto_asignado: '20.00' },
      { persona_id: 2, monto_asignado: '50.00' },
    ];
    const resInvalid = validateExactSum(invalid, '75.50');
    expect(resInvalid.isValid).toBe(false);
    expect(resInvalid.diffCents).toBe(550); // 5.50 faltante
    expect(resInvalid.error).toContain('Faltan');
  });

  it('valida correos electrónicos válidos e inválidos', () => {
    expect(validateEmail('test@example.com')).toBeNull();
    expect(validateEmail('invalido')).toContain('inválido');
    expect(validateEmail('')).toContain('obligatorio');
  });

  it('valida montos positivos válidos', () => {
    expect(validatePositiveAmount(100)).toBeNull();
    expect(validatePositiveAmount('50.25')).toBeNull();
    expect(validatePositiveAmount(-10)).toContain('mayor a cero');
    expect(validatePositiveAmount(0)).toContain('mayor a cero');
  });
});
