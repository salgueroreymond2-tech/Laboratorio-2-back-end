/**
 * Utilidades para manejo seguro de dinero y cálculos financieros en centavos enteros.
 * Evita inconsistencias por imprecisión de coma flotante en JavaScript (IEEE 754).
 */

/**
 * Convierte un monto (número, string o tipo NUMERIC de PostgreSQL) a centavos enteros.
 * @param {number|string} amount - Monto decimal (ej: 120.50 o "120.50")
 * @returns {number} Monto expresado en centavos enteros (ej: 12050)
 */
export function toCents(amount) {
  if (amount === null || amount === undefined) {
    throw new Error('El monto no puede ser nulo o indefinido.');
  }

  const str = (typeof amount === 'number' ? amount.toFixed(2) : String(amount)).trim();

  if (!/^-?\d+(\.\d{1,2})?$/.test(str)) {
    throw new Error(`Monto inválido para conversión monetaria: "${amount}". Debe tener máximo dos decimales.`);
  }

  const isNegative = str.startsWith('-');
  const cleanStr = isNegative ? str.slice(1) : str;
  const [wholePart, decimalPart = ''] = cleanStr.split('.');

  const whole = parseInt(wholePart, 10);
  const cents = parseInt(decimalPart.padEnd(2, '0').slice(0, 2), 10);

  const totalCents = whole * 100 + cents;
  return isNegative ? -totalCents : totalCents;
}

/**
 * Convierte centavos enteros a una representación en string decimal con exactamente dos posiciones.
 * @param {number} cents - Monto en centavos enteros (ej: 12050)
 * @returns {string} Monto en formato decimal (ej: "120.50")
 */
export function fromCents(cents) {
  if (typeof cents !== 'number' || !Number.isInteger(cents)) {
    cents = parseInt(cents, 10);
    if (isNaN(cents)) {
      throw new Error(`Valor de centavos no válido: "${cents}"`);
    }
  }

  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const whole = Math.floor(absCents / 100);
  const remainder = absCents % 100;
  const decimalFormatted = `${whole}.${String(remainder).padStart(2, '0')}`;

  return isNegative ? `-${decimalFormatted}` : decimalFormatted;
}

/**
 * Convierte centavos enteros a valor numérico de JavaScript (útil para payloads JSON numéricos).
 * @param {number} cents 
 * @returns {number}
 */
export function centsToNumber(cents) {
  return parseFloat(fromCents(cents));
}

/**
 * Suma una lista o array de centavos enteros.
 * @param {number[]} centsArray 
 * @returns {number}
 */
export function sumCents(centsArray) {
  if (!Array.isArray(centsArray)) {
    throw new Error('Se requiere un array de centavos para sumar.');
  }
  return centsArray.reduce((acc, curr) => {
    const val = typeof curr === 'number' ? curr : parseInt(curr, 10);
    return acc + val;
  }, 0);
}

/**
 * Compara dos valores en centavos.
 * @param {number} a 
 * @param {number} b 
 * @returns {number} -1 si a < b, 0 si a === b, 1 si a > b
 */
export function compareCents(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Convierte un porcentaje (ej: 33.33 o 100) a puntos básicos enteros (ej: 3333 o 10000).
 * 100% equivale a 10000 puntos básicos. Admite hasta dos decimales.
 * @param {number|string} percentage 
 * @returns {number}
 */
export function percentageToBasisPoints(percentage) {
  if (percentage === null || percentage === undefined) {
    throw new Error('El porcentaje no puede ser nulo o indefinido.');
  }

  const str = (typeof percentage === 'number' ? percentage.toFixed(2) : String(percentage)).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(str)) {
    throw new Error(`Porcentaje inválido: "${percentage}". Debe ser un número positivo con máximo dos decimales.`);
  }

  const [wholePart, decimalPart = ''] = str.split('.');
  const whole = parseInt(wholePart, 10);
  const hundredths = parseInt(decimalPart.padEnd(2, '0').slice(0, 2), 10);

  return whole * 100 + hundredths;
}
