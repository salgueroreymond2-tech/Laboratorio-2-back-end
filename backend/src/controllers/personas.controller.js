import { PersonasService } from '../services/personas.service.js';

export class PersonasController {
  static async getAll(req, res, next) {
    try {
      const personas = await PersonasService.getAll();
      res.status(200).json(personas);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const persona = await PersonasService.getById(req.params.id);
      res.status(200).json(persona);
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const nuevaPersona = await PersonasService.create(req.body);
      res.status(201).json(nuevaPersona);
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const personaActualizada = await PersonasService.update(req.params.id, req.body);
      res.status(200).json(personaActualizada);
    } catch (err) {
      next(err);
    }
  }

  static async partialUpdate(req, res, next) {
    try {
      const personaActualizada = await PersonasService.partialUpdate(req.params.id, req.body);
      res.status(200).json(personaActualizada);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const resultado = await PersonasService.delete(req.params.id);
      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }
}
