# ✅ Testing Checklist Simple - Validar Fix Numeración

**URL:** http://localhost:3000/chat  
**Tiempo:** 5-10 minutos  
**Status:** Ready to test

---

## 🧪 Test A - S001

### **Pasos:**
1. Login → Agentes → S001 (Gestión Bodegas)
2. Nuevo Chat
3. Preguntar: **"¿Cómo genero el informe de consumo de petróleo?"**

### **Verificar en LOGS del servidor:**
```
Buscar en terminal:
✅ "CONSOLIDATED: 3 documents (from 10 chunks)"
✅ "[1] I-006 - 80.0% avg (6 chunks consolidated)"
✅ "[2] PP-009 - 81.0% avg (2 chunks consolidated)"
```

### **Verificar en RESPUESTA:**
```
✅ Badges visibles: [1][2][3]
✅ Texto menciona: Solo [1], [2], o [3]
✅ NO aparece: [4][5][7][8][10]
✅ PP-009: Presente en Referencias
✅ Pasos SAP: ZMM_IE mencionado
```

### **Resultado:**
- [ ] ✅ PASS - Números coinciden
- [ ] ❌ FAIL - Aún aparece [7][8]

---

## 🧪 Test B - M001

### **Pasos:**
1. Agentes → M001 (Asistente Legal)
2. Nuevo Chat
3. Preguntar: **"¿Cómo hago un traspaso de bodega?"**

### **Verificar en LOGS:**
```
✅ "CONSOLIDATED: N documents (from M chunks)"
```

### **Verificar en RESPUESTA:**
```
✅ Badges visibles: Cuenta total (ej: 4)
✅ Texto menciona: Solo números ≤ total badges
✅ NO aparece: Números > total badges
✅ Fragmentos: Útiles (NO "INTRODUCCIÓN...")
```

### **Resultado:**
- [ ] ✅ PASS - Números coinciden
- [ ] ❌ FAIL - Phantom refs presentes

---

## 📋 Checklist Final

### **Si AMBOS Tests ✅ PASS:**
```
→ Fix funciona perfectamente
→ Enviar mensaje a Sebastian
→ Esperar validación (10-15 mins)
→ Cerrar 5 tickets
```

### **Si ALGUNO ❌ FAIL:**
```
→ Tomar screenshot
→ Copiar logs del servidor
→ Copiar respuesta completa
→ Debugging inmediato
→ Re-validar antes de enviar a Sebastian
```

---

## 🚀 Quick Commands

```bash
# Ver logs del servidor
# (en terminal donde corre npm run dev)

# Reiniciar si necesario
pkill -f "npm run dev"
cd /Users/alec/salfagpt
npm run dev

# Ver último commit
git log --oneline -1
# Debe mostrar: 8e56783 fix(rag): Permanent fix...
```

---

**SIMPLE Y DIRECTO** ✅

**Test A:** S001 - Números coinciden  
**Test B:** M001 - Números coinciden  
**Tiempo:** 5-10 mins  
**Next:** Enviar a Sebastian










