# 🧪 Quick Test - Cerrar Modales con ESC y Click Fuera

**Tiempo:** 2 minutos  
**Servidor:** `http://localhost:3000`

---

## ✅ Test Rápido (30 segundos por modal)

### Test 1: User Settings Modal

**Pasos:**
1. **Login** en la aplicación
2. **Click** en tu nombre (esquina inferior izquierda)
3. **Click** en "Configuración"
4. **Modal abierto** ✅

**Probar:**
- **Presiona ESC** → ¿Se cierra? ✅
- **Abre de nuevo**
- **Click en el fondo oscuro** → ¿Se cierra? ✅
- **Abre de nuevo**
- **Click en el área blanca del modal** → ¿NO se cierra? ✅
- **Click en la X** → ¿Se cierra? ✅

---

### Test 2: Add Source Modal

**Pasos:**
1. En la sección "Fuentes de Contexto" (sidebar)
2. **Click** en "+ Agregar"
3. **Modal abierto** ✅

**Probar:**
- **ESC** → cierra ✅
- **Click fuera** → cierra ✅
- **Click dentro** → NO cierra ✅

---

### Test 3: User Management (Admin)

**Pasos:**
1. **Click** en tu nombre
2. **Click** en "User Management"
3. **Modal abierto** ✅

**Probar:**
- **ESC** → cierra ✅
- **Click fuera** → cierra ✅

---

### Test 4: Create User Sub-Modal (Admin)

**Pasos:**
1. En User Management
2. **Click** en "+ Crear Usuario"
3. **Sub-modal abierto** ✅

**Probar:**
- **ESC** → cierra solo el sub-modal ✅
- **Click fuera** → cierra solo el sub-modal ✅
- **User Management sigue abierto** ✅

---

## ✅ Criterios de Éxito

Para cada modal:
- [ ] ESC cierra el modal
- [ ] Click fuera (backdrop) cierra el modal
- [ ] Click dentro (área blanca) NO cierra
- [ ] Click en X cierra el modal
- [ ] Comportamiento consistente

---

## 📊 Modales a Probar (13 total)

### Principales:
- [ ] UserSettingsModal
- [ ] AddSourceModal
- [ ] WorkflowConfigModal
- [ ] UserManagementPanel
- [ ] DomainManagementModal
- [ ] ContextManagementDashboard
- [ ] ContextSourceSettingsModal
- [ ] ContextDetailModal
- [ ] ShareSourceModal
- [ ] CreateGroupModal
- [ ] AssignAccessModal

### Sub-modales:
- [ ] CreateUserModal (dentro de UserManagement)
- [ ] BulkCreateUsersModal (dentro de UserManagement)

---

## 🎯 Quick Test (Solo 3 Modales)

Si tienes poco tiempo, prueba solo estos 3:

1. **User Settings** (más común)
2. **Add Source** (más usado)
3. **Create User** (para verificar sub-modales)

**Si estos 3 funcionan, los demás deberían funcionar también** (usan el mismo hook).

---

## 🔍 Logs a Verificar

**Abre DevTools → Console**

Al presionar ESC:
```
🔑 ESC pressed - closing modal
```

Al hacer click fuera:
```
🖱️ Click outside modal - closing
```

---

## ✅ Si Todo Funciona

**Confirma:** "modals work" o "funciona"

**Procederé a:**
- ✅ Git commit con todos los cambios
- ✅ Resumen final de sesión

---

**Toma ~2 minutos probar 3 modales. ¿Funciona correctamente?** 🚀

