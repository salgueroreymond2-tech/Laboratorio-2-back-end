/**
 * Clase personalizada para manejo de errores operacionales de la API.
 */
export class AppError extends Error {
  /**
   * @param {string} message - Mensaje descriptivo del error para el cliente
   * @param {number} statusCode - Código de estado HTTP
   */
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message) {
    return new AppError(message, 400);
  }

  static notFound(message) {
    return new AppError(message, 404);
  }

  static conflict(message) {
    return new AppError(message, 409);
  }

  static internal(message = 'Ocurrió un error interno en el servidor') {
    return new AppError(message, 500);
  }
}
