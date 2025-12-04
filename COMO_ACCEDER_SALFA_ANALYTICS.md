# 🚀 Cómo Acceder a SalfaCorp Analytics

## ✅ SÍ, Está Disponible en Localhost!

**URL:** http://localhost:3000/salfa-analytics  
**Status:** ✅ Servidor corriendo  
**Requiere:** Autenticación (login)

---

## 📋 Pasos para Acceder:

### 1. Servidor está corriendo ✅
```bash
# El servidor ya está activo en puerto 3000
# Si necesitas reiniciarlo:
cd /Users/alec/aifactory
npm run dev
```

### 2. Abrir en navegador:
```
http://localhost:3000/salfa-analytics
```

### 3. Login (si no has iniciado sesión):
La página redirigirá a `/auth/login` automáticamente

**Usuarios con acceso:**

✅ **SuperAdmin:**
- Email: alec@getaifactory.com
- Rol: superadmin
- Acceso: Completo

✅ **SalfaCorp Admin:**
- Email: sorellanac@salfagestion.cl
- Rol: admin
- Acceso: Datos de SalfaCorp

✅ **SalfaCorp Expert:**
- Email: fdiazt@salfagestion.cl
- Rol: expert
- Acceso: Solo lectura

### 4. Después de login:
Serás redirigido a `/chat` o puedes ir directamente a:
```
http://localhost:3000/salfa-analytics
```

---

## 🔐 Control de Acceso

### ✅ Tienen Acceso:

**SuperAdmin (cualquier dominio):**
- alec@getaifactory.com ✅

**SalfaCorp Admin/Expert (dominios permitidos):**
- @salfagestion.cl ✅
- @salfa.cl ✅
- @maqsa.cl ✅
- @salfacloud.cl ✅
- @novatec.cl ✅
- @inoval.cl ✅

### ❌ NO Tienen Acceso:

- Usuarios con rol 'user' (aunque sean de SalfaCorp)
- Usuarios de otros dominios
- Usuarios no autenticados

**Resultado:** HTTP 403 Forbidden

---

## 📊 Qué Verás en la Página

### Header:
- Título: "SalfaCorp Analytics"
- Badge con tu rol (👑 SuperAdmin / 🔑 admin / 🔑 expert)
- Botón "Volver al Chat"
- Botón "Exportar Datos"

### Sección de Filtros:
- **Agentes:** Dropdown (Todos / Producción / Privados / M3, S1, S2, M1)
- **Dominio:** Dropdown (Todos / Por dominio específico)
- **Período:** Dropdown (7 días / 30 días / Todo)
- **Buscar Usuario:** Input de búsqueda por email

### KPIs (4 cards):
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ Usuarios     │ Agentes en   │ Conver-      │
│ Mensajes     │ Activos      │ Producción   │ saciones     │
│    1,696     │      48      │       5      │     197      │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Agentes Principales (4 cards):
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   M3-v2     │   S1-v2     │   S2-v2     │   M1-v2     │
│   (Morado)  │   (Verde)   │   (Azul)    │  (Naranja)  │
│             │             │             │             │
│ 166 msg     │ 149 msg     │  92 msg     │  52 msg     │
│ 7 usuarios  │ 10 usuarios │ 4 usuarios  │ 5 usuarios  │
│ Comp: 14    │ Comp: 16    │ Comp: 11    │ Comp: 14    │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Gráficos (4 placeholders):
- Actividad Diaria
- Comparación de Agentes
- Patrones por Hora
- Distribución por Dominio

*Nota: Actualmente muestran "Cargando gráfico..." - siguiente paso es implementar Chart.js*

### Tabla: Top 10 Usuarios
Con nombre, email, dominio, mensajes, días activos

### Lista: Conversaciones Recientes
Últimas 20 conversaciones con agente, usuario, fecha, mensajes

---

## 🔧 Verificación Rápida

### Check 1: Servidor corriendo
```bash
curl -I http://localhost:3000/salfa-analytics
# Debe responder (302 o 200)
```

### Check 2: Archivo de datos existe
```bash
ls -lh public/data/analytics-complete.json
# Debe mostrar ~215 KB
```

### Check 3: Página carga
```
Abrir: http://localhost:3000/salfa-analytics
Debe: Redirigir a login o cargar la página (si ya tienes sesión)
```

---

## 📈 Datos Disponibles

**Período:** 30 días (Oct 31 - Nov 30, 2025)

**Totales:**
- 1,696 mensajes
- 48 usuarios activos
- 41 agentes (5 en producción)
- 197 conversaciones

**Los 4 Principales:**
- M3-v2: 166 mensajes, 7 usuarios
- S1-v2: 149 mensajes, 10 usuarios ⭐
- S2-v2: 92 mensajes, 4 usuarios
- M1-v2: 52 mensajes, 5 usuarios

**Granularidad:**
- ✅ Por día (48 registros día × agente × usuario)
- ✅ Por hora (79 registros hora × agente × usuario)
- ✅ Por conversación (197 chats listados)

---

## 🎯 Cómo Usar

### 1. Login:
```
http://localhost:3000/auth/login
→ Login con Google (alec@getaifactory.com)
```

### 2. Ir a Analytics:
```
http://localhost:3000/salfa-analytics
→ Página carga con datos
```

### 3. Explorar:
- Ver KPIs en el header
- Ver cards de los 4 agentes principales
- Scroll para ver tabla de usuarios
- Scroll para ver conversaciones recientes

### 4. Filtrar (siguiente paso):
- Seleccionar filtros
- Click "Aplicar Filtros"
- Todos los datos se actualizan

### 5. Exportar:
- Click "Exportar Datos"
- Descarga JSON con datos actuales

---

## 🔄 Actualizar Datos

Para generar datos más recientes:

```bash
# 1. Generar nuevo JSON
npx tsx scripts/export-complete-granular-data.ts --days=30

# 2. Copiar a public
cp exports/salfa-analytics/analytics-complete.json public/data/

# 3. Recargar página en el navegador
# (Cmd+R o F5)
```

---

## ✅ Resumen

**Pregunta:** "¿Esto está disponible en localhost?"

**Respuesta:** **SÍ!** ✅

**URL:** http://localhost:3000/salfa-analytics  
**Status:** Servidor corriendo ✅  
**Datos:** Cargados (215 KB) ✅  
**Requiere:** Login con cuenta autorizada ✅

**Siguiente paso:** Abrir el navegador y probar!

---

**🚀 LISTO PARA USAR EN LOCALHOST!**


