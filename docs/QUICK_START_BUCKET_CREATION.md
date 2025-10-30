# ⚡ Quick Start: Crear Bucket en 2 Minutos

**Status:** ⏳ Requiere acción manual  
**Tiempo:** 2 minutos  
**Bloqueador:** Permisos de cuenta

---

## 🎯 Paso a Paso (Super Rápido)

### 1️⃣ Abrir Cloud Console

**Link directo:**
```
https://console.cloud.google.com/storage/create-bucket?project=gen-lang-client-0986191192
```

👆 **Click aquí** (abrirá en tu navegador)

---

### 2️⃣ Completar el Formulario

**Solo 4 campos:**

1. **Name your bucket:**
   ```
   gen-lang-client-0986191192-agent-setup-docs
   ```
   *(Copy & paste exacto)*

2. **Choose where to store your data:**
   - Select: `Region`
   - Location: `us-central1 (Iowa)`

3. **Choose a storage class:**
   - Select: `Standard`

4. **Choose how to control access:**
   - Select: `Enforce public access prevention`
   - Access control: `Fine-grained`

---

### 3️⃣ Click "CREATE"

✅ Done!

---

## ✅ Verificación (30 segundos)

Después de crear, verifica que funciona:

```bash
# En terminal:
gsutil ls gs://gen-lang-client-0986191192-agent-setup-docs

# Debe mostrar:
# (vacío - está listo para usar)
```

**O en navegador:**
```
https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-agent-setup-docs?project=gen-lang-client-0986191192
```

---

## 🚀 Después de Crear

**Inmediatamente puedes:**

1. Refresh localhost:3000/chat
2. Seleccionar agente
3. Click "Configurar Agente"
4. Tab "Mejorar Prompt"
5. Subir "Ficha de Asistente Virtual.pdf"
6. Click "Generar Prompt Mejorado"
7. ✨ Funciona!

---

## 🆘 Si Tienes Problemas

### Error: "Permission denied"

**Solución:** Asegúrate de estar logueado con `alec@getaifactory.com` (owner del proyecto)

1. En Cloud Console, click en tu perfil (arriba derecha)
2. Verifica que dice "alec@getaifactory.com"
3. Si no, cambia de cuenta
4. Intenta crear el bucket nuevamente

---

### Error: "Bucket name already exists"

**Solución:** ¡Perfecto! Alguien ya lo creó. Ya está listo para usar.

---

## 📊 Costo

**$0.00** (casi gratis)

- Storage: $0.020/GB/month
- 100 documentos @ 1MB = 100MB = **$0.002/month**
- Operaciones: $0.005/1,000 ops = despreciable

**Total:** Menos de 1 centavo al mes.

---

**TODO:** Abre el link, crea el bucket, y listo para usar. 🎉

**Link:**
👉 https://console.cloud.google.com/storage/create-bucket?project=gen-lang-client-0986191192

