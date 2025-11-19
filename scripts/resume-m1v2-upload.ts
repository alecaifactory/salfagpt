/**
 * Resume M1-v2 Upload - Skip already uploaded files
 * 
 * This script resumes the upload from where it stopped,
 * avoiding re-uploading files that are already in Firestore
 */

import { readdir } from 'fs/promises';
import { join } from 'path';
import { firestore } from '../src/lib/firestore';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function getAllPDFs(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function scan(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files.sort();
}

async function getUploadedFileNames(agentId: string): Promise<Set<string>> {
  const snapshot = await firestore
    .collection('context_sources')
    .where('assignedToAgents', 'array-contains', agentId)
    .get();
  
  const names = new Set<string>();
  snapshot.docs.forEach(doc => {
    names.add(doc.data().name);
  });
  
  return names;
}

async function main() {
  const agentId = 'EgXezLcu4O3IUqFUJhUZ';
  const folderPath = '/Users/alec/salfagpt/upload-queue/M001-20251118/Documentación';
  
  console.log('🔍 Verificando estado de M1-v2...\n');
  
  // Get all PDFs in folder
  console.log('📂 Escaneando carpeta...');
  const allPDFs = await getAllPDFs(folderPath);
  console.log(`✅ Total archivos en carpeta: ${allPDFs.length}\n`);
  
  // Get already uploaded files
  console.log('🔍 Consultando archivos ya subidos...');
  const uploadedNames = await getUploadedFileNames(agentId);
  console.log(`✅ Archivos ya en Firestore: ${uploadedNames.size}\n`);
  
  // Find files that need to be uploaded
  const pendingFiles = allPDFs.filter(filePath => {
    const fileName = filePath.split('/').pop() || '';
    return !uploadedNames.has(fileName);
  });
  
  console.log('📊 Resumen:');
  console.log(`   ✅ Ya subidos: ${uploadedNames.size}`);
  console.log(`   ⏳ Pendientes: ${pendingFiles.length}`);
  console.log(`   📁 Total: ${allPDFs.length}\n`);
  
  if (pendingFiles.length === 0) {
    console.log('🎉 ¡Todos los archivos ya están subidos!');
    process.exit(0);
  }
  
  // Create temporary file list
  const tempListPath = '/tmp/m1v2-pending-files.txt';
  const { writeFileSync } = await import('fs');
  writeFileSync(tempListPath, pendingFiles.join('\n'));
  
  console.log(`📝 Lista de archivos pendientes guardada en: ${tempListPath}\n`);
  console.log('🔄 Para reanudar el upload, ejecuta:\n');
  console.log('npx tsx cli/commands/upload.ts \\');
  console.log('  --folder="/Users/alec/salfagpt/upload-queue/M001-20251118/Documentación" \\');
  console.log('  --tag="M001-v2-20251118" \\');
  console.log('  --agent="EgXezLcu4O3IUqFUJhUZ" \\');
  console.log('  --user="usr_uhwqffaqag1wrryd82tw" \\');
  console.log('  --model="gemini-2.5-flash" \\');
  console.log('  --test-query="procedimiento mantenimiento" \\');
  console.log('  --skip-existing 2>&1 | tee /tmp/upload-m1v2-resume.log\n');
  
  // Save pending file names only
  const pendingFileNames = pendingFiles.map(f => f.split('/').pop());
  writeFileSync('/tmp/m1v2-pending-names.json', JSON.stringify(pendingFileNames, null, 2));
  
  console.log('📋 Primeros 10 archivos pendientes:');
  pendingFileNames.slice(0, 10).forEach((name, i) => {
    console.log(`   ${i + 1}. ${name}`);
  });
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

