# Control de Gastos Compartidos con Liquidaciones - Backend API REST
**Laboratorio 2, Día 1, Caso 3**

API REST completa desarrollada con **Node.js**, **Express** y **PostgreSQL** (mediante el driver `pg` con `Pool`), orientada a la administración de personas, grupos, gastos compartidos (con repartos equitativos, porcentuales y exactos), cálculo de balances financieros y sugerencia voraz de transferencias de liquidación para saldar deudas de forma óptima.

---

## 1. Objetivo del Proyecto

Proporcionar una solución backend robusta, segura y escalable que permita:
- Administrar grupos de amigos, convivientes o equipos con gastos comunes.
- Registrar gastos soportando tres modalidades de reparto: **IGUALES** (con compensación determinista de residuos de centavos), **PORCENTAJE** (mediante el algoritmo de mayores residuos Hamilton-Hare con puntos básicos) y **EXACTO** (con validación estricta de cuadre en centavos).
- Mantener la integridad financiera global y por usuario mediante transacciones ACID (`BEGIN`, `COMMIT`, `ROLLBACK`).
- Calcular balances individuales evitando errores de multiplicación en uniones SQL.
- Sugerir transferencias óptimas para liquidar saldos pendientes minimizando el número de transacciones.
- Impedir la salida de un integrante de un grupo si mantiene cualquier saldo pendiente distinto de cero.
- Obtener métricas estadísticas globales y grupales agregadas directamente en el motor PostgreSQL.

---

## 2. Arquitectura del Sistema

El proyecto sigue una arquitectura por capas estricta para garantizar modularidad, mantenibilidad y separación de responsabilidades:

```
backend/
├── .env.example                               # Plantilla de variables de entorno
├── .gitignore                                  # Ignora node_modules, .env y logs
├── package.json                                # Configuración de dependencias y scripts ("type": "module")
├── schema.sql                                  # DDL de PostgreSQL, restricciones, índices y datos semilla
├── README.md                                   # Documentación técnica completa del sistema
├── BITACORA_IA.md                              # Bitácora detallada de ingeniería con IA
├── postman/
│   ├── GastosCompartidos.postman_collection.json   # Colección con pruebas y tests automatizados
│   └── GastosCompartidos.postman_environment.json  # Entorno con variables configuradas
└── src/
    ├── app.js                                  # Configuración de Express, CORS, JSON parser y rutas
    ├── db.js                                   # Conexión y Pool de PostgreSQL
    ├── routes/                                 # Definición de rutas y endpoints
    │   ├── index.js                            # Agrupador central de rutas (/api)
    │   ├── personas.routes.js                  # Rutas para personas
    │   ├── grupos.routes.js                    # Rutas para grupos, balances y liquidaciones sugeridas
    │   ├── gastos.routes.js                    # Rutas para gastos compartidos
    │   ├── liquidaciones.routes.js             # Rutas para liquidaciones reales
    │   └── resumen.routes.js                   # Rutas para métricas globales
    ├── controllers/                            # Capa de presentación HTTP (request / response)
    │   ├── personas.controller.js
    │   ├── grupos.controller.js
    │   ├── gastos.controller.js
    │   ├── liquidaciones.controller.js
    │   └── resumen.controller.js
    ├── services/                               # Capa de lógica de negocio, SQL y transacciones
    │   ├── personas.service.js
    │   ├── grupos.service.js
    │   ├── gastos.service.js
    │   ├── liquidaciones.service.js
    │   └── resumen.service.js
    ├── middlewares/                            # Middlewares Express
    │   ├── errorHandler.js                     # Manejador centralizado de errores (AppError, PG, 500)
    │   └── notFound.js                         # Captura de rutas inexistentes (404)
    ├── errors/
    │   └── AppError.js                         # Clase para errores operacionales (400, 404, 409, 500)
    └── utils/
        ├── money.js                            # Conversiones y sumas exactas en centavos enteros
        └── validations.js                      # Validadores de strings, correos, montos e IDs
```

### Reglas de Capas
1. **Controladores**: No contienen consultas SQL ni reglas de negocio. Reciben parámetros, invocan servicios y responden al cliente HTTP.
2. **Rutas**: Únicamente asocian verbos HTTP y URLs con métodos de los controladores.
3. **Servicios**: Contienen la lógica de negocio, validaciones de dominio, transacciones y consultas SQL parametrizadas ($1, $2, etc.).
4. **Manejo de Errores**: Todo error imprevisto o de negocio pasa al middleware centralizado `errorHandler`, asegurando el formato estándar `{ "error": "Mensaje descriptivo" }`.

---

## 3. Modelo de Datos (PostgreSQL)

El esquema relacional incluye integridad referencial, índices y restricciones `CHECK` y `UNIQUE`:

### 3.1. Tablas y Restricciones
- **`personas`**: `id` (PK SERIAL), `nombre` (NOT NULL), `email` (NOT NULL UNIQUE).
- **`grupos`**: `id` (PK SERIAL), `nombre` (NOT NULL).
- **`grupo_personas`**: `grupo_id` (FK grupos ON DELETE CASCADE), `persona_id` (FK personas ON DELETE RESTRICT). Llave primaria compuesta `(grupo_id, persona_id)`.
- **`gastos`**: `id` (PK SERIAL), `grupo_id` (FK grupos ON DELETE CASCADE), `descripcion` (NOT NULL), `monto` (`NUMERIC(12,2) CHECK (monto > 0)`), `pagado_por` (FK personas ON DELETE RESTRICT), `fecha` (DATE DEFAULT CURRENT_DATE), `tipo_reparto` (`CHECK (tipo_reparto IN ('IGUALES', 'PORCENTAJE', 'EXACTO'))`), `categoria`.
- **`participaciones`**: `id` (PK SERIAL), `gasto_id` (FK gastos ON DELETE CASCADE), `persona_id` (FK personas ON DELETE RESTRICT), `monto_asignado` (`NUMERIC(12,2) CHECK (monto_asignado >= 0)`), restricción única `uq_gasto_persona (gasto_id, persona_id)`.
- **`liquidaciones`**: `id` (PK SERIAL), `grupo_id` (FK grupos ON DELETE CASCADE), `de_persona` (FK personas ON DELETE RESTRICT), `a_persona` (FK personas ON DELETE RESTRICT), `monto` (`NUMERIC(12,2) CHECK (monto > 0)`), `fecha` (DATE DEFAULT CURRENT_DATE), restricción `CHECK (de_persona <> a_persona)`.

### 3.2. Índices de Rendimiento
Se definieron índices en todas las llaves foráneas y campos clave de búsqueda:
- `idx_grupo_personas_persona`, `idx_gastos_grupo`, `idx_gastos_pagado_por`, `idx_gastos_fecha`, `idx_participaciones_gasto`, `idx_participaciones_persona`, `idx_liquidaciones_grupo`, `idx_liquidaciones_de_persona`, `idx_liquidaciones_a_persona`.

---

## 4. Manejo del Dinero y Precisión Financiera

JavaScript utiliza números de punto flotante de doble precisión según el estándar IEEE 754, lo que provoca anomalías aritméticas (por ejemplo `0.1 + 0.2 = 0.30000000000000004`).

Para evitar discrepancias contables:
1. El módulo `src/utils/money.js` convierte cualquier valor decimal a **centavos enteros** (`toCents`).
2. Toda suma, resta, comparación y validación de cuadre se realiza estrictamente en centavos (`sumCents`, `compareCents`).
3. Para persistir o responder se formatean los centavos a cadenas con dos cifras decimales (`fromCents`).
4. Los tipos `NUMERIC` devueltos por `pg` se manejan como cadenas y se parsean en centavos sin perder precisión.

---

## 5. Tipos de Reparto

El servicio `GastosService` implementa los tres tipos de reparto requeridos:

### 5.1. Reparto IGUALES
- **Entrada**: Monto total y lista de IDs de participantes (ej: `[1, 2, 3]`).
- **Lógica**: Se divide el total en centavos entre la cantidad de participantes (`baseCents = Math.floor(totalCents / n)`).
- **Tratamiento del Sobrante**: Si `totalCents % n !== 0`, los centavos sobrantes se asignan de forma determinista (+1 centavo) a los primeros integrantes ordenados ascendentemente por su `persona_id`.
- **Garantía**: La suma de participaciones coincide exactamente con el monto del gasto al último centavo.

### 5.2. Reparto por PORCENTAJE
- **Entrada**: Lista de objetos `{ persona_id, porcentaje }`.
- **Validaciones**: Porcentajes mayores o iguales a cero, con un máximo de 2 posiciones decimales.
- **Puntos Básicos**: Se multiplican los porcentajes por 100 para trabajar en puntos básicos enteros (100.00% = 10,000 pb). La suma debe ser exactamente 10,000 pb (100%), de lo contrario se rechaza con `409 Conflict`.
- **Método de Mayores Residuos (Hamilton-Hare)**:
  1. Se calcula la cuota base entera en centavos: `Math.floor(totalCents * pb / 10000)`.
  2. Se extrae el residuo exacto `(totalCents * pb) % 10000`.
  3. Los centavos faltantes se entregan uno a uno a los participantes con los mayores residuos. Si hay empate, se desempata por `persona_id` ascendente.

### 5.3. Reparto EXACTO
- **Entrada**: Lista de objetos `{ persona_id, monto_asignado }`.
- **Validaciones**: Se convierten todos los montos a centavos enteros.
- **Cuadre Estricto**: Si la suma de las participaciones no es idéntica al monto del gasto en centavos, la operación se cancela y devuelve `409 Conflict`.

---

## 6. Fórmula y Cálculo de Balances

### 6.1. Convención de Signos
- **Balance > 0 (Acreedor)**: La persona pagó más de lo que consumió; **debe recibir dinero**.
- **Balance < 0 (Deudor)**: La persona consumió más de lo que pagó; **debe entregar dinero**.
- **Balance = 0 (Saldado)**: La persona se encuentra al día.

### 6.2. Fórmula Oficial
Dado que en las liquidaciones `de_persona` envía dinero y `a_persona` lo recibe:

$$\text{balance} = \text{pagado} - \text{consumido} + \text{liquidaciones\_pagadas} - \text{liquidaciones\_recibidas}$$

Donde:
- `pagado`: Suma de gastos donde la persona fue el pagador.
- `consumido`: Suma de las participaciones asignadas a la persona.
- `liquidaciones_pagadas`: Transferencias enviadas (`de_persona`).
- `liquidaciones_recibidas`: Transferencias recibidas (`a_persona`).

### 6.3. Cálculo Seguro en PostgreSQL
Para impedir productos cartesianos y multiplicación indebida de importes al realizar `JOIN` entre gastos, participaciones y liquidaciones, la consulta SQL utiliza **Expresiones de Tabla Comunes (CTEs)** independientes que agrupan los montos por `persona_id` antes de combinarse con la lista de integrantes del grupo.

---

## 7. Algoritmo de Liquidación Sugerida

El endpoint `GET /api/grupos/:id/liquidaciones-sugeridas` implementa un algoritmo voraz (**Greedy**) para proponer el mínimo número de transferencias entre integrantes:

1. **Obtención y Cuadre**: Obtiene los balances de cada integrante en centavos. Verifica que la suma total sea exactamente `0`. Si no lo es, devuelve `409 Conflict` por inconsistencia contable.
2. **Filtrado**: Descarta a las personas saldadas (`balance === 0`).
3. **Clasificación**: Separa a los acreedores (`balance > 0`) y a los deudores (`balance < 0`), trabajando las deudas en valor absoluto.
4. **Ordenamiento**: Ordena a ambos grupos de mayor a menor saldo pendiente.
5. **Emparejamiento Voraz**:
   - Se toma al mayor deudor y al mayor acreedor.
   - El monto de transferencia propuesto es $\min(\text{saldo\_deudor}, \text{saldo\_acreedor})$.
   - Se descuenta el monto de ambos saldos.
   - Si un integrante llega a 0, se avanza al siguiente de la lista.
   - Se repite hasta que todos los saldos queden liquidados.
6. **No Persistencia**: El endpoint es de solo consulta; no inserta registros en la base de datos hasta que el usuario invoque explícitamente `POST /api/liquidaciones`.

---

## 8. Bloqueo de Eliminación de Integrantes

El endpoint `DELETE /api/grupos/:grupoId/personas/:personaId` asegura que un participante no pueda ser retirado de un grupo si tiene deudas o créditos pendientes:

1. Abre una transacción mediante `pool.connect()` y `BEGIN`.
2. Ejecuta un bloqueo con `FOR UPDATE` sobre el grupo y el integrante para prevenir carreras concurrentes de inserción de gastos o liquidaciones.
3. Calcula el balance neto del integrante dentro de la transacción.
4. Si el balance en centavos es diferente de cero, ejecuta `ROLLBACK` y responde con `409 Conflict`, detallando el saldo pendiente.
5. Si el balance es exactamente `0.00`, elimina el registro de `grupo_personas` y ejecuta `COMMIT`.

---

## 9. Variables de Entorno

Crea un archivo `.env` en la raíz de `backend/` a partir de `.env.example`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/gastos_compartidos
PORT=3000
```

También es posible especificar variables desglosadas si no se utiliza `DATABASE_URL`:
- `PGHOST=localhost`
- `PGPORT=5432`
- `PGUSER=postgres`
- `PGPASSWORD=password`
- `PGDATABASE=gastos_compartidos`

---

## 10. Guía de Instalación y Ejecución

### 10.1. Requisitos Previos
- **Node.js** v18 o superior (probado en Node v22).
- **PostgreSQL** v14 o superior instalado y en ejecución.

---

### 10.2. Opción con Supabase (En la Nube, sin instalar nada local)

Si utilizas **Supabase**, no necesitas instalar PostgreSQL ni `psql` en tu máquina:

1. **Crear Proyecto en Supabase**:
   - Inicia sesión en [supabase.com](https://supabase.com) y crea un nuevo proyecto.
   - Guarda la contraseña maestra que elijas para la base de datos (`[TU-PASSWORD]`).

2. **Ejecutar `schema.sql` en el SQL Editor**:
   - En el panel de Supabase, ve a la sección **SQL Editor** (ícono de terminal en el menú lateral).
   - Abre el archivo [schema.sql](file:///c:/Users/HP8D8/OneDrive/Desktop/Ray/Laboratorio%202%20BackEnd/backend/schema.sql) de tu proyecto, copia todo su contenido y pégalo en el editor de Supabase.
   - Haz clic en **Run** (botón verde). Esto creará todas las tablas, restricciones, índices y datos semilla de prueba.

3. **Obtener la URI de Conexión**:
   - En Supabase, ve a **Project Settings** (ícono de engranaje) -> **Database**.
   - En la sección **Connection string**, selecciona la pestaña **URI** (modo *Session* o *Transaction* puerto 6543 o 5432).
   - Copia la URL generada. Se verá similar a:
     `postgresql://postgres.[TU-PROYECTO]:[TU-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

4. **Configurar el archivo `.env` en el backend**:
   - En la carpeta `backend/`, crea tu archivo `.env`:
     ```env
     DATABASE_URL=postgresql://postgres.[TU-PROYECTO]:[TU-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     PORT=3000
     ```
   *(El backend detecta automáticamente los dominios de Supabase y activa SSL con `rejectUnauthorized: false`).*

5. **Iniciar el Servidor**:
   ```powershell
   npm run dev
   ```

---

### 10.3. Opción con PostgreSQL Local en Windows (PowerShell)

1. **Navegar a la carpeta del backend e instalar dependencias:**
   ```powershell
   cd backend
   npm install
   ```

2. **Crear el archivo de configuración `.env`:**
   ```powershell
   Copy-Item .env.example .env
   ```
   *Edita `.env` con las credenciales de tu servidor PostgreSQL.*

3. **Crear la base de datos y cargar el esquema con datos semilla:**
   ```powershell
   # Crear base de datos (si no existe)
   createdb -U postgres gastos_compartidos

   # Ejecutar el script schema.sql
   psql -U postgres -d gastos_compartidos -f schema.sql
   ```

4. **Iniciar el servidor en modo desarrollo:**
   ```powershell
   npm run dev
   ```
   *O en modo producción:*
   ```powershell
   npm start
   ```

---

### 10.4. Opción con PostgreSQL Local en Linux / macOS (Bash)

1. **Instalar dependencias:**
   ```bash
   cd backend
   npm install
   ```

2. **Configurar el entorno:**
   ```bash
   cp .env.example .env
   # Modificar .env con tu editor favorito
   nano .env
   ```

3. **Crear la base de datos y ejecutar el esquema:**
   ```bash
   createdb -U postgres gastos_compartidos
   psql -U postgres -d gastos_compartidos -f schema.sql
   ```

4. **Iniciar el servidor:**
   ```bash
   npm run dev
   ```

---

## 11. Lista de Endpoints

### 11.1. Personas
| Verbo | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/personas` | Lista todas las personas registradas |
| `GET` | `/api/personas/:id` | Obtiene el detalle de una persona |
| `POST` | `/api/personas` | Registra una nueva persona |
| `PUT` | `/api/personas/:id` | Actualización total de una persona |
| `PATCH` | `/api/personas/:id` | Actualización parcial de una persona |
| `DELETE` | `/api/personas/:id` | Elimina una persona si no tiene historial |

### 11.2. Grupos
| Verbo | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/grupos` | Lista todos los grupos con su conteo de integrantes |
| `GET` | `/api/grupos/:id` | Detalle del grupo y lista de sus integrantes |
| `POST` | `/api/grupos` | Crea un nuevo grupo |
| `POST` | `/api/grupos/:id/personas` | Agrega un integrante a un grupo |
| `DELETE` | `/api/grupos/:grupoId/personas/:personaId` | Retira un integrante (solo si balance es exactamente 0) |
| `GET` | `/api/grupos/:id/balances` | Lista los balances netos de cada integrante |
| `GET` | `/api/grupos/:id/liquidaciones-sugeridas` | Sugiere transferencias voraces para saldar deudas |

### 11.3. Gastos
| Verbo | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/gastos` | Lista gastos (filtro opcional `?grupo_id=1`) |
| `GET` | `/api/gastos/:id` | Detalle del gasto con participaciones y nombres anidados |
| `POST` | `/api/gastos` | Registra un gasto (reparto `IGUALES`, `PORCENTAJE` o `EXACTO`) |
| `PUT` | `/api/gastos/:id` | Reemplaza un gasto y recalcula participaciones |
| `PATCH` | `/api/gastos/:id` | Modifica campos de un gasto |
| `DELETE` | `/api/gastos/:id` | Elimina un gasto y sus participaciones en cascada |

### 11.4. Liquidaciones
| Verbo | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/liquidaciones` | Lista liquidaciones (filtro opcional `?grupo_id=1`) |
| `POST` | `/api/liquidaciones` | Registra una transferencia de pago entre integrantes |

### 11.5. Resumen
| Verbo | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/resumen` | Métricas agregadas globales y por grupo calculadas vía SQL |

---

## 12. Ejemplos de Solicitudes JSON

### Crear Persona (`POST /api/personas`)
```json
{
  "nombre": "Laura Morales",
  "email": "laura.morales@example.com"
}
```

### Crear Gasto con Reparto IGUALES (`POST /api/gastos`)
```json
{
  "grupo_id": 1,
  "descripcion": "Cena de Bienvenida",
  "monto": 100.01,
  "pagado_por": 1,
  "tipo_reparto": "IGUALES",
  "categoria": "Comida",
  "participantes": [1, 2, 3]
}
```

### Crear Gasto con Reparto por PORCENTAJE (`POST /api/gastos`)
```json
{
  "grupo_id": 1,
  "descripcion": "Transporte y Peajes",
  "monto": 50.00,
  "pagado_por": 2,
  "tipo_reparto": "PORCENTAJE",
  "categoria": "Transporte",
  "participantes": [
    { "persona_id": 1, "porcentaje": 40.00 },
    { "persona_id": 2, "porcentaje": 30.00 },
    { "persona_id": 3, "porcentaje": 30.00 }
  ]
}
```

### Crear Gasto con Reparto EXACTO (`POST /api/gastos`)
```json
{
  "grupo_id": 1,
  "descripcion": "Supermercado",
  "monto": 75.50,
  "pagado_por": 1,
  "tipo_reparto": "EXACTO",
  "categoria": "Supermercado",
  "participantes": [
    { "persona_id": 1, "monto_asignado": 25.50 },
    { "persona_id": 2, "monto_asignado": 30.00 },
    { "persona_id": 3, "monto_asignado": 20.00 }
  ]
}
```

### Registrar una Liquidación (`POST /api/liquidaciones`)
```json
{
  "grupo_id": 1,
  "de_persona": 3,
  "a_persona": 1,
  "monto": 35.00
}
```

---

## 13. Manejo de Errores y Códigos HTTP

La API respeta los códigos HTTP estándar:
- **`200 OK`**: Petición atendida exitosamente.
- **`201 Created`**: Recurso creado exitosamente.
- **`400 Bad Request`**: Parámetros ausentes, identificadores no numéricos, montos negativos o datos malformados.
- **`404 Not Found`**: El recurso solicitado (persona, grupo o gasto) no existe.
- **`409 Conflict`**: Reglas de negocio incumplidas (porcentajes que no suman 100%, participaciones que no cuadran con el total, integrante ajeno al grupo, correo duplicado o intento de eliminar a un integrante con balance distinto de cero).
- **`500 Internal Server Error`**: Falla inesperada del servidor (sin exponer trazas internas al cliente).

Todas las respuestas de error tienen exactamente la siguiente estructura:
```json
{
  "error": "Mensaje descriptivo del motivo del error"
}
```

---

## 14. Pruebas con Postman

En la carpeta `postman/` se suministran los archivos listos para importar:
1. `GastosCompartidos.postman_collection.json`: Contiene todas las solicitudes organizadas en 5 carpetas con scripts de prueba automatizados (`pm.test`).
2. `GastosCompartidos.postman_environment.json`: Define la variable `base_url` (`http://localhost:3000/api`) y los IDs iniciales.

### Pasos para probar:
1. Abre Postman y haz clic en **Import**.
2. Selecciona ambos archivos ubicados en `backend/postman/`.
3. Selecciona el entorno **Gastos Compartidos - Local** en la esquina superior derecha.
4. Ejecuta la colección manualmente o mediante el **Collection Runner** para verificar que todas las aserciones pasen en verde.

---

## 15. Decisiones Técnicas y Buenas Prácticas

1. **Cero ORM**: Se optó por SQL puro mediante `pg.Pool` para tener control absoluto de las transacciones, los bloqueos de fila (`FOR UPDATE`) y las agregaciones complejas (`CTE`), evitando sobrecostos de rendimiento o abstracciones opacas.
2. **Seguridad contra Inyección SQL**: Todas las consultas utilizan sentencias preparadas y parámetros posicionales (`$1`, `$2`, etc.). Queda estrictamente prohibida la concatenación de cadenas en SQL.
3. **Manejo Determinista de Centavos**: Se utiliza el algoritmo de mayores residuos (Hamilton-Hare) y desempate por identificador primario para asegurar que el cuadre de centavos en repartos equitativos y porcentuales sea 100% reproducible y auditable.
4. **Manejo Seguro de Conexiones**: Toda transacción mediante cliente dedicado (`pool.connect()`) incluye la liberación garantizada en un bloque `finally { client.release(); }`.
