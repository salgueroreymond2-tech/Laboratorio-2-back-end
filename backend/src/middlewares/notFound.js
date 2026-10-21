/**
 * Middleware para capturar y responder a rutas no encontradas (404).
 */
export function notFound(req, res, next) {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}
