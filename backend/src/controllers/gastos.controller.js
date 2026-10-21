import { GastosService } from '../services/gastos.service.js';

export class GastosController {
  static async getAll(req, res, next) {
    try {
      const gastos = await GastosService.getAll(req.query);
      res.status(200).json(gastos);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const gasto = await GastosService.getById(req.params.id);
      res.status(200).json(gasto);
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const nuevoGasto = await GastosService.create(req.body);
      res.status(201).json(nuevoGasto);
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const gastoActualizado = await GastosService.update(req.params.id, req.body);
      res.status(200).json(gastoActualizado);
    } catch (err) {
      next(err);
    }
  }

  static async partialUpdate(req, res, next) {
    try {
      const gastoActualizado = await GastosService.partialUpdate(req.params.id, req.body);
      res.status(200).json(gastoActualizado);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const resultado = await GastosService.delete(req.params.id);
      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }
}
