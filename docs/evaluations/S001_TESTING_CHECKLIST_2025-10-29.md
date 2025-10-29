# ✅ S001 Testing Checklist - Quick Reference

**Agent:** S001 - GESTION BODEGAS GPT  
**URL:** http://localhost:3000/chat  
**Login:** alec@getaifactory.com  
**Date:** 2025-10-29

---

## 🚀 Quick Start

1. Open browser: http://localhost:3000/chat
2. Login with Google OAuth
3. Click on "GESTION BODEGAS GPT (S001)" agent
4. Click "+ Nuevo Chat" for each question
5. Copy-paste questions below
6. Verify: No phantom refs, good quality

---

## ✅ PHASE 1: CRITICAL (9 questions) - Test These First!

### Códigos y Catálogos

- [ ] **Q001** - ¿Dónde busco los códigos de materiales?
  - Expected: SAP transaction, material catalog
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

### Procedimientos SAP

- [ ] **Q002** - ¿Cómo hago una pedido de convenio?
  - Expected: SAP procedure, step-by-step
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

### Inventarios

- [ ] **Q008** - ¿Cuál es el calendario de inventarios para el PEP?
  - Expected: Schedule, dates, PEP calendar
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

### Guías de Despacho

- [ ] **Q009** - ¿Cómo genero una guía de despacho?
  - Expected: SAP procedure, GD steps
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

- [ ] **Q052** - ¿Cómo puedo generar una guía de despacho? (duplicate check)
  - Expected: Same as Q009, verify consistency
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

### Transporte

- [ ] **Q011** - ¿Qué es una ST?
  - Expected: Definition (Solicitud Transporte), format
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

- [ ] **Q012** - ¿Qué es una SIM?
  - Expected: Definition (Solicitud Interna Materiales)
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

### Traspasos

- [ ] **Q058** - ¿Cómo se realiza un traspaso de bodega?
  - Expected: Complete procedure, SAP, emails
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

### Documentación

- [ ] **Q063** - ¿Cómo encuentro un Procedimiento, Instructivo o Paso a Paso?
  - Expected: SharePoint, search method, doc types
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

**Phase 1 Progress:** __/9 complete (__%)  
**Average Quality:** __.__/10  
**Phantom Refs Found:** __

---

## ✅ PHASE 2: HIGH Priority Sample (15 selected from 24)

### Códigos y Catálogos (2)

- [ ] **Q006** - ¿Dónde busco los códigos de los diferentes tipos de servicios?
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

- [ ] **Q007** - ¿Dónde busco los códigos de los diferentes tipos de equipo?
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

### Procedimientos SAP (5)

- [ ] **Q023** - ¿Cómo puedo generar una solicitud de materiales?
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

- [ ] **Q024** - ¿Cómo puedo generar una compra por convenio?
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

- [ ] **Q027** - ¿Cómo se realiza la solicitud de "servicios"
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

- [ ] **Q031** - ¿Cómo solicito la creación de Proveedores?
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

- [ ] **Q034** - ¿Cómo solicito la creación de un código de material?
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

### Combustible (1)

- [ ] **Q003** - ¿Cuándo debo enviar el informe de consumo de petróleo?
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

### Transporte (2)

- [ ] **Q010** - ¿Cómo hago una solicitud de transporte?
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

- [ ] **Q047** - ¿Cómo solicito un transporte SAMEX?
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

### Inventarios (2)

- [ ] **Q055** - ¿Cómo puedo descargar un inventario de sistema SAP?
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

- [ ] **Q056** - ¿Cómo realizo un inventario de materiales?
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

### Bodega Fácil (2)

- [ ] **Q016** - ¿Cómo solicito los implementos para activar bodega fácil?
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

- [ ] **Q017** - ¿Cómo solicito los equipos para activar bodega fácil?
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

### Documentación (1)

- [ ] **Q062** - ¿Cómo encuentro los procedimientos actualizados de SSOMA?
  - Rating: __/10 | Refs: __ | Phantoms: NO/SÍ

**Phase 2 Progress:** __/15 complete (__%)  
**Average Quality:** __.__/10  
**Phantom Refs Found:** __

---

## ✅ PHASE 3: Remaining Coverage (42 questions)

### Complete if time permits or issues detected in Phases 1-2

[List all remaining 42 questions with checkboxes]

**Phase 3 Progress:** __/42 complete (__%)

---

## 📊 Overall Progress

**Total Tested:** __ / 66 (__%)  
**Average Quality:** __.__/10  
**Total Phantom Refs:** __  
**Categories Covered:** __ / 10

**Quality Distribution:**
- 10/10 (Excellent): __
- 9/10 (Very Good): __
- 8/10 (Good): __
- 7/10 (Acceptable): __
- 6/10 or below: __

---

## 🎯 Target Metrics

- ✅ Critical Coverage: 9/9 (100%)
- ✅ High Coverage: ≥15/24 (≥60%)
- ✅ Overall Coverage: ≥30/66 (≥45%)
- ✅ Average Quality: ≥8.5/10
- ✅ Phantom Refs: 0

---

## 📝 Quick Notes Section

Use this space for observations during testing:

**Patterns Observed:**
- 

**Strong Categories:**
- 

**Weak Categories:**
- 

**Common Issues:**
- 

**Improvement Suggestions:**
- 

---

## 🚀 Next Steps After Testing

1. [ ] Update metadata.json with final results
2. [ ] Generate consolidated report
3. [ ] Create comparison with M001
4. [ ] Prepare for expert validation (Sebastian)
5. [ ] Document findings for v2 improvements

---

**Start Testing:** [timestamp]  
**Last Updated:** [timestamp]  
**Status:** 🔨 IN PROGRESS

