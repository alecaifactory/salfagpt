#!/bin/bash
# Simple deletion using Firestore REST API

AGENT_ID="vStojK73ZKbjNsEnqANJ"
TOKEN=$(gcloud auth application-default print-access-token)

echo "🗑️  Deleting M3-v2 documents using Firestore REST API..."
echo ""

# Get documents
DOCS=$(curl -s "https://firestore.googleapis.com/v1/projects/salfagpt/databases/(default)/documents/context_sources" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
docs = data.get('documents', [])
to_delete = []
for doc in docs:
    fields = doc.get('fields', {})
    assigned = fields.get('assignedToAgents', {}).get('arrayValue', {}).get('values', [])
    assigned_ids = [v.get('stringValue', '') for v in assigned]
    if 'vStojK73ZKbjNsEnqANJ' in assigned_ids:
        doc_path = doc['name']
        to_delete.append(doc_path)

print(len(to_delete))
for path in to_delete:
    print(path)
")

echo "$DOCS" | head -1 | while read count; do
  echo "   Found: $count documents to delete"
done

# Delete each document
echo "$DOCS" | tail -n +2 | while read doc_path; do
  if [ -n "$doc_path" ]; then
    curl -s -X DELETE "https://firestore.googleapis.com/v1/$doc_path" \
      -H "Authorization: Bearer $TOKEN" > /dev/null
    echo "   ✅ Deleted: $(basename $doc_path)"
  fi
done

echo ""
echo "✅ Cleanup complete"
