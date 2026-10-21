import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

// Middlewares globales de seguridad y análisis de cuerpo
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Ruta raíz informativa sobre el estado de la API
app.get('/', (req, res) => {
  res.status(200).json({
    mensaje: 'API REST - Control de Gastos Compartidos con Liquidaciones',
    version: '1.0.0',
    estado: 'Servidor operativo',
    endpoints_base: '/api',
    documentacion: 'Consulte README.md y la colección de Postman en postman/'
  });
});

// Enrutador principal de la API REST
app.use('/api', apiRouter);

// Middleware para manejo de rutas inexistentes (404)
app.use(notFound);

// Middleware centralizado de gestión de errores (400, 404, 409, 500)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`  Servidor Express en ejecución`);
    console.log(`  Puerto: ${PORT}`);
    console.log(`  URL Base: http://localhost:${PORT}/api`);
    console.log(`=================================================`);
  });
}

export default app;
export { app };
