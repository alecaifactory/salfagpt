# 🚀 Quick Start - Sistema de Persistencia

Guía rápida para empezar a usar el sistema de persistencia completa en Firestore.

---

## ⚡ Setup en 3 Pasos

### 1. Autenticación
```bash
gcloud auth application-default login
```

### 2. Crear Datos de Muestra
```bash
npm run seed:firestore
```

### 3. Iniciar Servidor
```bash
npm run dev
```

**¡Listo!** Abre http://localhost:3000/chat

---

## 🧪 Verificación Rápida

```bash
# Verificar que todo funciona
npm run verify:persistence
```

**Output esperado:**
```
✅ Verificaciones exitosas: 6
❌ Errores encontrados: 0
✨ ¡Sistema de persistencia funcionando correctamente!
```

---

## 🔗 URLs Útiles

### Firestore Console
Ver todos los datos en tiempo real:
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore

### Colecciones Principales
- **User Settings**: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fuser_settings
- **Agent Configs**: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fagent_configs
- **Conversation Context**: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fconversation_context
- **Usage Logs**: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fusage_logs

---

## 📊 Qué se Persiste

### ✅ User Settings (Configuración Global)
- Modelo preferido (Flash/Pro)
- System prompt personalizado
- Idioma

### ✅ Agent Config (Por Conversación)
- Modelo específico del agente
- System prompt del agente
- Temperatura y tokens máximos

### ✅ Conversation Context (Por Conversación)
- Fuentes de contexto activas
- Uso de ventana de contexto

### ✅ Workflow Config (Por Usuario)
- Configuración de workflows
- Preferencias de extracción

### ✅ Usage Logs (Por Usuario)
- Registro de todas las acciones
- Tracking de uso del sistema

---

## 🎯 Testing Básico

### Test 1: User Settings
1. Abrir http://localhost:3000/chat
2. Menú usuario → Configuración
3. Cambiar modelo a Pro
4. Guardar
5. Recargar página
6. ✅ Configuración se mantiene

### Test 2: Agent Config
1. Crear Agente 1 (con Flash)
2. Crear Agente 2 (con Pro)
3. Cambiar entre agentes
4. ✅ Cada uno mantiene su configuración

### Test 3: Conversation Context
1. En Agente 1: Activar contexto "Documento Demo"
2. Crear Agente 2 sin contexto
3. Volver a Agente 1
4. ✅ Contexto sigue activo

---

## 🐛 Troubleshooting

### Error de Autenticación
```bash
gcloud auth application-default login
gcloud config set project gen-lang-client-0986191192
```

### No Se Ven Datos
```bash
# Re-ejecutar seeding
npm run seed:firestore

# Verificar
npm run verify:persistence
```

### Servidor No Inicia
```bash
# Instalar dependencias
npm install

# Verificar .env
cat .env | grep GOOGLE_CLOUD_PROJECT
# Debe mostrar: GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192
```

---

## 📚 Documentación Completa

Para guía detallada con todos los tests:
- [Testing del Sistema de Persistencia](./TESTING_PERSISTENCE_SYSTEM.md)
- [Arquitectura de Firestore](./FIRESTORE_PERSISTENCE_SYSTEM.md)
- [Resumen Ejecutivo](../PERSISTENCIA_COMPLETA_RESUMEN.md)

---

## ✅ Checklist de Validación

- [ ] Autenticación con GCP funciona
- [ ] Script de seeding ejecutó exitosamente
- [ ] Verificación muestra 0 errores
- [ ] Servidor dev corre en localhost:3000
- [ ] User settings se guardan y cargan
- [ ] Agent configs persisten por conversación
- [ ] Conversation context se mantiene
- [ ] Firestore Console muestra los datos
- [ ] Campo `source` = "localhost" en todos los documentos

---

**¿Todo listo?** 🎉

¡El sistema está funcionando! Ahora puedes:
1. Crear y configurar agentes
2. Todas las configuraciones se guardan automáticamente
3. Los cambios persisten entre sesiones
4. Todo queda registrado en Firestore para análisis posterior

**Next Steps:** Probar en producción con `source: "production"` 🚀

