# 📊 Datos Exportados para Dashboard SalfaGPT

**Ubicación:** `/Users/alec/aifactory/exports/salfa-analytics/`  
**Período:** 90 días (Sep 1 - Nov 30, 2025)  
**Generado:** 29 de noviembre, 2025

---

## ✅ Archivos Principales (Según Instrucciones)

### 🎯 Los 4 Archivos Solicitados:

1. ✅ **user_engagement.csv** (49 usuarios)
2. ✅ **agent_performance.csv** (772 agentes)
3. ✅ **daily_activity.csv** (90 días)
4. ✅ **kpis_summary.csv** (8 métricas)

**Esquema:** Sigue EXACTAMENTE `instrucciones_exportacion_salfagpt.md`

---

## 📈 Resumen de Datos (90 días)

```
┌─────────────────────────────────────────┐
│  TOTAL MENSAJES:        2,076           │
│  PREGUNTAS USUARIOS:    1,056           │
│  RESPUESTAS IA:         1,020           │
│  USUARIOS ACTIVOS:         49           │
│  AGENTES ACTIVOS:         772           │
│  PROMEDIO/USUARIO:      42.4 mensajes   │
└─────────────────────────────────────────┘
```

---

## 👥 Top 5 Usuarios Más Activos

| # | Usuario | Mensajes | Días Activos |
|---|---------|----------|--------------|
| 1 | alec@getaifactory.com | 680 | 15 |
| 2 | alec@getaifactory.com (ID2) | 285 | 14 |
| 3 | sorellanac@salfagestion.cl | 186 | 17 |
| 4 | fdiazt@salfagestion.cl | 140 | 15 |
| 5 | alecdickinson@gmail.com | 106 | 9 |

---

## 🤖 Top 5 Agentes Más Usados

| # | Agente | Mensajes | Usuarios |
|---|--------|----------|----------|
| 1 | SSOMA | 32 | 1 |
| 2 | Nuevo Chat | 24 | 1 |
| 3 | Proyectos evaluación ambiental | 22 | 1 |
| 4 | Información general | 20 | 1 |
| 5 | Nueva Conversación | 18 | 1 |

---

## 📊 Uso de Archivos por Requisito

### Para Dashboard (según RF):

**KPIs Section (RF-03):**
→ Usar: `kpis_summary.csv`
```
Total Messages: 2,076
Total Conversations: 772
Active Users: 49
```

**Top 10 Users Table (RF-05.1):**
→ Usar: `user_engagement.csv` (ya ordenado por Total_Messages)
```
Tomar primeras 10 filas
Columnas: User_Email, User_Name, Total_Messages
```

**Activity Chart (RF-04.1):**
→ Usar: `daily_activity.csv`
```
Gráfico de líneas
X: Date
Y: Total_Messages
```

**Messages by Assistant (RF-04.2):**
→ Usar: `agent_performance.csv`
```
Gráfico de barras
Top 15 agentes
X: Agent_Title
Y: Total_Messages
```

---

## 🔧 Cómo Usar en Excel

### Paso 1: Importar CSV
```
1. Abrir Excel
2. Datos → Obtener datos → Desde texto/CSV
3. Seleccionar archivo
4. Delimitador: Coma
5. Codificación: UTF-8
6. Cargar
```

### Paso 2: Crear Tabla Dinámica
```
1. Insertar → Tabla dinámica
2. Configurar según recomendaciones
3. Crear gráfico
```

### Paso 3: Dashboard
```
1. Nueva hoja "Dashboard"
2. Copiar/pegar gráficos y tablas
3. Formato profesional
4. Actualizar cuando haya nuevos datos
```

---

## 📁 Archivos Adicionales (Bonus)

También incluí archivos complementarios de la exportación anterior:

- `1-7_*.csv` - Versión extendida con más columnas
- `COPY_THIS_PROMPT.txt` - Prompt para Gemini AI Studio
- `QUICK_VIEW.md` - Vista rápida de los datos
- `EXPORT_SUMMARY.md` - Documentación completa

**Usa los 4 archivos principales (sin números)** para seguir las instrucciones exactas.

---

## 🔄 Actualizar Datos

Para generar nuevos exports:

```bash
# Últimos 90 días (default)
npx tsx scripts/export-salfagpt-dashboard.ts

# Últimos 30 días
npx tsx scripts/export-salfagpt-dashboard.ts --days=30

# Últimos 7 días  
npx tsx scripts/export-salfagpt-dashboard.ts --days=7

# Guardar en otra carpeta
npx tsx scripts/export-salfagpt-dashboard.ts --output-dir=./nueva-carpeta
```

---

## ✅ Archivos Listos Para:

**Excel/Google Sheets:**
- ✅ Importar directamente
- ✅ Crear tablas dinámicas
- ✅ Generar gráficos
- ✅ Análisis personalizado

**Dashboard Web:**
- ✅ Cargar via API
- ✅ Parsear en frontend
- ✅ Visualizar con Chart.js/Recharts
- ✅ Filtrar dinámicamente

**Gemini AI Studio:**
- ✅ Usar `COPY_THIS_PROMPT.txt`
- ✅ Adjuntar CSVs principales
- ✅ Generar código completo dashboard

---

## 📞 Soporte

**Contacto:** alec@getaifactory.com  
**Documentación completa:** Ver `EXPORT_SUMMARY.md`  
**Script fuente:** `scripts/export-salfagpt-dashboard.ts`

---

**✅ DATOS EXPORTADOS SIGUIENDO INSTRUCCIONES EXACTAS!**

Período: 90 días | 2,076 mensajes | 49 usuarios | 772 agentes


