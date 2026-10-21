import { AppError } from '../errors/AppError.js';

/**
 * Middleware centralizado para manejo de errores de la aplicación.
 * Garantiza respuestas con formato unificado: { "error": "Mensaje descriptivo" }
 */
export function errorHandler(err, req, res, next) {
  // Manejo de errores operacionales conocidos de la aplicación
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Error de sintaxis en el JSON enviado en el cuerpo
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Formato JSON inválido en el cuerpo de la solicitud.',
    });
  }

  // Manejo de errores específicos de PostgreSQL (códigos de error estándar)
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({
          error: 'Ya existe un registro con los datos suministrados (violación de unicidad).',
        });
      case '23503': // foreign_key_violation
        return res.status(409).json({
          error: 'La operación no puede completarse debido a restricciones de integridad referencial.',
        });
      case '23514': // check_violation
        return res.status(400).json({
          error: 'Los datos suministrados no cumplen con las restricciones de validación de la base de datos.',
        });
      case '22P02': // invalid_text_representation
        return res.status(400).json({
          error: 'Tipo de dato incompatible suministrado para la consulta.',
        });
    }
  }

  // Registro del error en consola del servidor (sin exponer detalles al cliente)
  console.error('[Error No Controlado]:', err);

  return res.status(500).json({
    error: 'Ocurrió un error interno en el servidor.',
  });
}
