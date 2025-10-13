# React Hooks Error Fix - 2025-10-13

## 🐛 Problema

Al intentar login con un nuevo usuario (`hello@getaifactory.com`), la página `/chat` mostraba pantalla en blanco con errores de React:

```
TypeError: Cannot read properties of null (reading 'useState')
Warning: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

---

## 🔍 Diagnóstico

### Error 1: React en producción sin optimización
```
Uncaught Error: React is running in production mode, but dead code 
elimination has not been applied.
```

**Causa**: Build cache corrupto o desactualizado

### Error 2: Hooks inválidos
```
TypeError: Cannot read properties of null (reading 'useState')
at ChatInterfaceWorking (ChatInterfaceWorking.tsx:51:45)
```

**Causa**: React module es `null`, probablemente por:
- Build cache desactualizado
- Vite cache corrupto
- Astro cache corrupto

---

## ✅ Solución

### Limpiar todos los caches y rebuilds

```bash
# 1. Limpiar caches
rm -rf node_modules/.vite
rm -rf dist
rm -rf .astro

# 2. Reiniciar dev server
npm run dev
```

### Por qué funciona

**Vite cache** (`node_modules/.vite/`):
- Contiene módulos pre-bundled
- Puede quedar desincronizado con cambios
- Limpiar fuerza re-bundle

**Build output** (`dist/`):
- Contiene build anterior
- Puede tener referencias obsoletas
- Limpiar fuerza rebuild completo

**Astro cache** (`.astro/`):
- Contiene cache de rutas y componentes
- Puede tener estado corrupto
- Limpiar fuerza re-procesamiento

---

## 🔄 Cuándo Limpiar Cache

### Síntomas que requieren limpieza

✅ Limpiar cache si ves:
- "Invalid hook call" errors
- "Cannot read properties of null" en hooks
- "Multiple copies of React" warnings
- Pantalla en blanco sin errores obvios
- Cambios de código no reflejados
- Build funcionaba antes, ahora no

### Comando rápido

```bash
# One-liner para limpiar todo
rm -rf node_modules/.vite dist .astro && npm run dev
```

---

## 🚨 Prevención

### Cuándo hacer rebuild limpio

**SIEMPRE después de**:
1. Instalar/actualizar dependencias (`npm install`)
2. Cambiar configuración de Astro/Vite
3. Cambiar integrations
4. Errores extraños de React
5. Multiple copies warnings

**Comando preventivo**:
```bash
# Después de npm install
npm run dev -- --force
# o
rm -rf node_modules/.vite && npm run dev
```

---

## 🧪 Verificación

### Después de limpiar, verifica

```bash
# 1. Server inicia sin errores
npm run dev
# Esperado: astro  v5.14.1 ready in XXXms

# 2. Abrir http://localhost:3000/chat
# Esperado: UI carga correctamente

# 3. Verificar consola del navegador
# Esperado: Sin errores de React
# Esperado: Logs de carga normales

# 4. Login con nuevo usuario
# Esperado: Funciona correctamente
```

---

## 📋 Checklist de Troubleshooting

Si el problema persiste después de limpiar cache:

- [ ] Verificar versiones de React son consistentes
  ```bash
  npm list react react-dom
  # Esperado: Una sola versión, deduped
  ```

- [ ] Verificar no hay aliases conflictivos en vite
  ```bash
  cat vite.config.ts | grep alias
  # Esperado: Sin aliases de React
  ```

- [ ] Reinstalar dependencias
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

- [ ] Verificar que chat.astro usa client:only="react"
  ```typescript
  <ChatInterfaceWorking client:only="react" ... />
  ```

---

## ✅ Estado Esperado Después del Fix

```
✅ npm run dev inicia correctamente
✅ http://localhost:3000/chat carga sin errores
✅ Login con usuario nuevo funciona
✅ No hay errores de React en consola
✅ Hooks funcionan normalmente
✅ Data isolation verificable entre usuarios
```

---

**Fecha**: 2025-10-13  
**Problema**: React hooks error al login nuevo usuario  
**Solución**: Limpiar cache de Vite, dist y .astro  
**Estado**: ✅ Resuelto  
**Prevención**: Rebuild limpio después de cambios mayores

