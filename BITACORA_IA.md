# Bitácora de Interacción con IA - Laboratorio 2, Día 1, Caso 3
**Proyecto:** Control de Gastos Compartidos con Liquidaciones  
**Estudiante:** [Nombre del Estudiante]  
**Fecha:** 21 de Octubre de 2026  
**Materia:** Desarrollo Backend Avanzado  

---

## 1. Objetivo Solicitado a la IA

Diseñar y construir la arquitectura completa y funcional del backend para el **Caso 3: Control de gastos compartidos con liquidaciones**, cumpliendo con los siguientes requerimientos:
- API REST con Node.js, Express y PostgreSQL (sin ORM, usando `pg.Pool` con sentencias parametrizadas).
- Arquitectura en capas estricta (`routes/`, `controllers/`, `services/`, `middlewares/`, `errors/`, `utils/`).
- Tres tipos de reparto de gastos: `IGUALES` (con compensación de residuos de centavos), `PORCENTAJE` (mayores residuos con puntos básicos) y `EXACTO` (cuadre al centavo).
- Transacciones ACID seguras para inserción y actualización de gastos y sus participaciones.
- Fórmula de cálculo de balance:
  $$\text{balance} = \text{pagado} - \text{consumido} + \text{liquidaciones\_pagadas} - \text{liquidaciones\_recibidas}$$
- Algoritmo voraz de liquidación sugerida para minimizar la cantidad de transferencias entre deudores y acreedores.
- Bloqueo transaccional de eliminación de integrantes de un grupo con saldo distinto de cero.
- Endpoint de métricas agregadas (`/api/resumen`) calculado íntegramente mediante SQL con CTEs y `GROUP BY`.
- Colección y variables de entorno de Postman para pruebas exhaustivas.
- Formato unificado de error: `{ "error": "Mensaje descriptivo" }`.

---

## 2. Prompt Utilizado

```text
Actúa como un Arquitecto de Software y Desarrollador Backend Senior especializado en Node.js, Express y PostgreSQL.
Debes construir directamente en el workspace de Antigravity el backend completo y funcional del “Laboratorio 2, Día 1, Caso 3: Control de gastos compartidos con liquidaciones”.
No te limites a explicar ni a mostrar fragmentos. Crea todos los archivos con código completo, coherente entre sí, ejecutable y listo para probar.
No generes frontend, React ni flujos de n8n. El alcance de esta tarea es únicamente el backend del Día 1.
Stack: Node.js, Express, PostgreSQL, pg (Pool), cors, dotenv, ES modules ("type": "module"), nodemon. Sin ORM.
Arquitectura por capas: routes/, controllers/, services/, middlewares/, errors/, utils/.
Cálculo de balances: balance = pagado - consumido + liquidaciones_pagadas - liquidaciones_recibidas.
Algoritmo de liquidaciones sugeridas (greedy deudor/acreedor).
Bloqueo de eliminación de integrante si balance !== 0 con transacción y FOR UPDATE.
Endpoint de resumen con métricas agregadas SQL.
Colección y Environment de Postman con pruebas automatizadas.
```

---

## 3. Resumen de la Respuesta Recibida

La IA proporcionó:
1. **Esquema de base de datos relacional (`schema.sql`)**: Tablas `personas`, `grupos`, `grupo_personas`, `gastos`, `participaciones` y `liquidaciones`, con llaves foráneas, índices de rendimiento y datos semilla completos.
2. **Utilidades financieras (`src/utils/money.js`)**: Manejo de dinero en centavos enteros para eliminar imprecisiones de coma flotante de JavaScript (IEEE 754), algoritmo de mayores residuos (Hamilton-Hare) y conversión a puntos básicos.
3. **Servicios de negocio con transacciones ACID**:
   - `GastosService`: Manejo de transacciones con `pool.connect()`, `BEGIN`, inserción/actualización de gasto y participaciones, `COMMIT`, `ROLLBACK` y liberación garantizada en `finally`.
   - `GruposService`: Balances calculados mediante CTEs en SQL para evitar productos cartesianos, algoritmo greedy de liquidaciones sugeridas y retiro seguro de integrantes condicionado a balance cero con bloqueo de fila.
   - `LiquidacionesService`: Registro y consulta de pagos entre integrantes con validación estricta de pertenencia al grupo.
   - `ResumenService`: Estadísticas globales y por grupo calculadas íntegramente en PostgreSQL.
4. **Capa de Controladores y Rutas REST**: Separación estricta sin acoplamiento a base de datos.
5. **Manejo de Errores y Rutas No Encontradas**: Middleware centralizado con respuesta unificada `{ "error": "..." }`.
6. **Colección y Environment de Postman**: 24 peticiones cubriendo casos exitosos y códigos de error (400, 404, 409).
7. **Documentación (`README.md`)**: Guía detallada con ejemplos, fórmulas y comandos para PowerShell y Bash.

---

## 4. Código Revisado por el Estudiante

Se revisaron minuciosamente los siguientes archivos clave:
- `src/utils/money.js`: Verificación de `toCents()`, `fromCents()`, `percentageToBasisPoints()` y redondeo determinista.
- `src/services/gastos.service.js`: Revisión de la lógica de distribución de centavos sobrantes en repartos `IGUALES` y `PORCENTAJE`, así como el manejo de transacciones.
- `src/services/grupos.service.js`: Revisión de la consulta CTE de balances para comprobar que no existan duplicaciones por `JOIN` múltiple y verificación del algoritmo voraz.
- `src/middlewares/errorHandler.js`: Comprobación de que no se filtren detalles internos ni sentencias SQL al cliente.
- `src/app.js`: Configuración de Express, CORS y parseo de JSON con límite de tamaño.

---

## 5. Correcciones y Ajustes Realizados

Durante la revisión del código se identificaron y aplicaron las siguientes mejoras técnicas:
1. **Verificación de existencia previa con código 404 antes de reglas de negocio 409**:
   - En `LiquidacionesService.create` y `GastosService.update`, se separó la verificación de existencia física de las personas/grupos en la base de datos (`404 Not Found`) de la validación de pertenencia al grupo (`409 Conflict`).
2. **Respuesta completa en creación y actualización de gastos**:
   - Se ajustó `GastosService.create` y `update` para que, tras el `COMMIT`, retornen el gasto completamente hidratado mediante `getById(id)`, incluyendo los nombres de todos los participantes y el formato decimal adecuado.
3. **Límite de tamaño en `express.json()`**:
   - Se definió `express.json({ limit: '10kb' })` para proteger el servidor contra ataques de denegación de servicio por cuerpos de solicitud desmedidos.
4. **Validación estricta de balance cero en el retiro de integrantes**:
   - Se confirmó que `GruposService.removePersona` bloquea la fila del grupo con `FOR UPDATE`, recalcula el balance en centavos dentro de la misma transacción y rechaza la eliminación con `409 Conflict` si el balance difiere de cero.
5. **Compatibilidad Nativa con Supabase y SSL Automático**:
   - Se actualizó `src/db.js` para detectar cadenas de conexión de Supabase (`supabase.co` o `pooler.supabase.com`) y activar automáticamente `ssl: { rejectUnauthorized: false }`, permitiendo trabajar con la nube sin errores de certificados.

---

## 6. Estado de Pruebas y Verificaciones

### Pruebas Realizadas en el Entorno Actual (Antigravity):
- [x] **Instalación de Dependencias (`npm install`)**: Ejecutada con éxito. Se instalaron `express`, `pg`, `cors`, `dotenv` y `nodemon` sin errores de resolución.
- [x] **Comprobación de Sintaxis JavaScript**: Verificada mediante Node.js en todos los archivos de `src/`. No se detectaron errores de sintaxis ni importaciones faltantes.
- [x] **Validación de Archivos JSON**: `package.json`, `GastosCompartidos.postman_collection.json` y `GastosCompartidos.postman_environment.json` son archivos JSON sintácticamente válidos.
- [x] **Auditoría de Inyecciones SQL**: Todas las consultas utilizan parámetros `$1`, `$2`, etc. Ninguna consulta usa concatenación de cadenas.
- [x] **Auditoría de Credenciales**: No existen contraseñas reales ni cadenas de conexión hardcodeadas en el código fuente; todo se maneja mediante variables de entorno y `.env.example`.
- [x] **Conexión en Vivo a Base de Datos Supabase**: Conectado exitosamente mediante el Connection Pooler IPv4 (`aws-0-us-east-1.pooler.supabase.com:6543`).
- [x] **Prueba de Consulta de Métricas (`ResumenService.getResumen`)**: Ejecutada con éxito contra Supabase. Retornó 5 personas, 2 grupos, 4 gastos y 1 liquidación con montos y promedios exactos.
- [x] **Prueba de Balances (`GruposService.getBalances`)**: Balances del Grupo 1 calculados en centavos enteros con cuadre exacto (suma = 0.00).
- [x] **Prueba del Algoritmo Voraz (`GruposService.getLiquidacionesSugeridas`)**: Generó 3 transferencias óptimas para saldar a Elena (-65.00) y Roberto (-8.33) con Carlos (+51.66) y Ana (+21.67).

### Pruebas Pendientes de Ejecución por el Estudiante:
- [ ] **Iniciar el Servidor Express**: Ejecutar `npm run dev` desde la carpeta `backend/`.
- [ ] **Ejecución de la Colección de Postman**: Importar la colección y el environment en Postman y ejecutar todas las pruebas automatizadas.

---

## 7. Aprendizajes y Explicación Personal para la Defensa

1. **¿Por qué calcular el dinero en centavos enteros?**  
   JavaScript almacena números como IEEE 754 de 64 bits de coma flotante. Operaciones como `0.1 + 0.2` dan `0.30000000000000004`, lo que en sistemas bancarios y de gastos genera errores acumulativos de cuadre. Al multiplicar por 100 y operar en enteros (`toCents`), cada centavo es un número discreto exacto.

2. **¿Por qué usar CTEs independientes en el cálculo de balances?**  
   Si se realiza un `JOIN` directo entre `personas`, `gastos`, `participaciones` y `liquidaciones`, se genera un producto cartesiano donde cada fila de gasto se multiplica por el número de liquidaciones, duplicando o triplicando los totales agregados. Al usar `WITH` (CTE), cada concepto se totaliza primero por `persona_id` y luego se une de manera unívoca.

3. **¿Cómo funciona el Algoritmo Voraz (Greedy) de Liquidación?**  
   Empareja sistemáticamente al mayor deudor con el mayor acreedor. Transfiere el monto mínimo entre la deuda y el crédito restante, saldando a al menos uno de los dos en cada paso. Esto garantiza que las deudas se liquiden en el menor número posible de transferencias (máximo $N - 1$ transferencias para $N$ personas).

4. **¿Por qué usar transacciones y bloqueos al eliminar un integrante?**  
   Si una persona consulta su balance y es cero, pero concurrentemente alguien registra un gasto a su nombre antes de que se confirme la eliminación, podría retirarse dejando una deuda invisible. El bloqueo `FOR UPDATE` y la transacción `SERIALIZABLE`/`READ COMMITTED` evitan esta condición de carrera.
