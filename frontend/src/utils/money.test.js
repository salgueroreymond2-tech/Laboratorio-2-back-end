import { describe, it, expect } from 'vitest';
import { toCents, fromCents, sumCents, compareCents, percentageToBasisPoints, formatMoney } from './money.js';

describe('money.js utils', () => {
  it('convierte montos decimales a centavos enteros sin error de coma flotante', () => {
    expect(toCents(100.01)).toBe(10001);
    expect(toCents('120.50')).toBe(12050);
    expect(toCents('0.05')).toBe(5);
    expect(toCents('0')).toBe(0);
    expect(toCents(null)).toBe(0);
    expect(toCents(-50.25)).toBe(-5025);
  });

  it('convierte centavos a formato decimal con dos posiciones', () => {
    expect(fromCents(10001)).toBe('100.01');
    expect(fromCents(12050)).toBe('120.50');
    expect(fromCents(5)).toBe('0.05');
    expect(fromCents(0)).toBe('0.00');
    expect(fromCents(-5025)).toBe('-50.25');
  });

  it('suma centavos enteros exactamente', () => {
    expect(sumCents([3334, 3334, 3333])).toBe(10001);
    expect(sumCents([2000, 1500, 1500])).toBe(5000);
    expect(sumCents([])).toBe(0);
  });

  it('compara centavos correctamente', () => {
    expect(compareCents(100, 200)).toBe(-1);
    expect(compareCents(200, 200)).toBe(0);
    expect(compareCents(300, 200)).toBe(1);
  });

  it('convierte porcentajes a puntos básicos enteros', () => {
    expect(percentageToBasisPoints(100)).toBe(10000);
    expect(percentageToBasisPoints('33.33')).toBe(3333);
    expect(percentageToBasisPoints('50.00')).toBe(5000);
    expect(percentageToBasisPoints(0)).toBe(0);
  });

  it('formatea montos con símbolo de moneda local (CRC)', () => {
    const formatted = formatMoney(1500.5);
    expect(formatted).toContain('₡');
    const normalized = formatted.replace(/\u00A0/g, ' ');
    expect(normalized).toMatch(/1[\s\.]500,50/);
  });
});
