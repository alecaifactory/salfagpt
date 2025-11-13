# Proyecto Cartola Inteligente Nubox
## Reconocimiento Inteligente de Cartolas Bancarias

**Versión:** 1.0.0  
**Fecha:** 2025-11-10  
**Estado:** 🚧 En Desarrollo  
**Prioridad:** Alta

---

## 📋 Tabla de Contenidos

1. [Objetivo del Proyecto](#objetivo-del-proyecto)
2. [Contexto Estratégico](#contexto-estratégico)
3. [Requisitos Funcionales](#requisitos-funcionales)
4. [Requisitos Técnicos](#requisitos-técnicos)
5. [Seguridad y Privacidad](#seguridad-y-privacidad)
6. [Entregables](#entregables)
7. [Criterios de Éxito](#criterios-de-éxito)
8. [Ejemplo de JSON Esperado](#ejemplo-de-json-esperado)
9. [Integración con Ecosistema Nubox](#integración-con-ecosistema-nubox)
10. [Próximos Pasos](#próximos-pasos)

---

## 🎯 Objetivo del Proyecto

Desarrollar un servicio API RESTful que permita a los usuarios de Nubox subir cartolas bancarias (PDF o imágenes) y recibir como respuesta un JSON estructurado con todos los movimientos bancarios reconocidos automáticamente mediante tecnologías de OCR e IA.

### Objetivos Específicos

- **Automatización**: Eliminar la necesidad de ingreso manual de movimientos bancarios
- **Precisión**: Reconocimiento inteligente con alta tasa de acierto (>95%)
- **Escalabilidad**: Procesamiento asíncrono para manejar múltiples documentos simultáneamente
- **Integración**: Preparación para integración con "Contabilidad Cirrus" y "Factura y Administración"
- **Seguridad**: Cumplimiento con Ley 19.628 y estándares de seguridad bancaria

---

## 🏢 Contexto Estratégico

### Problema Actual

Los usuarios de Nubox deben ingresar manualmente los movimientos de sus cartolas bancarias, lo cual:
- Consume tiempo significativo
- Es propenso a errores humanos
- No escala con el volumen de transacciones
- Dificulta la conciliación bancaria

### Oportunidad

Implementar reconocimiento inteligente de documentos bancarios que:
- Reduzca el tiempo de procesamiento en 90%+
- Mejore la precisión de datos
- Permita procesamiento en lote
- Facilite la integración con otros módulos de Nubox

### Impacto Esperado

- **Eficiencia**: Reducción de tiempo de procesamiento de cartolas
- **Precisión**: Menor tasa de errores en ingreso de datos
- **Experiencia de Usuario**: Proceso más fluido y automatizado
- **Competitividad**: Diferenciación en el mercado de software contable

---

## ⚙️ Requisitos Funcionales

### RF-1: Carga de Documentos

**Descripción:** El sistema debe permitir la carga de cartolas bancarias en formato PDF o imagen (PNG, JPEG).

**Especificaciones:**
- Formatos soportados: PDF, PNG, JPEG
- Tamaño máximo: 500MB (con procesamiento chunked para archivos >20MB)
- Validación de tipo de archivo antes del procesamiento
- Soporte para múltiples bancos chilenos:
  - Banco de Chile
  - Banco del Estado de Chile (BancoEstado)
  - Banco Itaú Chile
  - Banco Scotiabank
  - MachBank
  - TenpoBank
  - Otros bancos (reconocimiento genérico)

**Prioridad:** Alta

---

### RF-2: Reconocimiento Inteligente

**Descripción:** El sistema debe reconocer automáticamente la estructura de la cartola y extraer todos los movimientos bancarios.

**Especificaciones:**
- Reconocimiento de layout mediante IA (Gemini AI 2.5 Flash/Pro)
- Identificación automática del banco emisor
- Extracción de campos estructurados:
  - Información del titular
  - Período de la cartola
  - Saldos iniciales y finales
  - Movimientos individuales con todos sus campos
- Manejo de múltiples formatos de cartola por banco
- Tolerancia a variaciones en formato y calidad de imagen

**Prioridad:** Alta

---

### RF-3: Procesamiento Asíncrono

**Descripción:** El procesamiento de documentos debe ser asíncrono para no bloquear al usuario.

**Especificaciones:**
- Respuesta inmediata con ID de proceso
- Webhooks para notificación de estado
- Polling opcional para verificación de estado
- Estimación de tiempo de procesamiento según tamaño de archivo
- Manejo de errores con reintentos automáticos

**Prioridad:** Media

---

### RF-4: Respuesta JSON Estructurada

**Descripción:** La respuesta debe ser un JSON estructurado con todos los datos reconocidos.

**Especificaciones:**
- Formato JSON válido y bien estructurado
- Campos obligatorios siempre presentes
- Campos opcionales claramente marcados
- Metadatos de procesamiento incluidos
- Información de confianza por campo (confidence scores)

**Prioridad:** Alta

---

### RF-5: Manejo de Errores

**Descripción:** El sistema debe manejar errores de manera elegante y proporcionar información útil.

**Especificaciones:**
- Códigos HTTP estándar (400, 401, 403, 404, 500, etc.)
- Mensajes de error descriptivos en español
- Sugerencias de solución cuando sea posible
- Logging detallado para debugging
- Notificación de errores críticos

**Prioridad:** Media

---

## 🔧 Requisitos Técnicos

### RT-1: Arquitectura API RESTful

**Especificaciones:**
- Endpoint base: `/api/cartola` (nuevo endpoint, separado de `/api/extract-document`)
- Método HTTP: POST para carga de documentos
- Autenticación: OAuth 2.0 (reutilizar sistema existente)
- Content-Type: `multipart/form-data` para carga de archivos
- Respuesta: JSON con estructura definida

**Endpoints Propuestos:**

```
POST /api/cartola/upload
  - Carga documento y retorna jobId
  - Body: multipart/form-data (file, userId, organizationId)
  - Response: { jobId: string, status: 'processing', estimatedTime: number }

GET /api/cartola/status/:jobId
  - Consulta estado del procesamiento
  - Response: { status: 'processing' | 'completed' | 'failed', progress: number }

GET /api/cartola/result/:jobId
  - Obtiene resultado del procesamiento
  - Response: { data: CartolaJSON, metadata: ProcessingMetadata }

POST /api/cartola/webhook
  - Endpoint para recibir notificaciones (futuro)
```

**Prioridad:** Alta

---

### RT-2: Tecnologías de OCR/IA

**Stack Tecnológico:**
- **Primario**: Google Gemini AI 2.5 Flash/Pro
  - Modelo por defecto: `gemini-2.5-flash` (rápido y económico)
  - Modelo avanzado: `gemini-2.5-pro` (mayor precisión para casos complejos)
- **Secundario**: Google Cloud Vision API
  - Para archivos <50MB (extracción rápida de texto)
  - Fallback automático a Gemini si Vision API falla o retorna texto insuficiente
- **Chunked Processing**: Para archivos >20MB
  - División en secciones de ~12MB
  - Procesamiento en paralelo
  - Combinación de resultados

**Prioridad:** Alta

---

### RT-3: Almacenamiento y Persistencia

**Especificaciones:**
- **Cloud Storage**: Almacenamiento temporal de archivos originales
  - Bucket: `gen-lang-client-0986191192-cartolas`
  - Retención: 7 días (eliminación automática)
  - Encriptación: AES-256 en reposo
- **Firestore**: Metadatos y resultados estructurados
  - Colección: `cartola_extractions`
  - Índices: userId, organizationId, jobId, createdAt
  - Retención: 90 días (configurable por organización)

**Estructura de Datos:**

```typescript
interface CartolaExtraction {
  id: string;                    // Document ID
  jobId: string;                 // Unique job identifier
  userId: string;                // User who uploaded
  organizationId?: string;       // Organization (multi-org support)
  
  // File Information
  fileName: string;
  fileSize: number;
  fileType: string;
  gcsPath: string;               // Cloud Storage path
  
  // Processing Status
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;               // 0-100
  error?: {
    message: string;
    code: string;
    details?: string;
  };
  
  // Recognition Results
  extractedData?: CartolaJSON;   // Structured JSON result
  confidence?: {
    overall: number;              // 0-100
    fields: Record<string, number>; // Per-field confidence
  };
  
  // Metadata
  bankDetected?: string;          // Bank name detected
  periodDetected?: {
    start: string;
    end: string;
  };
  processingTime?: number;        // Milliseconds
  modelUsed?: string;             // 'gemini-2.5-flash' | 'gemini-2.5-pro'
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // Source tracking
  source: 'localhost' | 'staging' | 'production';
}
```

**Prioridad:** Alta

---

### RT-4: Procesamiento Asíncrono

**Especificaciones:**
- **Job Queue**: Sistema de cola para procesamiento
  - Implementación: Firestore `message_queue` collection (reutilizar infraestructura existente)
  - Procesamiento secuencial por usuario (evitar sobrecarga)
  - Reintentos automáticos en caso de fallo
- **Progress Tracking**: Actualización de progreso en tiempo real
  - Actualización cada 5-10% de progreso
  - Webhooks opcionales para notificaciones
- **Timeout Handling**: Manejo de timeouts
  - Timeout máximo: 15 minutos por documento
  - Notificación de timeout al usuario
  - Opción de reintento manual

**Prioridad:** Media

---

### RT-5: Escalabilidad y Resiliencia

**Especificaciones:**
- **Horizontal Scaling**: Cloud Run auto-scaling
  - Mínimo: 1 instancia
  - Máximo: 10 instancias
  - CPU: 2 vCPU por instancia
  - Memoria: 4GB por instancia
- **Rate Limiting**: Control de tasa de solicitudes
  - 10 solicitudes por minuto por usuario
  - 100 solicitudes por minuto por organización
- **Retry Logic**: Reintentos automáticos
  - Máximo 3 reintentos por documento
  - Backoff exponencial (1s, 2s, 4s)
- **Circuit Breaker**: Protección contra fallos en cascada
  - Activar si tasa de error >10% en 5 minutos
  - Desactivar después de 2 minutos sin errores

**Prioridad:** Media

---

## 🔒 Seguridad y Privacidad

### SEG-1: Autenticación y Autorización

**Especificaciones:**
- **OAuth 2.0**: Reutilizar sistema de autenticación existente
- **JWT Tokens**: Validación en cada request
- **Role-Based Access**: Control de acceso por roles
  - Usuario estándar: Puede procesar sus propias cartolas
  - Admin: Puede procesar cartolas de su organización
  - SuperAdmin: Acceso completo
- **API Keys**: Para integraciones externas (futuro)
  - Rotación automática cada 90 días
  - Revocación inmediata disponible

**Prioridad:** Alta

---

### SEG-2: Encriptación de Datos

**Especificaciones:**
- **En Tránsito**: TLS 1.2+ obligatorio
  - Certificados SSL válidos
  - HSTS habilitado
- **En Reposo**: AES-256
  - Cloud Storage: Encriptación automática
  - Firestore: Encriptación automática
  - Claves gestionadas por GCP KMS (por organización)
- **Datos Sensibles**: Enmascaramiento en logs
  - Números de cuenta: Últimos 4 dígitos visibles
  - Montos: Visibles solo para usuario autorizado
  - RUTs: Enmascarados en logs

**Prioridad:** Alta

---

### SEG-3: Cumplimiento Legal

**Especificaciones:**
- **Ley 19.628**: Protección de datos personales
  - Consentimiento explícito del usuario
  - Derecho al olvido (eliminación de datos)
  - Acceso a datos personales
- **Retención de Datos**: Política de retención
  - Archivos originales: 7 días
  - Datos extraídos: 90 días (configurable)
  - Logs de auditoría: 1 año
- **Eliminación Automática**: Proceso automatizado
  - Eliminación de archivos después de retención
  - Eliminación de datos extraídos después de retención
  - Notificación al usuario antes de eliminación (opcional)

**Prioridad:** Alta

---

### SEG-4: Aislamiento de Datos

**Especificaciones:**
- **Multi-Tenancy**: Aislamiento por organización
  - Filtrado automático por `organizationId`
  - Usuarios solo ven sus propios datos
  - Admins ven datos de su organización
- **User Isolation**: Aislamiento por usuario
  - Filtrado por `userId` en todas las consultas
  - Validación de propiedad en cada request
- **Data Lineage**: Trazabilidad completa
  - Registro de quién procesó qué documento
  - Registro de accesos a datos
  - Auditoría de cambios

**Prioridad:** Alta

---

## 📦 Entregables

### ENT-1: API RESTful Funcional

**Descripción:** API completa con todos los endpoints documentados.

**Criterios de Aceptación:**
- ✅ Endpoints implementados y funcionando
- ✅ Documentación OpenAPI/Swagger completa
- ✅ Ejemplos de uso en múltiples lenguajes
- ✅ Manejo de errores robusto
- ✅ Tests de integración pasando

**Fecha Estimada:** Semana 1-2

---

### ENT-2: Motor de Reconocimiento

**Descripción:** Sistema de reconocimiento inteligente con alta precisión.

**Criterios de Aceptación:**
- ✅ Precisión >95% en reconocimiento de campos
- ✅ Soporte para 7+ bancos chilenos
- ✅ Manejo de múltiples formatos por banco
- ✅ Procesamiento de archivos hasta 500MB
- ✅ Tiempo de procesamiento <5 minutos para archivos <50MB

**Fecha Estimada:** Semana 2-4

---

### ENT-3: Sistema de Procesamiento Asíncrono

**Descripción:** Cola de procesamiento con seguimiento de progreso.

**Criterios de Aceptación:**
- ✅ Procesamiento asíncrono funcionando
- ✅ Actualización de progreso en tiempo real
- ✅ Manejo de errores con reintentos
- ✅ Webhooks para notificaciones (opcional)
- ✅ Polling endpoint para verificación de estado

**Fecha Estimada:** Semana 3-4

---

### ENT-4: Documentación Técnica

**Descripción:** Documentación completa para desarrolladores y usuarios.

**Criterios de Aceptación:**
- ✅ Guía de integración API
- ✅ Ejemplos de código en múltiples lenguajes
- ✅ Documentación de errores y soluciones
- ✅ Guía de mejores prácticas
- ✅ Diagramas de arquitectura

**Fecha Estimada:** Semana 4

---

### ENT-5: Tests y Validación

**Descripción:** Suite completa de tests y validación con documentos reales.

**Criterios de Aceptación:**
- ✅ Tests unitarios con cobertura >80%
- ✅ Tests de integración con documentos reales
- ✅ Validación con 7 bancos diferentes
- ✅ Tests de carga (100+ documentos simultáneos)
- ✅ Tests de seguridad y privacidad

**Fecha Estimada:** Semana 4-5

---

## ✅ Criterios de Éxito

### CS-1: Precisión

- **Objetivo:** >95% de precisión en reconocimiento de campos
- **Medición:** Comparación manual vs automática en 100 documentos
- **Métrica:** Campos correctamente reconocidos / Total de campos

---

### CS-2: Rendimiento

- **Objetivo:** Procesamiento <5 minutos para archivos <50MB
- **Medición:** Tiempo promedio de procesamiento
- **Métrica:** P95 de tiempo de procesamiento

---

### CS-3: Escalabilidad

- **Objetivo:** Manejar 100+ documentos simultáneos
- **Medición:** Pruebas de carga
- **Métrica:** Throughput (documentos procesados por minuto)

---

### CS-4: Disponibilidad

- **Objetivo:** 99.5% de uptime
- **Medición:** Monitoreo continuo
- **Métrica:** Tiempo de inactividad / Tiempo total

---

### CS-5: Seguridad

- **Objetivo:** 0 brechas de seguridad
- **Medición:** Auditorías de seguridad
- **Métrica:** Vulnerabilidades críticas encontradas

---

## 📄 Ejemplo de JSON Esperado

### Estructura Completa

```json
{
  "metadata": {
    "extractionId": "ext_abc123xyz",
    "jobId": "job_789def456",
    "timestamp": "2025-11-10T14:30:00Z",
    "processingTime": 125000,
    "modelUsed": "gemini-2.5-flash",
    "confidence": {
      "overall": 96.5,
      "fields": {
        "accountHolder": 98.0,
        "accountNumber": 99.5,
        "period": 97.0,
        "movements": 95.8
      }
    },
    "bankDetected": "Banco de Chile",
    "fileInfo": {
      "fileName": "cartola_banco_chile_nov_2025.pdf",
      "fileSize": 2456789,
      "pageCount": 12
    }
  },
  "account": {
    "holder": {
      "name": "EMPRESA EJEMPLO S.A.",
      "rut": "76.123.456-7",
      "accountType": "Cuenta Corriente"
    },
    "accountNumber": "1234567890",
    "currency": "CLP"
  },
  "period": {
    "start": "2025-11-01",
    "end": "2025-11-30",
    "statementDate": "2025-12-01"
  },
  "balances": {
    "opening": {
      "date": "2025-11-01",
      "amount": 1500000.00,
      "currency": "CLP"
    },
    "closing": {
      "date": "2025-11-30",
      "amount": 2350000.00,
      "currency": "CLP"
    },
    "available": {
      "date": "2025-11-30",
      "amount": 2350000.00,
      "currency": "CLP"
    }
  },
  "movements": [
    {
      "id": "mov_001",
      "date": "2025-11-05",
      "valueDate": "2025-11-05",
      "description": "TRANSFERENCIA RECIBIDA - CLIENTE ABC",
      "type": "credit",
      "amount": 500000.00,
      "balance": 2000000.00,
      "reference": "TRF-123456",
      "channel": "Transferencia Electrónica",
      "category": "Ingresos",
      "counterparty": {
        "name": "CLIENTE ABC S.A.",
        "rut": "76.987.654-3",
        "account": "9876543210",
        "bank": "Banco Santander"
      },
      "metadata": {
        "confidence": 97.5,
        "lineNumber": 5,
        "rawText": "05/11 05/11 TRANSFERENCIA RECIBIDA - CLIENTE ABC 500.000 2.000.000"
      }
    },
    {
      "id": "mov_002",
      "date": "2025-11-10",
      "valueDate": "2025-11-10",
      "description": "PAGO PROVEEDOR XYZ - FACTURA 1234",
      "type": "debit",
      "amount": 150000.00,
      "balance": 1850000.00,
      "reference": "PAG-789012",
      "channel": "Transferencia Electrónica",
      "category": "Gastos",
      "counterparty": {
        "name": "PROVEEDOR XYZ LTDA.",
        "rut": "77.111.222-3",
        "account": "1112223334",
        "bank": "Banco de Chile"
      },
      "metadata": {
        "confidence": 96.0,
        "lineNumber": 12,
        "rawText": "10/11 10/11 PAGO PROVEEDOR XYZ - FACTURA 1234 -150.000 1.850.000"
      }
    },
    {
      "id": "mov_003",
      "date": "2025-11-15",
      "valueDate": "2025-11-15",
      "description": "CARGO COMISION MANTENCION CUENTA",
      "type": "debit",
      "amount": 5000.00,
      "balance": 1845000.00,
      "reference": "COM-001",
      "channel": "Cargo Automático",
      "category": "Comisiones",
      "counterparty": {
        "name": "Banco de Chile",
        "rut": "97.036.000-1"
      },
      "metadata": {
        "confidence": 99.0,
        "lineNumber": 18,
        "rawText": "15/11 15/11 CARGO COMISION MANTENCION CUENTA -5.000 1.845.000"
      }
    },
    {
      "id": "mov_004",
      "date": "2025-11-20",
      "valueDate": "2025-11-20",
      "description": "DEPOSITO EFECTIVO - SUCURSAL PROVIDENCIA",
      "type": "credit",
      "amount": 500000.00,
      "balance": 2345000.00,
      "reference": "DEP-456789",
      "channel": "Depósito en Ventanilla",
      "category": "Ingresos",
      "counterparty": {
        "name": "Banco de Chile - Sucursal Providencia",
        "rut": "97.036.000-1"
      },
      "metadata": {
        "confidence": 98.5,
        "lineNumber": 25,
        "rawText": "20/11 20/11 DEPOSITO EFECTIVO - SUCURSAL PROVIDENCIA 500.000 2.345.000"
      }
    },
    {
      "id": "mov_005",
      "date": "2025-11-25",
      "valueDate": "2025-11-25",
      "description": "PAGO SERVICIOS BASICOS - ENERGIA",
      "type": "debit",
      "amount": 45000.00,
      "balance": 2300000.00,
      "reference": "PAG-SERV-001",
      "channel": "Cargo Automático",
      "category": "Servicios",
      "counterparty": {
        "name": "ENEL DISTRIBUCION CHILE S.A.",
        "rut": "96.505.110-1",
        "account": "5556667778",
        "bank": "Banco de Chile"
      },
      "metadata": {
        "confidence": 94.5,
        "lineNumber": 30,
        "rawText": "25/11 25/11 PAGO SERVICIOS BASICOS - ENERGIA -45.000 2.300.000"
      }
    }
  ],
  "summary": {
    "totalCredits": 1000000.00,
    "totalDebits": 200000.00,
    "netMovement": 800000.00,
    "movementCount": 5,
    "averageAmount": 200000.00,
    "largestCredit": {
      "id": "mov_001",
      "amount": 500000.00
    },
    "largestDebit": {
      "id": "mov_002",
      "amount": 150000.00
    }
  },
  "validation": {
    "balanceCheck": {
      "calculatedClosing": 2300000.00,
      "reportedClosing": 2350000.00,
      "difference": 50000.00,
      "matches": false,
      "notes": "Diferencia detectada. Posible movimiento no reconocido o error en reconocimiento."
    },
    "movementCountCheck": {
      "recognized": 5,
      "expected": null,
      "notes": "No se puede validar cantidad esperada sin información adicional"
    }
  }
}
```

### Campos Obligatorios vs Opcionales

**Obligatorios:**
- `metadata.extractionId`
- `metadata.jobId`
- `metadata.timestamp`
- `account.accountNumber`
- `period.start`
- `period.end`
- `balances.opening`
- `balances.closing`
- `movements[]` (al menos un movimiento)

**Opcionales:**
- `metadata.confidence`
- `account.holder.rut`
- `movements[].counterparty`
- `movements[].category`
- `summary`
- `validation`

---

## 🔗 Integración con Ecosistema Nubox

### Integración con Contabilidad Cirrus (Q4'25)

**Objetivo:** Permitir importación directa de movimientos reconocidos a Contabilidad Cirrus.

**Especificaciones:**
- Endpoint de exportación: `POST /api/cartola/export/:extractionId`
- Formato de exportación: JSON compatible con API de Contabilidad Cirrus
- Mapeo automático de categorías
- Validación de datos antes de exportación
- Confirmación de importación exitosa

**Prioridad:** Media (Q4'25)

---

### Integración con Factura y Administración (Fuera de Alcance Q4'25)

**Objetivo:** Reconocimiento de facturas y documentos relacionados con movimientos bancarios.

**Especificaciones:**
- Reconocimiento de facturas asociadas a movimientos
- Matching automático factura-movimiento
- Validación de montos y fechas
- Nota: Fuera del alcance para Q4'25

**Prioridad:** Baja (Post-Q4'25)

---

## 🚀 Próximos Pasos

### Fase 1: Diseño e Infraestructura (Semana 1)
- [ ] Definición detallada de arquitectura
- [ ] Setup de infraestructura (Cloud Storage, Firestore)
- [ ] Diseño de esquema de datos
- [ ] Setup de CI/CD

### Fase 2: Desarrollo Core (Semana 2-3)
- [ ] Implementación de endpoints API
- [ ] Integración con Gemini AI
- [ ] Sistema de procesamiento asíncrono
- [ ] Manejo de errores y validaciones

### Fase 3: Motor de Reconocimiento (Semana 3-4)
- [ ] Desarrollo de prompts para reconocimiento
- [ ] Testing con documentos reales (7 bancos)
- [ ] Ajuste fino de precisión
- [ ] Manejo de casos edge

### Fase 4: Testing y Optimización (Semana 4-5)
- [ ] Tests unitarios e integración
- [ ] Tests de carga
- [ ] Optimización de rendimiento
- [ ] Auditoría de seguridad

### Fase 5: Documentación y Lanzamiento (Semana 5)
- [ ] Documentación técnica completa
- [ ] Guías de usuario
- [ ] Preparación para producción
- [ ] Lanzamiento beta

---

## 📊 Métricas y Monitoreo

### Métricas Clave

- **Precisión de Reconocimiento**: % de campos correctamente reconocidos
- **Tiempo de Procesamiento**: P50, P95, P99
- **Throughput**: Documentos procesados por minuto
- **Tasa de Error**: % de documentos con errores
- **Uso de Recursos**: CPU, memoria, almacenamiento
- **Costos**: Costo por documento procesado

### Dashboards

- Dashboard de monitoreo en tiempo real
- Alertas automáticas para errores críticos
- Reportes de uso y costos
- Análisis de precisión por banco

---

## 🔄 Backward Compatibility

### Compatibilidad con Sistema Existente

**Principio:** El nuevo sistema de reconocimiento de cartolas debe coexistir con el sistema de extracción de documentos existente (`/api/extract-document`) sin generar conflictos.

**Estrategia:**
- **Endpoint Separado**: `/api/cartola/*` (nuevo) vs `/api/extract-document` (existente)
- **Colección Separada**: `cartola_extractions` (nuevo) vs `context_sources` (existente)
- **Funcionalidad Complementaria**: Ambos sistemas pueden funcionar en paralelo
- **Reutilización de Infraestructura**: Compartir Cloud Storage, Firestore, autenticación

**Garantías:**
- ✅ No modifica endpoints existentes
- ✅ No modifica esquemas de datos existentes
- ✅ No afecta funcionalidad actual
- ✅ Puede ser deshabilitado independientemente

---

## 📝 Notas Técnicas

### Consideraciones de Implementación

1. **Procesamiento Chunked**: Para archivos >20MB, dividir en secciones de ~12MB y procesar en paralelo
2. **Caching**: Cachear resultados de reconocimiento para documentos idénticos
3. **Rate Limiting**: Implementar límites de tasa para prevenir abuso
4. **Monitoring**: Logging detallado para debugging y análisis
5. **Error Recovery**: Reintentos automáticos con backoff exponencial

### Dependencias

- Google Gemini AI SDK (`@google/genai`)
- Google Cloud Storage SDK
- Google Cloud Firestore SDK
- Sistema de autenticación existente (OAuth 2.0)
- Sistema de multi-organización existente

---

**Última Actualización:** 2025-11-10  
**Versión del Documento:** 1.0.0  
**Estado:** 🚧 En Desarrollo  
**Próxima Revisión:** 2025-11-17

