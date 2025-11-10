import { getDomains } from '../src/lib/domains.js';

async function main() {
  console.log('📋 Current domains in Firestore:');
  const domains = await getDomains();
  console.log(JSON.stringify(domains, null, 2));
  process.exit(0);
}

main();

