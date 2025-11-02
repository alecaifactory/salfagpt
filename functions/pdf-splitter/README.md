# PDF Splitter Cloud Function

Splits large PDFs into 20MB chunks without quality loss.

## Deployment

```bash
cd functions/pdf-splitter
npm install
npm run deploy
```

## Usage

```bash
# Invoke function
curl -X POST https://us-central1-gen-lang-client-0986191192.cloudfunctions.net/pdf-splitter-tool \
  -H "Content-Type: application/json" \
  -d '{
    "inputFileUrl": "gs://salfagpt-uploads/user-123/large-file.pdf",
    "chunkSizeMB": 20,
    "userId": "user-123",
    "executionId": "exec_20251102_abc123"
  }'
```

## Response

```json
{
  "success": true,
  "executionId": "exec_20251102_abc123",
  "chunks": [
    {
      "url": "https://storage.googleapis.com/...",
      "fileName": "chunk-001.pdf",
      "sizeMB": 19.8,
      "pageRange": "1-45",
      "pageCount": 45
    }
  ],
  "metadata": {
    "totalChunks": 16,
    "totalPages": 450,
    "avgChunkSizeMB": 19.5,
    "processingTimeMs": 150000
  }
}
```

