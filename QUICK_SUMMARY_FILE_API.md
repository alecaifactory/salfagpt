# ✅ Gemini File API - LISTO PARA PROBAR

## Qué se hizo (10 minutos)

1. ✅ Creado: `src/lib/gemini-file-upload.ts` (File API integration)
2. ✅ Modificado: `src/pages/api/extract-document.ts` (added option B)
3. ✅ Agregado: `ENABLE_GEMINI_FILE_API=true` en .env
4. ✅ Build exitoso
5. ✅ Commit: 259985b
6. ✅ Docs creados

## Cómo funciona

```
PDF >10MB + flag=true
  → 📤 Upload to Gemini File API
  → ⏳ Wait for ACTIVE
  → 📖 Extract with generateContent
  → 🗑️ Delete from Gemini
  → ✅ Return extracted text

Si falla → fallback automático a chunked ✅
Si flag=false → usa código existente ✅
```

## Cómo probar AHORA (2 min)

```bash
# 1. Verificar servidor corre
# localhost:3000 debería estar activo ✅

# 2. Abrir browser
http://localhost:3000/chat

# 3. Login y subir PDF Scania (13 MB)
Fuentes de Contexto → ➕ Agregar → 📄 Archivo → Flash → Upload

# 4. Ver consola browser (Cmd+Option+J)
Buscar logs: 📤 [File API] ...

# 5. Verificar extracción exitosa
Ver panel con PDF y texto extraído
```

## Qué esperar

✅ Console: `[File API]` logs (not Vision/chunked)  
✅ Time: ~18s (vs 45s antes)  
✅ Cost: ~$0.018 (vs $0.024)  
✅ Quality: Texto completo y coherente  

## Si no funciona

```bash
# Desactivar instantáneamente:
# En .env: ENABLE_GEMINI_FILE_API=false
# Restart: pkill -f "astro dev" && npm run dev
```

## Próximos pasos

1. Test con Scania PDF
2. Reportar resultados
3. Si funciona → probar otros 4 PDFs
4. Si todo ok → considerar flag=true por defecto

---

**¿Listo para probar? Ve a localhost:3000 y sube el PDF! 🚀**
