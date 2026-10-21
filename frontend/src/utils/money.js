/**
 * Utilidades para manejo seguro de dinero y cálculos en centavos enteros.
 * Previene errores de coma flotante (IEEE 754) en comparaciones financieras.
 */

// Moneda configurable: por defecto Colones Costarricenses (CRC), adaptable a USD u otra
export const DEFAULT_CURRENCY = 'CRC';
export const DEFAULT_LOCALE = 'es-CR';

/**
 * Convierte un monto decimal (número o texto) a centavos enteros.
 * @param {number|string} amount - Monto decimal (ej: 1500.50 o "1500.50")
 * @returns {number} Centavos enteros (ej: 150050)
 */
export function toCents(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return 0;
  }

  const str = (typeof amount === 'number' ? amount.toFixed(2) : String(amount)).trim().replace(',', '.');
  if (!/^-?\d+(\.\d{1,2})?$/.test(str)) {
    throw new Error(`Monto inválido para conversión monetaria: "${amount}". Máximo 2 decimales.`);
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
 * Convierte centavos enteros a una cadena decimal con dos posiciones.
 * @param {number} cents 
 * @returns {string} (ej: "1500.50")
 */
export function fromCents(cents) {
  const intCents = Math.round(Number(cents) || 0);
  const isNegative = intCents < 0;
  const abs = Math.abs(intCents);
  const whole = Math.floor(abs / 100);
  const remainder = abs % 100;
  const formatted = `${whole}.${String(remainder).padStart(2, '0')}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Suma una colección de valores en centavos.
 * @param {number[]} centsArray 
 * @returns {number}
 */
export function sumCents(centsArray = []) {
  return centsArray.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
}

/**
 * Compara dos importes en centavos.
 * @returns {number} -1 si a < b, 0 si a === b, 1 si a > b
 */
export function compareCents(a, b) {
  const cA = Number(a) || 0;
  const cB = Number(b) || 0;
  if (cA < cB) return -1;
  if (cA > cB) return 1;
  return 0;
}

/**
 * Convierte un porcentaje a puntos básicos enteros (100.00% = 10000 pb).
 * @param {number|string} percentage 
 * @returns {number}
 */
export function percentageToBasisPoints(percentage) {
  if (percentage === null || percentage === undefined || percentage === '') {
    return 0;
  }
  const str = (typeof percentage === 'number' ? percentage.toFixed(2) : String(percentage)).trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(str)) {
    throw new Error(`Porcentaje inválido: "${percentage}".`);
  }
  const [wholePart, decimalPart = ''] = str.split('.');
  const whole = parseInt(wholePart, 10);
  const hundredths = parseInt(decimalPart.padEnd(2, '0').slice(0, 2), 10);
  return whole * 100 + hundredths;
}

/**
 * Formatea un monto con símbolo de moneda local.
 * @param {number|string} amount - Monto en decimales o centavos si se indica
 * @param {boolean} isCents - Si es true, el valor ingresado está en centavos
 * @param {string} currency - Código ISO de moneda (ej: 'CRC', 'USD')
 * @returns {string}
 */
export function formatMoney(amount, isCents = false, currency = DEFAULT_CURRENCY) {
  const numericAmount = isCents ? (Number(amount) || 0) / 100 : Number(amount) || 0;
  try {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `₡${numericAmount.toFixed(2)}`;
  }
}
