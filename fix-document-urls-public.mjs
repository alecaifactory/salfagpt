import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';

const app = initializeApp();
const db = getFirestore();
const storage = new Storage({ projectId: 'salfagpt' });
const bucket = storage.bucket('salfagpt-context-documents');

async function fixDocumentUrls() {
  console.log('🔧 Reparando URLs de documentos...\n');
  
  // Obtener todos los archivos en Cloud Storage
  console.log('📦 Cargando archivos de Cloud Storage...');
  const [files] = await bucket.getFiles({
    prefix: 'usr_uhwqffaqag1wrryd82tw/'
  });
  
  console.log(`   Encontrados: ${files.length} archivos\n`);
  
  // Crear mapa de archivos por agentId y nombre
  const fileMap = new Map();
  
  files.forEach(file => {
    const parts = file.name.split('/');
    if (parts.length === 3) {
      const [userId, agentId, fileName] = parts;
      const key = `${agentId}:${fileName}`;
      fileMap.set(key, file.name);
    }
  });
  
  // Obtener documentos sin gcsPath
  console.log('📄 Cargando documentos de Firestore...');
  const docsSnap = await db.collection('context_sources')
    .where('userId', '==', 'usr_uhwqffaqag1wrryd82tw')
    .get();
  
  const needsFixing = docsSnap.docs.filter(doc => !doc.data().gcsPath);
  console.log(`   Total: ${docsSnap.size}, Sin gcsPath: ${needsFixing.length}\n`);
  
  let fixed = 0;
  let notFound = 0;
  
  for (const doc of needsFixing) {
    const data = doc.data();
    const assignedAgents = data.assignedToAgents || [];
    let foundPath = null;
    
    for (const agentId of assignedAgents) {
      const key = `${agentId}:${data.name}`;
      const gcsPath = fileMap.get(key);
      
      if (gcsPath) {
        foundPath = `gs://salfagpt-context-documents/${gcsPath}`;
        break;
      }
    }
    
    if (foundPath) {
      try {
        // Usar URL pública (bucket ya configurado para acceso público)
        const publicUrl = `https://storage.googleapis.com/salfagpt-context-documents/${foundPath.replace('gs://salfagpt-context-documents/', '')}`;
        
        // Actualizar Firestore
        await doc.ref.update({
          gcsPath: foundPath,
          signedUrl: publicUrl,
          updatedAt: new Date()
        });
        
        fixed++;
        if (fixed <= 10 || fixed % 50 === 0) {
          console.log(`✅ [${fixed}] ${data.name}`);
        }
      } catch (error) {
        console.error(`❌ Error en ${data.name}:`, error.message);
      }
    } else {
      notFound++;
    }
  }
  
  console.log(`\n✨ Resumen:`);
  console.log(`   ✅ Reparados: ${fixed}`);
  console.log(`   ⚠️  No encontrados en GCS: ${notFound}`);
}

fixDocumentUrls()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
