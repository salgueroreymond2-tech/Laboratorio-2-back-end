# Control de Gastos Compartidos con Liquidaciones - Frontend SPA
**Laboratorio 2, Día 2: Frontend y Automatización con n8n**

Single Page Application (SPA) responsive y moderna construida con **React**, **Vite** y **React Router DOM**, diseñada para gestionar gastos compartidos, calcular balances grupales en tiempo real, procesar transferencias sugeridas mediante algoritmo voraz e interactuar con un **Agente de Inteligencia Artificial en n8n** para categorización de gastos y generación de resúmenes financieros mensuales.

---

## 1. Objetivo del Proyecto

Proporcionar una interfaz de usuario fluida, accesible y visualmente pulida que consuma la API REST del backend desarrollada en el Día 1 y el webhook de n8n, permitiendo:
- Monitorear indicadores estadísticos globales y por grupo calculados directamente en PostgreSQL.
- Administrar personas y registrar nuevos integrantes.
- Crear y editar gastos con tres modalidades de reparto (**IGUALES**, **PORCENTAJE** y **EXACTO**).
- Asistir al usuario mediante un Agente de IA para sugerir categorías basadas en la descripción del gasto.
- Consultar balances por integrante y ver transferencias óptimas para saldar deudas.
- Retirar integrantes de grupos con control estricto de balance cero (`409 Conflict`).
- Generar informes mensuales en lenguaje natural a través de n8n.

---

## 2. Arquitectura del Proyecto

```text
frontend/
├── .env.example                               # Plantilla de variables de entorno
├── .gitignore                                  # Ignora node_modules, .env y dist
├── package.json                                # Dependencias y scripts de Vite y Vitest
├── vite.config.js                              # Configuración de Vite y entorno jsdom
├── index.html                                  # Entrada HTML con fuentes Google Fonts (Inter y Outfit)
├── README.md                                   # Documentación técnica completa
└── src/
    ├── main.jsx                                # Punto de entrada React con React.StrictMode
    ├── App.jsx                                 # Componente raíz con BrowserRouter
    ├── styles/
    │   ├── variables.css                       # Tokens de diseño, colores y tipografía
    │   ├── globals.css                         # Reset, botones, inputs, badges y accesibilidad
    │   └── responsive.css                      # Breakpoints móviles, cuadrículas y tablas
    ├── services/
    │   ├── api.js                              # Capa REST centralizada para el backend con ApiError
    │   └── n8nApi.js                           # Cliente de integración con el webhook de n8n
    ├── hooks/
    │   ├── useFetch.js                         # Custom hook con AbortController y preservación de status HTTP
    │   └── useForm.js                          # Custom hook para formularios controlados
    ├── utils/
    │   ├── money.js                            # Conversiones y sumas exactas en centavos (CRC)
    │   ├── validators.js                       # Validadores de porcentajes, cuadre y campos requeridos
    │   └── formatters.js                       # Formato de fechas, iniciales y textos
    ├── layouts/
    │   └── MainLayout.jsx                      # Layout común con navegación adaptable y landmarks
    ├── routes/
    │   └── AppRoutes.jsx                       # Declaración central de rutas con React Router DOM
    ├── pages/
    │   ├── DashboardPage.jsx                   # Vista principal con métricas globales
    │   ├── ExpensesPage.jsx                    # Listado interactivo con filtros y ordenamiento
    │   ├── ExpenseDetailPage.jsx               # Detalle de gasto con participaciones y comprobación visual
    │   ├── ExpenseFormPage.jsx                 # Formulario controlado de alta y edición
    │   ├── GroupsPage.jsx                      # Listado y creación de grupos
    │   ├── GroupDetailPage.jsx                 # Balances, liquidaciones voraces y resumen mensual IA
    │   ├── PeoplePage.jsx                      # Administración de personas con manejo de integridad
    │   └── NotFoundPage.jsx                    # Vista 404 para rutas inexistentes
    ├── components/
    │   ├── common/                             # Componentes reutilizables de UI
    │   │   ├── LoadingSpinner.jsx
    │   │   ├── ErrorAlert.jsx
    │   │   ├── EmptyState.jsx
    │   │   ├── ConfirmDialog.jsx
    │   │   └── StatusMessage.jsx
    │   ├── dashboard/                          # Tarjetas de indicadores estadísticos
    │   │   └── MetricCard.jsx
    │   ├── expenses/                           # Componentes específicos de gastos
    │   │   ├── ExpenseList.jsx
    │   │   ├── ExpenseItem.jsx
    │   │   ├── ExpenseFilters.jsx
    │   │   ├── ExpenseForm.jsx
    │   │   └── SplitEditor.jsx
    │   ├── groups/                             # Componentes de balances e IA
    │   │   ├── BalanceList.jsx
    │   │   ├── SettlementSuggestions.jsx
    │   │   └── MonthlySummary.jsx
    │   └── people/                             # Componentes de gestión de personas
    │       ├── PeopleList.jsx
    │       └── PersonForm.jsx
    └── test/
        └── setup.js                            # Configuración de jest-dom para Vitest
```

---

## 3. Variables de Entorno

Configura el archivo `.env` en la raíz de `frontend/` a partir de [.env.example](file:///c:/Users/HP8D8/OneDrive/Desktop/Ray/Laboratorio%202%20BackEnd/frontend/.env.example):

```env
VITE_API_URL=http://localhost:3000/api
VITE_N8N_WEBHOOK_URL=http://localhost:5678/webhook/gastos-ia
```

- `VITE_API_URL`: URL base de la API REST del backend de Node.js/Express.
- `VITE_N8N_WEBHOOK_URL`: URL del Webhook de producción del agente de n8n.

---

## 4. Instalación y Ejecución

### 4.1. En Windows (PowerShell)

```powershell
# 1. Navegar al directorio del frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación se abrirá en `http://localhost:5173`.

---

### 4.2. En Linux / macOS (Bash)

```bash
# 1. Navegar al directorio del frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar en modo desarrollo
npm run dev
```

---

## 5. Compilación para Producción y Pruebas

### 5.1. Ejecutar las Pruebas Automatizadas (Vitest)
```powershell
npm test
```
*O en modo escucha interactivo:*
```powershell
npm run test:watch
```

### 5.2. Compilar el Bundle de Producción
```powershell
npm run build
```
Los archivos optimizados se generarán en la carpeta `dist/`.

---

## 6. Enrutamiento de la SPA

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `DashboardPage` | Métricas globales del sistema y desglose de gastos por grupo |
| `/gastos` | `ExpensesPage` | Listado interactivo con búsqueda, filtros múltiples y ordenamiento |
| `/gastos/nuevo` | `ExpenseFormPage` | Formulario de creación de gastos con asistencia de IA |
| `/gastos/:id` | `ExpenseDetailPage` | Detalle del gasto con participaciones y comprobación visual de cuadre |
| `/gastos/:id/editar` | `ExpenseFormPage` | Edición de gasto existente y recálculo de participaciones |
| `/grupos` | `GroupsPage` | Listado y creación de grupos |
| `/grupos/:id` | `GroupDetailPage` | Balances netos, transferencias sugeridas (voraz), retiro 409 y resumen mensual IA |
| `/personas` | `PeoplePage` | Administración de personas (alta, edición y eliminación) |
| `/*` | `NotFoundPage` | Manejo de rutas inexistentes (404) |

---

## 7. Manejo Financiero y Tipos de Reparto

Para evitar errores de precisión de punto flotante en JavaScript (IEEE 754), el archivo `src/utils/money.js` opera todos los valores en **centavos enteros**:
- **Moneda**: Colones Costarricenses por defecto (`CRC`, `₡`), formateado con `Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' })`.

### 7.1. Reparto IGUALES
- Permite seleccionar integrantes mediante casillas de verificación.
- Calcula la cuota base y avisa visualmente cómo se asignan los centavos sobrantes según el orden determinista de `persona_id`.

### 7.2. Reparto PORCENTAJE
- Permite asignar un porcentaje con hasta 2 decimales a cada persona.
- Valida en tiempo real que la suma total sea exactamente `100.00%`. Deshabilita el envío si falta o sobra porcentaje.

### 7.3. Reparto EXACTO
- Permite definir manualmente el monto exacto asignado a cada integrante.
- Comprueba que la suma de las asignaciones coincida al centavo con el monto total del gasto.

---

## 8. Integración con el Agente de IA en n8n

El servicio `src/services/n8nApi.js` se comunica con el webhook de n8n cumpliendo con el contrato estricto `{ ok, data, error }`:

1. **Sugerir categoría con IA (`clasificar_gasto`)**:
   - En el formulario de gastos, el usuario puede hacer clic en **"Sugerir categoría con IA"**.
   - n8n analiza la descripción y retorna `{ categoria, confianza, justificacion }`.
   - La sugerencia se presenta al usuario con un botón para aplicarla voluntariamente sin sobreescribir silenciosamente.
2. **Resumen Mensual Inteligente (`resumen_mensual`)**:
   - En la vista del grupo, se selecciona un mes (`YYYY-MM`) y se solicita al agente un análisis.
   - n8n totaliza los montos, detecta la categoría más alta y redacta recomendaciones prudentes.
   - El resultado se renderiza como texto plano seguro (sin `dangerouslySetInnerHTML`).

---

## 9. Manejo de Errores y Accesibilidad (WCAG 2.1)

- **HTTP 400**: Muestra el mensaje del backend y resalta los campos inválidos en el formulario.
- **HTTP 404**: Despliega mensaje de recurso no encontrado con enlace para volver.
- **HTTP 409 (Conflicto de Negocio)**:
  - Si se intenta retirar a un integrante con balance distinto de cero, el backend responde 409. El frontend **no retira visualmente a la persona**, mantiene la lista y muestra la explicación del saldo pendiente con acceso directo a sus balances y liquidaciones.
  - Alerta inmediata si los porcentajes no suman 100% o los montos no cuadran.
- **Accesibilidad**: Uso de `role="alert"`, `aria-live="assertive"`, `aria-modal="true"` en diálogos modales, foco visible en inputs y botones, navegación completa por teclado y soporte para `prefers-reduced-motion`.
