# Test Plan: Agent Sharing Force Share Flow

**Fecha:** 2025-11-12  
**Feature:** Forzar Compartir (SuperAdmin)  
**Status:** 🧪 Testing in progress

---

## 🧪 **PASO 3: TESTING END-TO-END**

### **Test 1: Compartir Sin Usuarios (Validación)**

**Objetivo:** Verificar que el sistema previene errores

**Pasos:**
1. Login como alec@getaifactory.com
2. Ve a GOP GPT M3
3. Click "Compartir"
4. NO selecciones ningún usuario
5. Click "Compartir Agente" (botón principal)

**Resultado Esperado:**
- ✅ Botón "Compartir Agente" está **DESHABILITADO** (gris)
- ✅ No se puede clickear
- ✅ No pasa nada

**Status:** ⏳ Pendiente

---

### **Test 2: Forzar Compartir Con Usuario (Happy Path)**

**Objetivo:** Verificar flujo completo funciona correctamente

**Setup:**
- Agent: GOP GPT M3
- Owner: alec@getaifactory.com
- Recipient: Nuevo usuario (crear test user si es necesario)

**Pasos:**
1. Login como alec@getaifactory.com
2. Ve a GOP GPT M3
3. Click "Compartir"
4. Busca usuario en la lista
5. ✅ **SELECCIONA** el checkbox del usuario
6. Verifica aparece en "Compartir con: 👤 [Usuario]"
7. Click "Compartir Agente" (botón azul principal)
8. Aparece diálogo naranja: "Agente Sin Evaluación Aprobada"
9. Click "3️⃣ Forzar Compartir (SuperAdmin)"

**Resultado Esperado - Durante:**
- ✅ Modal de aprobación PERMANECE abierto
- ✅ Muestra spinner: "🔵 Compartiendo agente..."
- ✅ Loading state visible 1-3 segundos

**Resultado Esperado - Después:**
- ✅ Muestra success (verde):
  ```
  ✅ COMPARTIDO EXITOSAMENTE (forzado por SuperAdmin)
  
  Usuarios con acceso ahora (X total):
  [email1], [email2], ...
  
  📋 Los shares se han actualizado...
  📧 Los usuarios receptores deben refrescar...
  
  ✅ Puedes cerrar este modal ahora.
  ```
- ✅ Modal de aprobación SIGUE abierto
- ✅ Footer dice: "✅ Compartición exitosa. Verifica la lista de Accesos Compartidos →"
- ✅ Botón dice: "Cerrar Ahora"
- ✅ Usuario puede clickear "Cerrar Ahora" cuando quiera

**Resultado Esperado - Verificación:**
- ✅ Click en "Cerrar Ahora" cierra el modal de aprobación
- ✅ Modal principal de "Compartir Agente" SIGUE abierto
- ✅ En el lado derecho: "Accesos Compartidos (X)" debe tener +1
- ✅ El nuevo usuario aparece en la lista
- ✅ Usuario puede clickear X o "Cerrar" del modal principal

**Status:** ⏳ Pendiente

---

### **Test 3: Verificar en Firestore**

**Objetivo:** Confirmar que share se creó en base de datos

**Comando:**
```bash
# Después del Test 2, ejecutar:
node -e "
const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore({ projectId: 'salfagpt' });

async function verify() {
  const snapshot = await firestore.collection('agent_shares')
    .where('agentId', '==', '5aNwSMgff2BRKrrVRypF')
    .get();
  
  console.log('Shares para GOP GPT M3:', snapshot.size);
  
  const now = Date.now();
  snapshot.forEach(doc => {
    const data = doc.data();
    const ageMin = (now - data.createdAt.toDate().getTime()) / (1000 * 60);
    
    if (ageMin < 5) {
      console.log('NUEVO SHARE:');
      console.log('  ID:', doc.id);
      console.log('  Usuarios:', data.sharedWith.length);
      console.log('  Creado hace:', Math.round(ageMin * 10) / 10, 'minutos');
    }
  });
}

verify().catch(console.error);
"
```

**Resultado Esperado:**
- ✅ Si se creó share nuevo: Aparece con edad < 5 minutos
- ✅ Si se actualizó share existente: updatedAt reciente
- ✅ sharedWith incluye el nuevo usuario

**Status:** ⏳ Pendiente

---

### **Test 4: Verificar Receptor Ve El Agente**

**Objetivo:** Confirmar que compartición funciona end-to-end

**Pasos:**
1. Nota el email del usuario con quien compartiste
2. Abre navegador en incognito
3. Login como ese usuario
4. Ve a /chat
5. Busca sección "Agentes Compartidos"

**Resultado Esperado:**
- ✅ Sección "Agentes Compartidos" visible en sidebar
- ✅ GOP GPT M3 aparece en la lista
- ✅ Badge "Compartido" visible
- ✅ Nivel de acceso correcto (Usar agente)
- ✅ Puede clickear y abrir el agente
- ✅ Puede enviar mensajes

**Status:** ⏳ Pendiente

---

### **Test 5: Refresh Button**

**Objetivo:** Verificar que botón de refresh funciona

**Pasos:**
1. Abre modal de compartir
2. Mira lista "Accesos Compartidos (X)"
3. Click en ícono 🔄 al lado del título
4. Observar

**Resultado Esperado:**
- ✅ Ícono gira (spinner animation)
- ✅ Lista se recarga desde Firestore
- ✅ Número de shares puede cambiar
- ✅ Nuevos shares agregados externamente aparecen

**Status:** ⏳ Pendiente

---

### **Test 6: Error Handling**

**Objetivo:** Verificar que errores se manejan gracefully

**Escenario 1: API Falla**
```
Simular: Apagar Firestore momentáneamente
Esperado:
- ✅ Modal permanece abierto
- ✅ Error visible: "Error al compartir: [detalle]"
- ✅ Botón "Cancelar" funciona
- ✅ Usuario puede retry
```

**Escenario 2: Compartir Sin Usuarios (ya validado)**
```
Esperado:
- ✅ Botón deshabilitado
- ✅ Mensaje claro de error si se intenta
- ✅ Instrucciones de qué hacer
```

**Status:** ⏳ Pendiente

---

## 📊 **Test Results Summary**

| Test | Status | Notas |
|------|--------|-------|
| Test 1: Sin usuarios | ⏳ Pending | Validación preventiva |
| Test 2: Happy path | ⏳ Pending | Flujo completo |
| Test 3: Firestore | ⏳ Pending | Verificar datos |
| Test 4: Receptor | ⏳ Pending | End-to-end |
| Test 5: Refresh | ⏳ Pending | Nueva feature |
| Test 6: Errors | ⏳ Pending | Edge cases |

---

## 🔧 **Testing Commands**

### **Verificar Share Creado:**
```bash
node scripts/verify-shared-agent-for-user.cjs <userEmail>
```

### **Ver Shares Recientes:**
```bash
node -e "
const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore({ projectId: 'salfagpt' });

async function recent() {
  const snapshot = await firestore.collection('agent_shares').get();
  const now = Date.now();
  
  snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(s => s.createdAt && (now - s.createdAt.toDate().getTime()) < 5*60*1000)
    .forEach(s => {
      console.log('Recent share:', s.id);
      console.log('  Agent:', s.agentId);
      console.log('  Users:', s.sharedWith.length);
    });
}

recent().catch(console.error);
"
```

---

**Próximo:** Ejecutar tests manualmente en UI  
**Requiere:** Navegador refrescado con nuevo código

