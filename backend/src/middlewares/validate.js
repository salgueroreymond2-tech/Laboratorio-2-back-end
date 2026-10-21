import { AppError } from '../errors/AppError.js';

/**
 * Middleware fábrica para validar que los campos requeridos estén presentes en req.body.
 * @param {string[]} requiredFields - Lista de nombres de campos obligatorios
 */
export function validateBody(requiredFields = []) {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next(AppError.badRequest('El cuerpo de la petición (body) debe ser un objeto JSON válido.'));
    }

    const missingFields = [];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return next(
        AppError.badRequest(`Campos obligatorios faltantes o vacíos: ${missingFields.join(', ')}.`)
      );
    }

    next();
  };
}

export default validateBody;
