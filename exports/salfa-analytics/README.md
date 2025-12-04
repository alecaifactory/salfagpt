# 📊 Exportación SalfaGPT - Dashboard de Métricas

**Generado:** 29-11-2025, 11:09:24 a. m.  
**Período:** 2025-09-01 → 2025-11-30 (90 días)  
**Total Mensajes:** 2,076  
**Preguntas de Usuarios:** 1,056  
**Respuestas de Asistentes:** 1,020  
**Usuarios Activos:** 49  
**Agentes Activos:** 41

---

## 📁 Archivos Incluidos

Siguiendo el esquema exacto de `instrucciones_exportacion_salfagpt.md`:

### 1. **user_engagement.csv**
**Propósito:** Actividad de usuarios  
**Columnas:**
- `User_ID`: ID único del usuario
- `User_Email`: Correo electrónico
- `User_Name`: Nombre completo
- `Domain`: Dominio del correo (ej: salfagestion.cl)
- `Total_Messages`: Cantidad total de mensajes
- `User_Questions`: Cantidad de preguntas realizadas
- `Assistant_Responses`: Respuestas recibidas
- `Days_Active`: Días únicos de actividad

**Registros:** 49 usuarios

---

### 2. **agent_performance.csv**
**Propósito:** Rendimiento de asistentes  
**Columnas:**
- `Agent_ID`: ID del agente
- `Agent_Title`: Nombre del asistente
- `Owner_Email`: Creador del asistente
- `Total_Messages`: Total de interacciones
- `Unique_Users`: Usuarios únicos que lo han usado
- `Avg_Messages_Per_User`: Promedio de uso

**Registros:** 41 agentes

---

### 3. **daily_activity.csv**
**Propósito:** Actividad diaria  
**Columnas:**
- `Date`: Fecha (YYYY-MM-DD)
- `Total_Messages`: Total del día
- `Active_Agents`: Cantidad de agentes usados
- `Unique_Users`: Cantidad de usuarios activos

**Registros:** 90 días

---

### 4. **kpis_summary.csv**
**Propósito:** Resumen ejecutivo  
**Columnas:**
- `Metric`: Nombre de la métrica
- `Value`: Valor numérico
- `Period_Start`: Fecha inicio
- `Period_End`: Fecha fin

**Registros:** 8 métricas clave

---

## 📊 Cómo Importar a Excel

1. Abrir Excel
2. **Datos** → **Obtener datos** → **Desde archivo** → **Desde texto/CSV**
3. Seleccionar archivo CSV
4. **Delimitador:** Coma
5. **Codificación:** UTF-8
6. Cargar

---

## 📈 Análisis Recomendados

### Tabla Dinámica 1: Top 10 Usuarios Activos
- **Fuente:** `user_engagement.csv`
- **Filas:** User_Email
- **Valores:** SUMA de Total_Messages
- **Ordenar:** Descendente
- **Filtro:** Top 10

### Tabla Dinámica 2: Rendimiento de Asistentes
- **Fuente:** `agent_performance.csv`
- **Filas:** Agent_Title
- **Valores:** Total_Messages, Unique_Users
- **Ordenar:** Por Total_Messages descendente

### Gráfico 1: Actividad Diaria
- **Fuente:** `daily_activity.csv`
- **Tipo:** Gráfico de líneas
- **Eje X:** Date
- **Eje Y:** Total_Messages
- **Serie 2:** Unique_Users (eje secundario)

### Gráfico 2: Distribución por Hora
- Usar archivo completo de exportación anterior
- Ver `4_hourly_distribution_2025-11-28.csv`

---

## 🔄 Re-generar Exportación

Para actualizar los datos:

```bash
# Últimos 90 días (default)
npx tsx scripts/export-salfagpt-dashboard.ts

# Últimos 30 días
npx tsx scripts/export-salfagpt-dashboard.ts --days=30

# Últimos 7 días
npx tsx scripts/export-salfagpt-dashboard.ts --days=7

# Directorio personalizado
npx tsx scripts/export-salfagpt-dashboard.ts --output-dir=./mi-carpeta
```

---

## 📧 Notas Importantes

- **Esquema:** Sigue exactamente `instrucciones_exportacion_salfagpt.md`
- **Formato:** CSV compatible con Excel/Google Sheets
- **Codificación:** UTF-8 con BOM para compatibilidad
- **Separador:** Coma (,)
- **Texto:** Entrecomillado cuando contiene comas o comillas

---

## 📞 Soporte

**Preguntas sobre los datos:**
- Revisar este README
- Contacto: alec@getaifactory.com

**Necesitas otras métricas:**
- Modificar `scripts/export-salfagpt-dashboard.ts`
- Agregar nuevas funciones de exportación

---

**Generado por:** SalfaGPT Analytics System  
**Script:** `scripts/export-salfagpt-dashboard.ts`  
**Versión:** 1.0.0
