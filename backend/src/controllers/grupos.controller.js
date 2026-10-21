import { GruposService } from '../services/grupos.service.js';

export class GruposController {
  static async getAll(req, res, next) {
    try {
      const grupos = await GruposService.getAll();
      res.status(200).json(grupos);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const grupo = await GruposService.getById(req.params.id);
      res.status(200).json(grupo);
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const nuevoGrupo = await GruposService.create(req.body);
      res.status(201).json(nuevoGrupo);
    } catch (err) {
      next(err);
    }
  }

  static async addPersona(req, res, next) {
    try {
      const { persona_id } = req.body;
      const resultado = await GruposService.addPersona(req.params.id, persona_id);
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  }

  static async removePersona(req, res, next) {
    try {
      const { grupoId, personaId } = req.params;
      const resultado = await GruposService.removePersona(grupoId, personaId);
      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }

  static async getBalances(req, res, next) {
    try {
      const balances = await GruposService.getBalances(req.params.id);
      res.status(200).json(balances);
    } catch (err) {
      next(err);
    }
  }

  static async getLiquidacionesSugeridas(req, res, next) {
    try {
      const sugerencias = await GruposService.getLiquidacionesSugeridas(req.params.id);
      res.status(200).json(sugerencias);
    } catch (err) {
      next(err);
    }
  }
}
