import { firestore } from './src/lib/firestore';

async function countAll() {
  const m001Agents = [
    { id: 'CpB6tE5DvjzgHI3FvpU2', name: 'M001 (isAgent: undefined)' },
    { id: 'eKUSLAQNrf2Ru96hKGeA', name: 'M001 (isAgent: true) #1' },
    { id: 'eamdq8blenqlvPaThOLC', name: 'M001 (isAgent: true) #2' },
  ];
  
  for (const agent of m001Agents) {
    const assigned = await firestore
      .collection('context_sources')
      .where('assignedToAgents', 'array-contains', agent.id)
      .get();
    
    console.log(agent.name);
    console.log('   ID:', agent.id);
    console.log('   📊 Sources asignados:', assigned.size);
    console.log('');
  }
  
  process.exit(0);
}

countAll();
