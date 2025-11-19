#!/usr/bin/env node

/**
 * Assign the EXACT 75 documents from the CLI upload to S1-v2
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function assignExact75ToS1v2() {
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  const agentId = 'iQmdg3bMSJ1AdqqlFpye';
  
  // The EXACT 75 source IDs from the CLI upload
  const exact75SourceIds = [
    'WvMqftPDe4KHqc8PIzcX', // Instructivo Capacitación Salfacorp.pdf
    'Gxx4N9AZxadIDUrqIb0e', // MANUAL DE ESTÁNDARES DE RIESGOS CRÍTICOS 25-02-2020.pdf
    'vpbcEyoGpAtKOkzANsEt', // MAQ-ABA-CNV-PP-001 Compras por Convenio Rev.02.pdf
    'X2BasCXLGotPRD9pcVwT', // MAQ-ABA-DTM-P-001 Gestión de Compras Técnicas Rev.01.pdf
    'lMIZEUyzc8FQkY7uVJsU', // MAQ-ABA-EXC-P-001 Recuperación y Venta de Excedentes de Obra Rev.06.pdf
    'vVBsS8DlYyVrbO3KDv4c', // MAQ-ABA-GC-P-001 Gestión de Compras Nacionales Rev.09.PDF
    '9jnQcHXBkF245ijjTzJK', // MAQ-ADM-AUD-I-001 Instructivo de Auditoría de Inventario General Rev.00.pdf
    'TXO0tOrb1HL5GoPFdNiZ', // MAQ-ADM-AUD-P-002 Auditorias Operacionales Rev.06.pdf
    'IuXWf7tqySub7J4tTRQm', // MAQ-ADM-I+D-P-002 Implementación y Uso Bodega Fácil Rev.01.pdf
    'ew7i8ZQlV4U1xqQAPSPk', // MAQ-ADM-I+D-PP-001 Bodega Fácil Rev.01.PDF
    'd9zmBqJtvFzojnFpF4QN', // MAQ-ADM-I+D-PP-002 Bodega Fácil Reserva Rev.00.pdf
    'Wp3KRffoqaE9UNmeC9nW', // MAQ-ADM-I+D-PP-003 Bodega Fácil Solicitud de EPP y Control de Enrolamiento Rev.00.pdf
    'K0gkFRPjxShX876iLp7Q', // MAQ-ADM-I+D-PP-004 Configuración Impresora Rev.02.pdf
    'c0rLcPNk8bBNhruWCMra', // MAQ-ADM-I+D-PP-005 Configuración PDA.pdf
    '34KyN20dRoGLC61jiA7N', // MAQ-GG-CAL-I-003 Creación de Proveedor en SAP Rev.00.pdf
    'JGJ7P9Ht9qH6mSAgYMTT', // MAQ-GG-CAL-P-004 Evaluación de Proveedores Rev.10.pdf
    'lRRXssm2yZhnqchgQ0Iu', // MAQ-GG-CAL-PP-002 Evaluación Proveedores en SAP Rev.00.pdf
    'Osl9uXfZBqgZdnwwFBT6', // MAQ-LOG-CBO-AN-002 BUENAS PRÁCTICAS N°1
    'YLvtKHDQMwkZcXn3OJUx', // MAQ-LOG-CBO-AN-003 BUENAS PRÁCTICAS N°2
    'IhPH0Y4niV1TNWv286uP', // MAQ-LOG-CBO-AN-004 BUENAS PRÁCTICAS N°3
    'lC3WkloNQedzTGJ52M3V', // MAQ-LOG-CBO-I-001 Toma de Inventario Rev.05.pdf
    'UkB9Urwl8ZucnzeaC0vW', // MAQ-LOG-CBO-I-002 Cierre de Bodegas Rev.08.pdf
    '4BbU33obkzVfWrSOIPPw', // MAQ-LOG-CBO-I-003 Traspaso de Bodega Rev.02.pdf
    '0tUwtBIkqWCJellPa2vf', // MAQ-LOG-CBO-I-004 Evaluación de Desempeño Jefaturas de Bodega Rev.02.pdf
    'ChFwEbz4AGFdbcMPOhkd', // MAQ-LOG-CBO-I-005 Solic. recep. y entrega de mat. serv. y EPP Rev.04.pdf
    '91OuovTGtY6LVCJdieBf', // MAQ-LOG-CBO-I-006 Gestión, Control y Manejo del Combustible Rev.05.pdf
    'hvBfoOuvCHP0OUb5FTD2', // MAQ-LOG-CBO-I-007 Devolución de Cargos de Personal Desvinculado.pdf
    'JjamEFEN2htZuysU1XN9', // MAQ-LOG-CBO-I-008 Instalación, Preparación e Implementación de Bodega Rev.00.pdf
    'A2LMS1bywIR4ijI3B9Bp', // MAQ-LOG-CBO-I-009 Venta de Chatarra y Despunte de Fierro Rev.02.pdf
    'DyWdRPOcwvTBnEaXJ2p9', // MAQ-LOG-CBO-PP-001 Solución Facturas Retenidas Rev.02.pdf
    '1BbMTURj013qfx4n9g9c', // MAQ-LOG-CBO-PP-002 Revisión Facturas Reclamadas Rev.00.pdf
    'GO3kxj3ndBvhtGbH9YJk', // MAQ-LOG-CBO-PP-003 Anulación Ingreso, Devolución Proveedor
    'fgmcpc2FTF91udaXi83z', // MAQ-LOG-CBO-PP-004 Inventario de Materiales ZMM_STOCK_MAT Rev.01.PDF
    'GE13RXF9UTj4K9jhxlrJ', // MAQ-LOG-CBO-PP-005 Inventario de Existencias MB52 Rev.01.PDF
    '8WGm0quP6P8f9ADd6swt', // MAQ-LOG-CBO-PP-006 Crear Inventario en SAP Rev.01.PDF
    'PomQvKioFkB5QdzyyDv6', // MAQ-LOG-CBO-PP-007 Traspaso de Materiales entre Obras
    'Sjn5uugrp25KP6ueD9k7', // MAQ-LOG-CBO-PP-008 Venta de Materiales entre Obras
    'ZuTrFgvfaQfySLpXjEgN', // MAQ-LOG-CBO-PP-009 Como Imprimir Resumen Consumo Petróleo Diésel Rev.02.pdf
    'Ro6GrZgT7s7SGH1xxHLY', // MAQ-LOG-CBO-PP-010 Emisión Guías Despacho Electrónicas Sin Referencia.pdf
    'dhXZdaxDkD8BKqwKhKZM', // MAQ-LOG-CBO-PP-011 Recepción de Materiales en MIGO.pdf
    'Te5JAMHLHEJTwiMQoiCG', // MAQ-LOG-CBO-PP-012 Reenvío de Mensajes por ME9F.pdf
    'SYYH746VdXbWtxBBBdPx', // MAQ-LOG-CBO-PP-013 Recepción pendiente de Pedidos de Traslado.pdf
    '8CjrC2vtmQVtvIqSFZBu', // MAQ-LOG-CBO-PP-014 Pedido de Regularización (ZREG).pdf
    'DBBPY2jC2zJHtwa6l8hH', // MAQ-LOG-CBO-PP-015 Creación de HES.pdf
    'TwdhY2jounLyCVGHEoym', // MAQ-LOG-CBO-PP-016 Manejo de Stock Crítico-PEP Nivel 2.pdf
    '9rzACjKbsNQHklWpJJQT', // MAQ-LOG-CBO-PP-017 Buscar Proveedor de Equipos de Terceros en SAP.PDF
    'KfAoB1KXgnAkKISpqa9H', // MAQ-LOG-CBO-PP-018 Reporte Trazabilidad de Abastecimiento Rev.00.pdf
    'aMJNSRHFZbnXxOxIl3Bp', // MAQ-LOG-CBO-PP-019 Manejo de Stock Crítico-PEP Nivel 4.pdf
    'nxKlhP3vl9m4PDJJk5xD', // MAQ-LOG-CT-P-001 Coordinación de Transportes Rev.06.pdf
    'px1hP6ugvuh3S38ZAwu9', // MAQ-LOG-CT-P-002 Transporte de Carga Menor Rev.02.pdf
    'vV6Rbp1ZDSwOyPSVub7p', // MAQ-LOG-CT-PP-002 Liberación Gasto Transporte Jefe Bodega.pdf
    'emZHmoqjTvXcOZeiPuuv', // MAQ-LOG-CT-PP-003 Liberación Gasto Transporte Jefe Oficina Técnica.pdf
    'V3b7wI6ztAUUIjRAaqkq', // MAQ-LOG-CT-PP-005 Solicitud de Transporte LETRA -ST SAMEX.pdf
    'nWUAARkU6aj6KSDCPUXI', // MAQ-LOG-CT-PP-006 Solicitud de Transporte LETRA -ST SUBCARGO.pdf
    'Vc2iut0bcz91F8eArcvf', // MAQ-LOG-CT-PP-007 Reporte Seguimiento ST.pdf
    'KBTHNvhYnRzCAQCj9751', // Paso a Paso Actualización de Materiales en Obra.pdf
    '7lhR89noRU44Hrv4AS1K', // Paso a Paso Anulación-Borrado de HES (liberada completamente).pdf
    'fKjc9CT4eVQ0pqqeqCH1', // Paso a Paso Anulación-Eliminación de HES (NO liberada).pdf
    '9ltyHfTorToY4cglJ6tA', // Paso a Paso Aprobación de HES-Aprobación individual.pdf
    'af1rEOQXJfjZrT2mmisa', // Paso a Paso Consulta Gestionador de Responsables - ZMM_GDR.pdf
    'PYCr3E5tvKrM4IAs4qnV', // Paso a Paso Consumos y Reporte Diésel Rev.2024.pdf
    'Ia7TYHdvhRNsRJNmWpeB', // Paso a Paso Creación de Pedido de Compra de Servicios-ZSER.pdf
    '8V6DrwaTc03LPpeBuJFx', // Paso a Paso Generación HES para Pedido de Servicio ZSER.pdf
    'q43lOAL5qUQtikQCRbF2', // Paso a Paso Guia Despacho Electronica 30052023.pdf
    'vAx2FRyxxtWPGOfAsjoH', // Paso a Paso Monitor de Guías de Despacho Electrónicas Emitidas.pdf
    'VZiW2ap8rEt0L01Mfwpt', // Paso a Paso Reimpresión de HES.pdf
    '6276o8Jkma50RMbD6qRB', // Paso a Paso Reporte de Pedidos y Mov Equipos ME2N.pdf
    'D6v8laWuMFqlSzZmSXkA', // Paso a Paso Solicitud de Pedido ZCRE Solped Costo Reembolsable.pdf
    'OggajrOstsZNdACgTQO0', // Paso a Paso Solicitud de Pedido ZETM.pdf
    'V932eax6RjkR3JgrEy4f', // Paso a Paso Solicitud de Pedido de Capacitación.pdf
    'Sogx8RXUjXFlQGQHI9eD', // Paso a Paso Solicitud de Pedido de Insumos Tecnológicos-GTI.pdf
    '5ooUtQmg1MsHoPi7FPkk', // Paso a Paso Solicitud de Servicio Básico-ZBAS.pdf
    'JKtb0skcxiCIqDZgO610', // Paso a paso Recepcion Maquinarias y Equipos de Terceros.pdf
    'v5YH4cCLBSL2Eio7llof', // SSOMA-GS-009 ESTUDIO Y SELECCIÓN DE EPP REV.2.pdf
    'W3lakKhiaYZsoDMCExxI', // MAQ-LOG-CBO-P-001 Gestión de Bodegas de Obras Rev.08.pdf
  ];
  
  console.log(`🔧 Assigning the EXACT 75 documents from CLI upload to S1-v2...\n`);
  console.log(`   Agent: S1-v2 (${agentId})`);
  console.log(`   Documents: ${exact75SourceIds.length}\n`);
  
  try {
    // Step 1: Remove ALL existing assignments for S1-v2
    console.log('Step 1: Clearing existing assignments...');
    const existingAssignments = await db.collection('agent_sources')
      .where('agentId', '==', agentId)
      .get();
    
    if (existingAssignments.size > 0) {
      let batch = db.batch();
      let deleteCount = 0;
      
      for (const doc of existingAssignments.docs) {
        batch.delete(doc.ref);
        deleteCount++;
        
        if (deleteCount % 400 === 0) {
          await batch.commit();
          batch = db.batch();
        }
      }
      
      if (deleteCount % 400 !== 0) {
        await batch.commit();
      }
      
      console.log(`   ✅ Removed ${deleteCount} old assignments\n`);
    }
    
    // Step 2: Create new assignments for the 75 documents
    console.log('Step 2: Creating assignments for the 75 CLI-uploaded documents...');
    let batch = db.batch();
    let assignCount = 0;
    
    for (const sourceId of exact75SourceIds) {
      const assignmentRef = db.collection('agent_sources').doc();
      batch.set(assignmentRef, {
        agentId,
        sourceId,
        userId,
        assignedAt: FieldValue.serverTimestamp(),
        assignedBy: userId
      });
      assignCount++;
      
      if (assignCount % 400 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    
    if (assignCount % 400 !== 0) {
      await batch.commit();
    }
    
    console.log(`   ✅ Created ${assignCount} assignments\n`);
    
    // Step 3: Update agent's activeContextSourceIds
    console.log('Step 3: Enabling all 75 documents on S1-v2...');
    await db.collection('conversations').doc(agentId).update({
      activeContextSourceIds: exact75SourceIds,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    console.log(`   ✅ Enabled ${exact75SourceIds.length} documents\n`);
    
    // Step 4: Verify
    console.log('Step 4: Verifying...');
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    const activeIds = agentDoc.data()?.activeContextSourceIds || [];
    
    console.log(`   ✅ Active sources: ${activeIds.length}`);
    
    const assignmentsCheck = await db.collection('agent_sources')
      .where('agentId', '==', agentId)
      .get();
    
    console.log(`   ✅ Agent assignments: ${assignmentsCheck.size}\n`);
    
    console.log('🎉 SUCCESS! S1-v2 now has the EXACT 75 CLI-uploaded documents!\n');
    console.log('📝 Documents include:');
    console.log('   - MAQ-LOG-CBO (Warehouse/Bodega procedures)');
    console.log('   - MAQ-LOG-CT (Transport coordination)');
    console.log('   - MAQ-ADM (Administration/Bodega Fácil)');
    console.log('   - MAQ-ABA (Purchasing/Procurement)');
    console.log('   - MAQ-GG-CAL (Quality/Supplier management)');
    console.log('   - Paso a Paso guides (Step-by-step SAP procedures)');
    console.log('   - 1 SSOMA document\n');
    
    console.log('📝 Next steps:');
    console.log('  1. Refresh SalfaGPT in your browser');
    console.log('  2. Select S1-v2 agent');
    console.log('  3. Ask questions about warehouses, SAP procedures, transport, etc.');
    console.log('  4. RAG should now work with these 75 documents!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignExact75ToS1v2();

