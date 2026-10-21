import { AppError } from '../errors/AppError.js';
import { toCents } from './money.js';

/**
 * Valida y convierte un identificador numérico de parámetros URL o cuerpos de solicitud.
 * @param {any} val - Valor a validar
 * @param {string} fieldName - Nombre del campo para el mensaje de error
 * @returns {number} ID como entero positivo
 */
export function parseId(val, fieldName = 'id') {
  if (val === undefined || val === null || val === '') {
    throw AppError.badRequest(`El campo "${fieldName}" es obligatorio.`);
  }

  const num = Number(val);
  if (!Number.isInteger(num) || num <= 0) {
    throw AppError.badRequest(`El campo "${fieldName}" debe ser un número entero positivo.`);
  }

  return num;
}

/**
 * Valida que una cadena de texto no sea vacía y cumpla con la longitud máxima.
 * @param {any} str - Cadena a validar
 * @param {string} fieldName - Nombre del campo
 * @param {number} maxLength - Longitud máxima permitida
 * @returns {string} Cadena limpia (trim)
 */
export function validateRequiredString(str, fieldName, maxLength = 255) {
  if (typeof str !== 'string' || str.trim().length === 0) {
    throw AppError.badRequest(`El campo "${fieldName}" es obligatorio y no puede estar vacío.`);
  }

  const clean = str.trim();
  if (clean.length > maxLength) {
    throw AppError.badRequest(`El campo "${fieldName}" no puede superar los ${maxLength} caracteres.`);
  }

  return clean;
}

/**
 * Valida un formato de correo electrónico.
 * @param {string} email 
 * @returns {string}
 */
export function validateEmail(email) {
  const cleanEmail = validateRequiredString(email, 'email', 150).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw AppError.badRequest('El formato del correo electrónico es inválido.');
  }
  return cleanEmail;
}

/**
 * Valida que un monto sea numérico, tenga como máximo 2 decimales y sea mayor a cero.
 * @param {number|string} amount 
 * @param {string} fieldName 
 * @returns {number} Monto en centavos enteros
 */
export function validatePositiveAmount(amount, fieldName = 'monto') {
  if (amount === undefined || amount === null || amount === '') {
    throw AppError.badRequest(`El campo "${fieldName}" es obligatorio.`);
  }

  let cents;
  try {
    cents = toCents(amount);
  } catch (err) {
    throw AppError.badRequest(err.message);
  }

  if (cents <= 0) {
    throw AppError.badRequest(`El campo "${fieldName}" debe ser un valor mayor a cero.`);
  }

  return cents;
}
