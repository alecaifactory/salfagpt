#!/usr/bin/env node

import('../dist/cli.js').then(({ runCLI }) => {
  runCLI();
}).catch((error) => {
  console.error('Failed to start CLI:', error);
  process.exit(1);
});


