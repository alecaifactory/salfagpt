# 🔍 Find Input Examples Field Name

**Critical:** Need to see the actual structure of the extracted config

---

## 🎯 What to Do

### 1. Refresh Page
```
F5 to load new code with detailed logs
```

### 2. Clear Console
```
Click 🚫 to clear
```

### 3. Upload PDF Again
```
1. Select agent
2. Header → "Configurar Agente"  
3. Upload PDF
4. Wait for processing
```

### 4. Look for This NEW Log:
```
🔍 [SAVE FULL] ALL CONFIG KEYS: [...]
🔍 [SAVE FULL] FULL CONFIG: {...}
```

---

## 📋 Share These Logs

**Copy and paste:**

1. **The line that shows:**
   ```
   🔍 [SAVE FULL] ALL CONFIG KEYS: [...]
   ```
   
2. **The full JSON (might be long):**
   ```
   🔍 [SAVE FULL] FULL CONFIG: {...}
   ```

**Or expand the config object in Console:**
- Look for the collapsed object: `{agentName: '...', ...}`
- Click the ▶ arrow to expand
- Look for fields containing "input" or "example"
- Take screenshot or copy the field names

---

## 💡 What I'm Looking For

**Possible field names:**
- `expectedInputExamples` ← We're checking this
- `inputExamples` ← Might be this
- `testCases` ← Could be this
- `exampleInputs` ← Maybe this
- `sampleQuestions` ← Possibly this

**Once I know the correct field name, I'll update the mapping in 2 seconds!**

---

## 🚀 Quick Fix Once We Know

If the field is `inputExamples` instead of `expectedInputExamples`:

```typescript
// Change line 1193 in ChatInterfaceWorking.tsx
inputExamples: (config.inputExamples || []).map(...)  // Instead of expectedInputExamples
```

**That's it!** ✅

---

**Share the logs with the field names and this will be fixed immediately!** 🎯

