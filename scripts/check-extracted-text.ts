import { firestore } from '../src/lib/firestore';

async function checkExtractedText() {
  console.log('🔍 Verificando texto extraído de SSOMA-P-004...\n');
  
  // Get newest source
  const sources = await firestore
    .collection('context_sources')
    .where('name', '==', 'SSOMA-P-004 PROCEDIMIENTO PARA LA GESTION DEL RIESGO REV.2.PDF')
    .get();
  
  let newestSource: any = null;
  let newestTime = 0;
  
  sources.docs.forEach(doc => {
    const data = doc.data();
    const addedAt = data.addedAt?.toDate?.()?.getTime() || 0;
    if (addedAt > newestTime) {
      newestTime = addedAt;
      newestSource = { id: doc.id, ...data };
    }
  });
  
  if (!newestSource) {
    console.log('❌ No source found');
    process.exit(1);
  }
  
  console.log('📄 Source ID:', newestSource.id);
  console.log('   Added:', new Date(newestTime).toLocaleString());
  console.log('   Extracted text length:', newestSource.extractedData?.length || 0, 'chars\n');
  
  const text = newestSource.extractedData || '';
  
  // Search for exact phrases
  const searches = [
    'riesgo más grave',
    'riesgo mas grave',
    'evento de riesgo',
    'Riesgos Críticos Operacionales',
    'Riesgos Criticos Operacionales',
    'Manual de Estándares SSOMA',
    'Manual de Estandares SSOMA',
    'SSOMA-ME',
    'todos los Peligros',
    'priorizando los',
  ];
  
  console.log('🔍 Buscando frases en texto extraído:\n');
  
  searches.forEach(term => {
    const found = text.includes(term);
    const lowerFound = text.toLowerCase().includes(term.toLowerCase());
    
    if (found) {
      const index = text.indexOf(term);
      const context = text.substring(Math.max(0, index - 100), index + term.length + 100);
      console.log(`✅ FOUND: "${term}"`);
      console.log(`   Position: ${index}`);
      console.log(`   Context: ...${context}...\n`);
    } else if (lowerFound) {
      const lowerText = text.toLowerCase();
      const index = lowerText.indexOf(term.toLowerCase());
      const context = text.substring(Math.max(0, index - 100), index + term.length + 100);
      console.log(`⚠️  FOUND (case insensitive): "${term}"`);
      console.log(`   Actual text: "${text.substring(index, index + term.length)}"`);
      console.log(`   Context: ...${context}...\n`);
    } else {
      console.log(`❌ NOT FOUND: "${term}"\n`);
    }
  });
  
  // Check if PDF was scanned image or has text
  console.log('\n📊 Text statistics:');
  console.log(`   Total characters: ${text.length}`);
  console.log(`   Total words: ${text.split(/\s+/).length}`);
  console.log(`   Contains "SSOMA": ${text.includes('SSOMA')}`);
  console.log(`   Contains "PROCEDIMIENTO": ${text.includes('PROCEDIMIENTO')}`);
  console.log(`   Contains "RIESGO": ${text.includes('RIESGO')}`);
  
  // Show first 500 chars
  console.log('\n📝 First 500 characters of extracted text:');
  console.log(text.substring(0, 500));
  console.log('\n...\n');
  
  // Show a sample from middle (page 8 area)
  const midPoint = Math.floor(text.length / 2);
  console.log('📝 Sample from middle (aprox página 8):');
  console.log(text.substring(midPoint, midPoint + 500));
  
  process.exit(0);
}

checkExtractedText().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

