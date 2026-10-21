import { Router } from 'express';
import { GastosController } from '../controllers/gastos.controller.js';

export const gastosRouter = Router();

gastosRouter.get('/', GastosController.getAll);
gastosRouter.get('/:id', GastosController.getById);
gastosRouter.post('/', GastosController.create);
gastosRouter.put('/:id', GastosController.update);
gastosRouter.patch('/:id', GastosController.partialUpdate);
gastosRouter.delete('/:id', GastosController.delete);
