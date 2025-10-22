# Guía Rápida: Sistema de Grupos y Compartir Agentes

**Fecha**: 2025-10-21  
**Para**: Administradores de Flow Platform

---

## 🚀 Inicio Rápido

### 1. Crear un Grupo (5 minutos)

```
1. Login como admin
2. Click "Admin" en menú izquierdo
3. Click tab "Grupos"
4. Click "Gestionar Grupos"
5. Click "Crear Grupo"
6. Completar:
   ✏️ Nombre: "Equipo Legal"
   ✏️ Tipo: "team"
   ✅ Seleccionar miembros (checkboxes)
7. Click "Crear Grupo"
8. ✅ Listo! Grupo creado
```

---

### 2. Compartir un Agente (3 minutos)

```
1. En lista de agentes (sidebar izquierdo)
2. Hover sobre un agente
3. Click icono 🔗 "Compartir" (verde)
4. Modal se abre
5. Tab "Grupos" o "Usuarios"
6. Buscar y seleccionar targets
7. Elegir nivel de acceso:
   👁️ Solo ver (view)
   ✏️ Editar (edit)
   🛡️ Admin (admin)
8. (Opcional) Establecer expiración
9. Click "Compartir Agente"
10. ✅ Listo! Agente compartido
```

---

### 3. Ver Agentes Compartidos (Usuario)

```
1. Login como usuario normal
2. Lista de agentes muestra:
   • Tus agentes (sin badge)
   • Agentes compartidos contigo [Compartido]
3. Click en agente compartido
4. ✅ Funciona igual que tus agentes
   (con restricciones según nivel de acceso)
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Departamento con Agente Especializado

**Situación**: Departamento Legal necesita un agente entrenado en leyes chilenas

**Solución**:
```
1. Crear grupo "Legal"
2. Agregar 5 abogados al grupo
3. Crear agente "Asistente Legal"
4. Entrenar con documentos legales
5. Compartir con grupo "Legal" - Nivel: Editar
6. ✅ Los 5 abogados pueden usar el agente
```

**Beneficios**:
- ✅ Conocimiento centralizado
- ✅ Consistencia en respuestas
- ✅ Fácil agregar/remover acceso
- ✅ Control de versión (solo admin edita config)

---

### Caso 2: Proyecto Temporal con Consultor

**Situación**: Consultor externo necesita acceso temporal

**Solución**:
```
1. NO crear grupo (es solo 1 persona)
2. Compartir directamente con usuario
3. Nivel: Solo ver
4. Expiración: 30 días
5. ✅ Consultor puede revisar pero no modificar
```

**Beneficios**:
- ✅ Acceso granular (solo ver)
- ✅ Expiración automática
- ✅ No contamina grupos permanentes
- ✅ Fácil revocar si se necesita antes

---

### Caso 3: Equipo Multifuncional

**Situación**: Proyecto requiere ingenieros + gerentes + finanzas

**Solución**:
```
1. Crear grupo "Proyecto Minería Q1"
2. Agregar:
   - 3 ingenieros
   - 2 gerentes
   - 1 CFO
3. Compartir agente "Análisis Minería"
4. Nivel: Editar (todos pueden usar)
5. ✅ Colaboración sin crear cuentas especiales
```

---

## 📊 Niveles de Acceso Explicados

### 👁️ Solo Ver (view)

**Puede hacer**:
- ✅ Ver lista de mensajes
- ✅ Leer conversaciones históricas
- ✅ Ver configuración del agente

**NO puede hacer**:
- ❌ Enviar mensajes nuevos
- ❌ Modificar configuración
- ❌ Compartir con otros
- ❌ Eliminar agente

**Uso**: Consultores, auditores, revisores

---

### ✏️ Editar (edit)

**Puede hacer**:
- ✅ Todo de "view"
- ✅ Enviar mensajes
- ✅ Usar el agente normalmente

**NO puede hacer**:
- ❌ Modificar configuración del agente
- ❌ Compartir con otros
- ❌ Eliminar agente

**Uso**: Miembros del equipo, colaboradores activos

---

### 🛡️ Admin (admin)

**Puede hacer**:
- ✅ Todo de "edit"
- ✅ Modificar configuración
- ✅ Compartir con otros
- ✅ Revocar accesos
- ✅ Eliminar agente

**NO puede hacer**:
- ❌ Cambiar ownership (siempre del creador original)

**Uso**: Líderes de equipo, administradores delegados

---

## 🔧 Gestión de Grupos

### Ver Grupos Existentes

```
Admin Panel → Tab "Grupos" → "Gestionar Grupos"
```

Lista muestra:
- Nombre del grupo
- Tipo (Departamento, Equipo, Proyecto, Personalizado)
- Cantidad de miembros
- Fecha de creación

---

### Editar Grupo

```
1. Click en grupo de la lista
2. Panel derecho muestra detalles
3. Click icono ✏️ (editar)
4. Modificar nombre, descripción, tipo
5. Guardar
```

---

### Agregar/Remover Miembros

```
1. Seleccionar grupo
2. Panel derecho muestra miembros actuales
3. Para agregar:
   • Click "+ Agregar Miembro"
   • Seleccionar usuario de lista
4. Para remover:
   • Click icono "➖" al lado del miembro
5. ✅ Cambios se guardan inmediatamente
```

---

### Eliminar Grupo

```
1. Seleccionar grupo
2. Click icono 🗑️ (eliminar)
3. Confirmar
4. ⚠️ Los shares existentes se mantienen
5. ✅ Grupo eliminado
```

---

## 🔐 Seguridad y Privacidad

### Quién Puede Hacer Qué

| Acción | Admin | Expert | User |
|--------|-------|--------|------|
| Crear grupos | ✅ | ❌ | ❌ |
| Ver todos los grupos | ✅ | ❌ | ❌ |
| Ver grupos propios | ✅ | ✅ | ✅ |
| Compartir agentes | ✅ (cualquier agente) | ✅ (propios) | ✅ (propios) |
| Revocar shares | ✅ (cualquiera) | ✅ (propios) | ✅ (propios) |

---

### Auditoría

**Qué se registra**:
- ✅ Creación de grupos (quién, cuándo)
- ✅ Cambios en miembros (agregados/removidos)
- ✅ Shares creados (agente, targets, nivel)
- ✅ Shares revocados
- ✅ Accesos via shares (en usage_logs)

**Dónde ver**:
- Firestore Console → Collection `groups`
- Firestore Console → Collection `agent_shares`
- Analytics Dashboard (futuro)

---

## 💡 Tips y Best Practices

### ✅ DO's

1. **Usa grupos para equipos permanentes**
   - Departamentos
   - Equipos estables
   - Divisiones de empresa

2. **Comparte directamente para accesos temporales**
   - Consultores externos
   - Accesos de emergencia
   - Pruebas

3. **Establece expiración para proyectos**
   - Proyectos con fecha de fin
   - Consultorías limitadas
   - Accesos de prueba

4. **Usa nivel "view" por defecto**
   - Más seguro
   - Puedes subir a "edit" después
   - Evita modificaciones accidentales

5. **Documenta en descripción del grupo**
   - Propósito del grupo
   - Criterios de membresía
   - Responsable del grupo

---

### ❌ DON'Ts

1. **No uses grupos para 1 persona**
   → Compartir directamente es más simple

2. **No des "admin" sin necesidad**
   → Puede eliminar el agente accidentalmente

3. **No olvides revocar accesos**
   → Revisar shares periódicamente

4. **No mezcles permanente con temporal**
   → Grupo "Legal" ✅
   → Grupo "Legal + Consultor Enero" ❌

5. **No crees grupos duplicados**
   → Verificar antes de crear

---

## 🐛 Troubleshooting

### Usuario no ve agente compartido

**Verifica**:
1. Usuario está en el grupo? → Gestionar Grupos
2. Grupo está activo? → isActive = true
3. Share existe? → Ver shares del agente
4. Share no expiró? → Revisar expiresAt
5. Usuario hizo refresh? → F5

---

### No puedo compartir agente

**Causas**:
1. No eres dueño del agente → Solo dueño puede compartir
2. Agente ya compartido contigo → Badge "Compartido" indica que no eres dueño
3. No hay grupos creados → Crear grupo primero

---

### Grupo no se puede eliminar

**Solución**:
- Aceptar confirmación en diálogo
- Si persiste, verificar shares activos
- Revocar shares primero, luego eliminar grupo

---

## 📞 Soporte

### Preguntas Frecuentes

**P: ¿Puedo compartir con grupos Y usuarios a la vez?**  
R: Sí! En un solo share puedes incluir múltiples grupos y usuarios.

**P: ¿Qué pasa si usuario está en 2 grupos con diferente acceso?**  
R: Se usa el nivel MÁS ALTO. Ejemplo: view + admin = admin.

**P: ¿Los agentes compartidos usan mi contexto o el del dueño?**  
R: Usa el contexto configurado por el dueño. No puedes modificarlo (a menos que tengas nivel "admin").

**P: ¿Puedo ver quién tiene acceso a mi agente?**  
R: Sí! Click "Compartir" → Panel derecho muestra todos los accesos.

**P: ¿Cuántos usuarios puedo agregar a un grupo?**  
R: Técnicamente ilimitado, recomendado <50 para mejor rendimiento.

---

### Contacto

**Desarrollador**: alec@getaifactory.com  
**Documentación Técnica**: `docs/USER_GROUPS_SHARING_SYSTEM.md`  
**Código**: `src/components/GroupManagementPanel.tsx`

---

**Última Actualización**: 2025-10-21  
**Versión**: 1.0.0

---

## ✨ Próximas Funcionalidades

- [ ] Notificaciones cuando te comparten un agente
- [ ] Dashboard de agentes compartidos
- [ ] Transferir ownership de agente
- [ ] Compartir carpetas completas
- [ ] Templates de grupos comunes

