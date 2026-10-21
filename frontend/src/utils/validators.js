import { toCents, sumCents, percentageToBasisPoints } from './money.js';

export function validateRequired(value, fieldName = 'campo') {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `El ${fieldName} es obligatorio.`;
  }
  return null;
}

export function validateEmail(email) {
  if (!email || !String(email).trim()) {
    return 'El correo electrónico es obligatorio.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email).trim())) {
    return 'El formato de correo electrónico es inválido.';
  }
  return null;
}

export function validatePositiveAmount(amount, fieldName = 'monto') {
  if (amount === undefined || amount === null || amount === '') {
    return `El ${fieldName} es obligatorio.`;
  }
  try {
    const cents = toCents(amount);
    if (cents <= 0) {
      return `El ${fieldName} debe ser mayor a cero.`;
    }
  } catch (err) {
    return err.message;
  }
  return null;
}

/**
 * Valida que la suma de porcentajes sea exactamente 100.00% (10000 puntos básicos).
 * @param {Array<{ persona_id: any, porcentaje: number|string }>} participants
 * @returns {{ isValid: boolean, totalPct: number, diffPct: number, error: string|null }}
 */
export function validatePercentageSum(participants = []) {
  if (!participants.length) {
    return { isValid: false, totalPct: 0, diffPct: 100, error: 'Debe haber al menos un participante.' };
  }

  let totalBasisPoints = 0;
  for (const p of participants) {
    const pb = percentageToBasisPoints(p.porcentaje || 0);
    totalBasisPoints += pb;
  }

  const totalPct = totalBasisPoints / 100;
  const diffPct = (10000 - totalBasisPoints) / 100;
  const isValid = totalBasisPoints === 10000;

  let error = null;
  if (!isValid) {
    if (totalBasisPoints < 10000) {
      error = `Falta un ${diffPct.toFixed(2)}% para completar el 100.00%.`;
    } else {
      error = `Se excede en un ${Math.abs(diffPct).toFixed(2)}% del 100.00%.`;
    }
  }

  return { isValid, totalPct, diffPct, error };
}

/**
 * Valida que la suma de montos exactos asignados coincida exactamente en centavos con el gasto total.
 * @param {Array<{ persona_id: any, monto_asignado: number|string }>} participants 
 * @param {number|string} totalAmount 
 * @returns {{ isValid: boolean, totalAssignedCents: number, targetCents: number, diffCents: number, error: string|null }}
 */
export function validateExactSum(participants = [], totalAmount = 0) {
  if (!participants.length) {
    return { isValid: false, totalAssignedCents: 0, targetCents: 0, diffCents: 0, error: 'Debe haber al menos un participante.' };
  }

  let targetCents = 0;
  try {
    targetCents = toCents(totalAmount);
  } catch {
    return { isValid: false, totalAssignedCents: 0, targetCents: 0, diffCents: 0, error: 'El monto total es inválido.' };
  }

  const assignedCents = participants.map((p) => {
    try {
      return toCents(p.monto_asignado || 0);
    } catch {
      return 0;
    }
  });

  const totalAssignedCents = sumCents(assignedCents);
  const diffCents = targetCents - totalAssignedCents;
  const isValid = targetCents > 0 && totalAssignedCents === targetCents;

  let error = null;
  if (!isValid) {
    if (diffCents > 0) {
      error = `Faltan ₡${(diffCents / 100).toFixed(2)} por asignar.`;
    } else if (diffCents < 0) {
      error = `Se excede en ₡${(Math.abs(diffCents) / 100).toFixed(2)} del monto total.`;
    } else if (targetCents <= 0) {
      error = 'El monto total debe ser mayor a cero.';
    }
  }

  return { isValid, totalAssignedCents, targetCents, diffCents, error };
}
