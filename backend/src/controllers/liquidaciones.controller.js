import { LiquidacionesService } from '../services/liquidaciones.service.js';

export class LiquidacionesController {
  static async getAll(req, res, next) {
    try {
      const liquidaciones = await LiquidacionesService.getAll(req.query);
      res.status(200).json(liquidaciones);
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const nuevaLiquidacion = await LiquidacionesService.create(req.body);
      res.status(201).json(nuevaLiquidacion);
    } catch (err) {
      next(err);
    }
  }
}
