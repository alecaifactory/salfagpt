#!/usr/bin/env node

import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery({ projectId: 'salfagpt' });

const query = `
  SELECT column_name, data_type 
  FROM \`salfagpt.flow_analytics_east4.INFORMATION_SCHEMA.COLUMNS\`
  WHERE table_name = 'document_embeddings'
  ORDER BY ordinal_position
`;

const [rows] = await bq.query({ query, location: 'us-east4' });

console.log('📊 Schema de flow_analytics_east4.document_embeddings:');
console.log('');
rows.forEach(r => {
  console.log(`  ${r.column_name.padEnd(30)} ${r.data_type}`);
});

process.exit(0);

