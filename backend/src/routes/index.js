import { Router } from 'express';
import { personasRouter } from './personas.routes.js';
import { gruposRouter } from './grupos.routes.js';
import { gastosRouter } from './gastos.routes.js';
import { liquidacionesRouter } from './liquidaciones.routes.js';
import { resumenRouter } from './resumen.routes.js';

export const apiRouter = Router();

apiRouter.use('/personas', personasRouter);
apiRouter.use('/grupos', gruposRouter);
apiRouter.use('/gastos', gastosRouter);
apiRouter.use('/liquidaciones', liquidacionesRouter);
apiRouter.use('/resumen', resumenRouter);
