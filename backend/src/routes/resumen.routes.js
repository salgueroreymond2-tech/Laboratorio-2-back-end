import { Router } from 'express';
import { ResumenController } from '../controllers/resumen.controller.js';

export const resumenRouter = Router();

resumenRouter.get('/', ResumenController.getResumen);
