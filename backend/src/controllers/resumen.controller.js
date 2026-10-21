import { ResumenService } from '../services/resumen.service.js';

export class ResumenController {
  static async getResumen(req, res, next) {
    try {
      const metricas = await ResumenService.getResumen();
      res.status(200).json(metricas);
    } catch (err) {
      next(err);
    }
  }
}
