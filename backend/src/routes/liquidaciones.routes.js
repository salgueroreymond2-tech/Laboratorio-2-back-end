import { Router } from 'express';
import { LiquidacionesController } from '../controllers/liquidaciones.controller.js';

export const liquidacionesRouter = Router();

liquidacionesRouter.get('/', LiquidacionesController.getAll);
liquidacionesRouter.post('/', LiquidacionesController.create);
