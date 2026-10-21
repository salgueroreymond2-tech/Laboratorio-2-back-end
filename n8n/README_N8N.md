# Agente de IA para Control de Gastos Compartidos (n8n)
**Laboratorio 2, Día 2: Integración con n8n**

Este directorio contiene el workflow oficial importable para **n8n** que implementa un Agente de Inteligencia Artificial capaz de:
1. **Clasificar gastos automáticamente** a partir de una descripción en lenguaje natural.
2. **Generar balances y resúmenes mensuales** con recomendaciones financieras prudentes para el grupo.

---

## 1. Archivos Disponibles

- `agente-gastos-compartidos.json`: Definición completa del workflow (compatible con n8n versión `1.x`).
- `README_N8N.md`: Guía de importación, configuración, ejecución y resolución de problemas.

---

## 2. Contrato de Comunicación de la API `{ ok, data, error }`

Para garantizar robustez y desacoplamiento con el frontend, el Webhook responde bajo un contrato estricto:

### 2.1. Respuesta Exitosa
```json
{
  "ok": true,
  "data": {
    "categoria": "Alimentación",
    "confianza": 0.95,
    "justificacion": "La compra de mariscos y comida en restaurante corresponde al rubro de alimentación."
  },
  "error": null
}
```

### 2.2. Respuesta de Error Controlado
```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "ACTION_UNKNOWN",
    "message": "Acción desconocida. Acciones permitidas: clasificar_gasto, resumen_mensual."
  }
}
```

---

## 3. Requisitos Previos

- **n8n** versión `1.50.0` o superior (ejecutándose localmente vía Docker o `npx n8n`).
- Una cuenta de proveedor de IA (ej: **OpenAI** con API Key para `gpt-4o-mini`, o Google Gemini / Anthropic).

---

## 4. Pasos para Importar y Configurar en n8n

### Paso 1: Iniciar n8n
Si no tienes n8n iniciado en tu máquina, puedes levantarlo en PowerShell con:
```powershell
npx n8n
```
*O mediante Docker:*
```bash
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```
Por defecto, la interfaz quedará accesible en: `http://localhost:5678`.

---

### Paso 2: Importar el Workflow
1. Abre tu navegador en `http://localhost:5678`.
2. En el menú superior o lateral, haz clic en **Workflows** -> **Import from File**.
3. Selecciona el archivo `n8n/agente-gastos-compartidos.json`.
4. Verás aparecer el diagrama con los 7 nodos conectados:
   - `Webhook Gastos IA`
   - `Validar y Preparar Prompt`
   - `¿Entrada Válida?`
   - `AI Agent Gastos Compartidos`
   - `OpenAI Chat Model`
   - `Calculator Tool` & `Code Tool Finanzas`
   - `Parsear y Validar Respuesta IA`
   - `Respond to Webhook`

---

### Paso 3: Configurar la Credencial del Modelo de Chat
1. Haz doble clic en el nodo **OpenAI Chat Model**.
2. En el campo **Credential to connect with**, haz clic en **Create New Credential**.
3. Pega tu clave de API (por ejemplo de OpenAI) y guarda la credencial.
   *(Nota: También puedes cambiar este nodo por uno de Gemini Chat Model o Anthropic Chat Model según tus preferencias).*

---

### Paso 4: Activar el Workflow
1. En la esquina superior derecha del editor de n8n, cambia el interruptor de **Inactive** a **Active**.
2. Haz clic en **Save** para guardar los cambios.

---

## 5. Diferencia entre URL de Prueba y Producción

- **URL de Producción (Recomendada con Workflow Activo)**:
  `http://localhost:5678/webhook/gastos-ia`
  Esta es la URL que debe configurarse en `frontend/.env` como `VITE_N8N_WEBHOOK_URL`.

- **URL de Prueba (Listen for Test Event)**:
  `http://localhost:5678/webhook-test/gastos-ia`
  Solo funciona temporalmente mientras tienes abierto el botón *"Test step"* en n8n.

---

## 6. Pruebas del Webhook desde PowerShell

### 6.1. Prueba de Clasificación de Gasto (`clasificar_gasto`)

Abre PowerShell y ejecuta:

```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    action = "clasificar_gasto"
    descripcion = "Compra semanal de carne, verduras y leche en el supermercado"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5678/webhook/gastos-ia" -Method Post -Headers $headers -Body $body
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "data": {
    "categoria": "Alimentación",
    "confianza": 0.95,
    "justificacion": "La compra de alimentos en supermercado corresponde al rubro de Alimentación."
  },
  "error": null
}
```

---

### 6.2. Prueba de Resumen Mensual (`resumen_mensual`)

En PowerShell:

```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    action = "resumen_mensual"
    grupo_id = 1
    mes = "2026-10"
    gastos = @(
        @{ id = 1; descripcion = "Alquiler Cabaña"; monto = "120.00"; categoria = "Hospedaje" },
        @{ id = 2; descripcion = "Cena de Mariscos"; monto = "100.01"; categoria = "Alimentación" },
        @{ id = 3; descripcion = "Combustible"; monto = "50.00"; categoria = "Transporte" }
    )
    balances = @(
        @{ nombre = "Carlos Gómez"; balance_neto = "51.66"; estado = "Acreedor" },
        @{ nombre = "Elena Torres"; balance_neto = "-65.00"; estado = "Deudor" }
    )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:5678/webhook/gastos-ia" -Method Post -Headers $headers -Body $body
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "data": {
    "grupo_id": 1,
    "mes": "2026-10",
    "total_gastado": "270.01",
    "categoria_principal": "Hospedaje",
    "resumen": "Durante el mes de octubre, el grupo registró tres gastos principales acumulando ₡270.01, concentrados mayoritariamente en hospedaje y alimentación.",
    "recomendaciones": [
      "Priorizar la liquidación pendiente entre Elena Torres y Carlos Gómez para equilibrar los saldos.",
      "Acordar presupuestos máximos para cenas fuera antes de los viajes."
    ]
  },
  "error": null
}
```

---

## 7. Solución a Errores Frecuentes

1. **`Failed to fetch` desde el frontend**:
   - Asegúrate de que n8n esté corriendo en el puerto 5678.
   - En el nodo `Webhook Gastos IA`, ya se incluyeron los encabezados de CORS (`Access-Control-Allow-Origin: *`).
2. **`Workflow is not active` (404 Not Found)**:
   - Activa el interruptor en n8n arriba a la derecha. Si está inactivo, solo responderá a `webhook-test`, no a `webhook`.
3. **`Invalid AI response`**:
   - Si el modelo de lenguaje retorna texto conversacional o markdown (` ```json `), el nodo `Parsear y Validar Respuesta IA` limpia automáticamente las etiquetas y extrae el JSON.
4. **Error de clave de API**:
   - Verifica que la credencial del modelo de chat en n8n tenga crédito o una clave válida de OpenAI/Gemini/Anthropic.
