# Guía de Pruebas - Persistencia de Context Sources

## ✅ Funcionalidad Implementada

Tu sistema ahora guarda las fuentes de contexto (PDFs subidos) en Firestore, por lo que persisten al refrescar la página.

---

## 🧪 Cómo Probar

### Prueba 1: Subir PDF y Verificar Persistencia

**Pasos**:
1. Abre `http://localhost:3000/chat`
2. Click en "**+ Agregar**" en "Fuentes de Contexto" (sidebar izquierdo, abajo)
3. Selecciona un PDF (ej: CV Tomás Alarcón)
4. Espera a que termine la extracción (~15 segundos)
5. Verifica que aparece en la lista de fuentes

**Resultado esperado**:
- ✅ PDF aparece con nombre, tamaño, y páginas
- ✅ Toggle está activado (verde)
- ✅ Estado "Pendiente" con badges de validación

**Ahora refresca la página (F5 o Cmd+R)**

**Resultado esperado**:
- ✅ PDF sigue en la lista de fuentes
- ✅ Estado del toggle se mantiene
- ✅ Metadata sigue visible

---

### Prueba 2: Contexto Per-Agent

**Pasos**:
1. Con un PDF ya subido, envía una pregunta: "¿Quién es Tomás Alarcón?"
2. Verifica que el AI responde con información del PDF
3. Click en "**+ Nuevo Agente**" (crear otro agente)
4. Observa el panel de Fuentes de Contexto

**Resultado esperado**:
- ✅ En el **agente original**: PDF tiene toggle activado (verde)
- ✅ En el **nuevo agente**: PDF tiene toggle desactivado (gris)
- ✅ Cada agente mantiene su propia configuración de contexto

---

### Prueba 3: Toggle Persistence

**Pasos**:
1. En el nuevo agente, activa el toggle del PDF
2. Pregunta algo sobre el PDF
3. Verifica que el AI responde con contexto
4. Refresca la página
5. Vuelve al mismo agente

**Resultado esperado**:
- ✅ El toggle sigue activado
- ✅ Puedes seguir preguntando sobre el PDF
- ✅ El estado se mantiene entre sesiones

---

### Prueba 4: Múltiples Fuentes

**Pasos**:
1. Sube 2-3 PDFs diferentes
2. Activa solo 1 de ellos
3. Pregunta algo relacionado
4. Refresca la página

**Resultado esperado**:
- ✅ Todas las fuentes siguen en la lista
- ✅ Solo la que activaste sigue con toggle verde
- ✅ El contexto aplicado es el correcto

---

## 🔍 Verificación en Firestore

### Ver Fuentes Guardadas

```bash
# En terminal
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

async function check() {
  const snapshot = await firestore.collection('context_sources')
    .orderBy('addedAt', 'desc')
    .limit(10)
    .get();
  
  console.log('📚 Context Sources guardadas:', snapshot.size);
  console.log('');
  
  snapshot.docs.forEach((doc, idx) => {
    const data = doc.data();
    console.log(\`\${idx + 1}. \${data.name}\`);
    console.log(\`   ID: \${doc.id}\`);
    console.log(\`   Usuario: \${data.userId}\`);
    console.log(\`   Tipo: \${data.type}\`);
    console.log(\`   Enabled: \${data.enabled}\`);
    console.log(\`   Tamaño: \${(data.metadata?.originalFileSize / 1024).toFixed(2)} KB\`);
    console.log(\`   Páginas: \${data.metadata?.pageCount || 'N/A'}\`);
    console.log(\`   Modelo usado: \${data.metadata?.model || 'N/A'}\`);
    console.log(\`   Caracteres extraídos: \${data.extractedData?.length || 0}\`);
    console.log(\`   Source: \${data.source}\`);
    console.log('');
  });
  
  process.exit(0);
}

check();
"
```

### Ver Configuración de Contexto por Agente

```bash
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

async function check() {
  const snapshot = await firestore.collection('conversation_context')
    .limit(10)
    .get();
  
  console.log('🎯 Configuraciones de contexto por agente:', snapshot.size);
  console.log('');
  
  snapshot.docs.forEach((doc, idx) => {
    const data = doc.data();
    console.log(\`\${idx + 1}. Agente ID: \${doc.id}\`);
    console.log(\`   Fuentes activas: \${data.activeContextSourceIds?.length || 0}\`);
    console.log(\`   IDs: [\${data.activeContextSourceIds?.join(', ') || ''}]\`);
    console.log(\`   Uso de contexto: \${data.contextWindowUsage || 0}%\`);
    console.log('');
  });
  
  process.exit(0);
}

check();
"
```

---

## 🎯 Qué Esperar en la Consola del Navegador

Al refrescar la página, deberías ver en la consola:

```
📥 Cargando conversaciones desde Firestore...
⚙️ Cargando configuración del usuario desde Firestore...
📚 Cargando fuentes de contexto desde Firestore...
✅ 63 conversaciones cargadas desde Firestore
✅ Configuración del usuario cargada: gemini-2.5-flash
✅ 2 fuentes de contexto cargadas desde Firestore
🔄 Cambiando a conversación: TkTja0jguGPG7sc0ZpPA
⚙️ Cargando configuración del agente para conversación: TkTja0jguGPG7sc0ZpPA
✅ Configuración del agente cargada: gemini-2.5-flash
```

---

## 🐛 Qué Hacer si Algo Falla

### Si las fuentes no aparecen al refrescar

**Diagnóstico**:
```bash
# 1. Verificar que el índice existe y está READY
gcloud firestore indexes composite list --project=gen-lang-client-0986191192 | grep context_sources

# 2. Verificar datos en Firestore
# (usar comando de arriba)

# 3. Verificar endpoint
curl "http://localhost:3000/api/context-sources?userId=YOUR_USER_ID"
```

**Posibles causas**:
- ❌ Índice no está en estado READY (esperar 1-2 minutos)
- ❌ userId incorrecto en el request
- ❌ Firestore auth no configurado

### Si el toggle no persiste

**Diagnóstico**:
```bash
# Ver el valor actual en Firestore
# (usar comando de verificación arriba, buscar enabled: true/false)
```

**Posibles causas**:
- ❌ El endpoint PUT no está funcionando
- ❌ Error en red (ver consola)

### Si el PDF se procesa pero no se guarda

**Diagnóstico**:
Busca en la consola del navegador:
```
✅ Fuente de contexto guardada en Firestore: <ID>
```

Si no ves este mensaje:
- ❌ Error en `/api/context-sources` POST endpoint
- ❌ Error de permisos de Firestore

---

## 📋 Checklist de Funcionalidad

Después de tus pruebas, verifica que:

### Persistencia
- [ ] PDFs subidos persisten al refrescar
- [ ] Estado enabled/disabled persiste al refrescar
- [ ] Metadata (tamaño, páginas, modelo) persiste
- [ ] Configuración per-agent persiste

### Funcionalidad
- [ ] Puedes subir múltiples PDFs
- [ ] Cada PDF se procesa correctamente
- [ ] Toggles funcionan
- [ ] Contexto se aplica cuando enabled=true
- [ ] Contexto NO se aplica cuando enabled=false

### Multi-Agent
- [ ] Crear 2 agentes diferentes
- [ ] Activar PDF en agente 1
- [ ] Desactivar PDF en agente 2
- [ ] Refrescar → cada agente mantiene su configuración

### UI/UX
- [ ] Loading spinner durante extracción
- [ ] Progress bar visible
- [ ] Badge "Pendiente" visible
- [ ] Metadata visible en cada fuente
- [ ] Settings modal funciona (click en ⚙️)

---

## 🚀 Próximos Pasos

### Feature Pendiente: Público vs Privado

**Requirement del usuario**:
> "En la configuración del contenido subido, debemos poder indicar si queremos 
> que sea público (otros usuarios lo pueden seleccionar) o privado (solo visible 
> en el agente donde se subió)."

**Implementación propuesta**:
1. Agregar campo `visibility: 'private' | 'public'` a ContextSource
2. Agregar toggle en modal de subida
3. Modificar query para cargar fuentes públicas + propias
4. Badge visual para fuentes públicas
5. Permisos: solo owner/admin puede validar

**¿Implementar ahora?**
Si quieres que lo implemente, confirma y procedo.

---

## 📊 Estado del Sistema

```
✅ Firestore configurado correctamente
✅ 3 índices compuestos activos (conversations, messages, context_sources)
✅ Persistencia completa de:
   - Conversaciones
   - Mensajes  
   - Configuración de usuario
   - Configuración de agente
   - Fuentes de contexto
   - Estado de contexto por agente
✅ Backward compatible
✅ Sin errores en consola (excepto scripts de seed)
```

---

**Última actualización**: 2025-10-13 14:25  
**Estado**: ✅ Listo para Testing  
**Commit**: c03ae4c

