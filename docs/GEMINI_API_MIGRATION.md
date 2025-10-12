# Gemini API Migration Guide

## ⚠️ CRITICAL: Correct @google/genai API Usage

**Date**: October 11, 2025  
**Package**: `@google/genai` v1.23.0  
**Previous Issue**: TypeScript errors due to incorrect API usage

---

## The Problem

The codebase was using an **incorrect API pattern** that doesn't exist in `@google/genai` v1.23.0:

### ❌ WRONG (Old/Incorrect Pattern)
```typescript
import { GoogleGenerativeAI } from '@google/genai'; // Wrong class name

const genAI = new GoogleGenerativeAI(API_KEY); // Wrong constructor
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' }); // Method doesn't exist!
const result = await model.generateContent(prompt);
```

### ✅ CORRECT (@google/genai v1.23.0)
```typescript
import { GoogleGenAI } from '@google/genai'; // Correct class name

const genAI = new GoogleGenAI({ apiKey: API_KEY }); // Correct constructor
const result = await genAI.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: prompt,
  config: {
    systemInstruction: 'You are a helpful assistant.',
    temperature: 0.7,
    maxOutputTokens: 8192,
  }
});

const text = result.text; // Access response text
```

---

## Key Differences

| Feature | ❌ Old/Wrong Pattern | ✅ Correct Pattern (@google/genai v1.23.0) |
|---------|---------------------|-------------------------------------------|
| **Class Name** | `GoogleGenerativeAI` | `GoogleGenAI` |
| **Constructor** | `new GoogleGenAI(apiKey)` | `new GoogleGenAI({ apiKey })` |
| **Model Access** | `genAI.getGenerativeModel()` | `genAI.models.generateContent()` |
| **System Instructions** | In model constructor | In `config.systemInstruction` |
| **Response Access** | `result.response.text()` | `result.text` |

---

## Complete API Patterns

### 1. Basic Text Generation

```typescript
const result = await genAI.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: 'Why is the sky blue?',
  config: {
    systemInstruction: 'You are a helpful assistant.',
    temperature: 0.7,
    maxOutputTokens: 1024,
  }
});

console.log(result.text);
```

### 2. Multi-Turn Conversation

```typescript
const contents = [
  {
    role: 'user',
    parts: [{ text: 'Hello!' }]
  },
  {
    role: 'model',
    parts: [{ text: 'Hi! How can I help you?' }]
  },
  {
    role: 'user',
    parts: [{ text: 'What is the capital of France?' }]
  }
];

const result = await genAI.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: contents,
  config: {
    systemInstruction: 'You are a geography expert.',
    temperature: 0.5,
  }
});
```

### 3. Streaming Response

```typescript
const stream = await genAI.models.generateContentStream({
  model: 'gemini-2.5-pro',
  contents: 'Write a short story',
  config: {
    temperature: 0.9,
    maxOutputTokens: 2048,
  }
});

for await (const chunk of stream) {
  if (chunk.text) {
    process.stdout.write(chunk.text);
  }
}
```

### 4. Multimodal (Image + Text)

```typescript
const result = await genAI.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: [
    {
      role: 'user',
      parts: [
        { text: 'What is in this image?' },
        {
          inlineData: {
            data: base64ImageData,
            mimeType: 'image/jpeg',
          }
        }
      ]
    }
  ]
});
```

---

## Migration Checklist

When working with Gemini AI in this project:

- [ ] ✅ Import `GoogleGenAI` (not `GoogleGenerativeAI`)
- [ ] ✅ Initialize with object: `new GoogleGenAI({ apiKey })`
- [ ] ✅ Use `genAI.models.generateContent()` for requests
- [ ] ✅ Use `genAI.models.generateContentStream()` for streaming
- [ ] ✅ Put system instructions in `config.systemInstruction`
- [ ] ✅ Access response with `result.text` (not `result.response.text()`)
- [ ] ✅ Handle undefined: `result.text || ''`
- [ ] ✅ Use proper TypeScript error handling: `error instanceof Error`

---

## Common Errors & Solutions

### Error: "Module has no exported member 'GoogleGenerativeAI'"

**Problem**: Wrong class name  
**Solution**: Use `GoogleGenAI` instead

### Error: "Property 'getGenerativeModel' does not exist"

**Problem**: Using old API pattern  
**Solution**: Use `genAI.models.generateContent()` instead

### Error: "Type 'string | undefined' is not assignable to type 'string'"

**Problem**: `result.text` can be undefined  
**Solution**: Use `result.text || ''` or handle undefined properly

---

## Testing the API

```typescript
// Quick test script
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Say hello!',
  });
  
  console.log(result.text);
}

test().catch(console.error);
```

---

## References

- **Package**: [@google/genai on npm](https://www.npmjs.com/package/@google/genai)
- **Documentation**: [Google Gen AI TypeScript SDK](https://googleapis.github.io/js-genai/)
- **GitHub**: [googleapis/js-genai](https://github.com/googleapis/js-genai)

---

## Related Files

- `src/lib/gemini.ts` - Main Gemini API integration
- `src/pages/api/chat.ts` - Chat API endpoint
- `src/components/ChatInterface.tsx` - Chat UI component

---

**Last Updated**: October 11, 2025  
**Issue Resolution**: Fixed incorrect API usage causing TypeScript compilation errors

