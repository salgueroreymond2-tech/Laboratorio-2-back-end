/**
 * Formatea fechas a formato legible en español (ej: 21 de oct. de 2026 o 21/10/2026).
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'Fecha no disponible';
  try {
    const [year, month, day] = String(dateStr).split('T')[0].split('-');
    if (year && month && day) {
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      return new Intl.DateTimeFormat('es-CR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('es-CR');
  } catch {
    return String(dateStr);
  }
}

/**
 * Formatea porcentajes con dos posiciones decimales.
 * @param {number|string} val 
 * @returns {string}
 */
export function formatPercentage(val) {
  const num = Number(val) || 0;
  return `${num.toFixed(2)}%`;
}

/**
 * Trunca un texto largo con elipsis.
 * @param {string} str 
 * @param {number} max 
 * @returns {string}
 */
export function truncate(str = '', max = 40) {
  if (str.length <= max) return str;
  return `${str.substring(0, max)}...`;
}

/**
 * Obtiene las iniciales de una persona para avatares accesibles.
 * @param {string} name 
 * @returns {string}
 */
export function getInitials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
