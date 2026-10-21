import { Router } from 'express';
import { PersonasController } from '../controllers/personas.controller.js';

export const personasRouter = Router();

personasRouter.get('/', PersonasController.getAll);
personasRouter.get('/:id', PersonasController.getById);
personasRouter.post('/', PersonasController.create);
personasRouter.put('/:id', PersonasController.update);
personasRouter.patch('/:id', PersonasController.partialUpdate);
personasRouter.delete('/:id', PersonasController.delete);
