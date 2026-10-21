import { Router } from 'express';
import { GruposController } from '../controllers/grupos.controller.js';

export const gruposRouter = Router();

gruposRouter.get('/', GruposController.getAll);
gruposRouter.get('/:id', GruposController.getById);
gruposRouter.post('/', GruposController.create);
gruposRouter.post('/:id/personas', GruposController.addPersona);
gruposRouter.delete('/:grupoId/personas/:personaId', GruposController.removePersona);
gruposRouter.get('/:id/balances', GruposController.getBalances);
gruposRouter.get('/:id/liquidaciones-sugeridas', GruposController.getLiquidacionesSugeridas);
