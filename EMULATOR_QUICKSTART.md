# Firebase Emulators Quick Start

## Prerequisites

1. **Java Runtime** (required for Firebase emulators)
   ```bash
   # Check if Java is installed
   java -version
   
   # If not installed (macOS):
   brew install openjdk@11
   ```

2. **Firebase Tools** (already installed via npm)
   ```bash
   npm install -D firebase-tools
   ```

## Running Emulators

### Option 1: Start Emulators Only
```bash
# Terminal 1: Start emulators
npm run dev:emulator

# Access Emulator UI at: http://localhost:4000
# Firestore: localhost:8080
# Pub/Sub: localhost:8085
```

### Option 2: Start Emulators + Dev Server
```bash
# Terminal 1: Start emulators
npm run dev:emulator

# Terminal 2: Start dev server connected to emulators
npm run dev:local

# Your app runs at: http://localhost:4321
# Connected to local Firestore instead of production
```

## Using the Emulator UI

Navigate to http://localhost:4000 to:
- View Firestore collections and documents
- Add/edit/delete test data
- Monitor Pub/Sub messages
- Export/import data
- Reset emulator state

## Development Workflow

### 1. Normal Development (Production GCP)
```bash
npm run dev
```
Uses real GCP services (Firestore, BigQuery, etc.)

### 2. Local Development (Emulated)
```bash
npm run dev:emulator  # Terminal 1
npm run dev:local     # Terminal 2
```
Uses local emulators - **zero GCP costs**

### 3. Testing Build with Emulators
```bash
npm run test:emulators
```
Runs build against emulators to test production behavior

## Environment Variables

The `dev:local` script automatically sets:
```bash
FIRESTORE_EMULATOR_HOST=localhost:8080
PUBSUB_EMULATOR_HOST=localhost:8085
```

## Stopping Emulators

Press `Ctrl+C` in the terminal running emulators

## Troubleshooting

### Emulators won't start
```bash
# Check Java is installed
java -version

# Reinstall firebase-tools
npm install -g firebase-tools
```

### Port already in use
Edit `firebase.json` to change ports:
```json
{
  "emulators": {
    "firestore": { "port": 8081 },  // Changed from 8080
    "pubsub": { "port": 8086 }      // Changed from 8085
  }
}
```

### Emulator data persistence
Emulator data is **not persistent** by default. It resets when you stop the emulator.

To persist data, add to `firebase.json`:
```json
{
  "emulators": {
    "firestore": {
      "port": 8080,
      "host": "localhost",
      "import": "./emulator-data",
      "export": "./emulator-data"
    }
  }
}
```

## Benefits

✅ **Zero GCP Costs** - Develop without cloud charges  
✅ **Faster Iteration** - No network latency  
✅ **Offline Development** - Work without internet  
✅ **Safe Testing** - No risk to production data  
✅ **Realistic Environment** - Same behavior as production  

## Next Steps

1. Start emulators and explore the UI
2. Create test data in Firestore
3. Run your app with `dev:local`
4. Test features without GCP costs

---

**Need Help?** See [Firebase Emulators Documentation](https://firebase.google.com/docs/emulator-suite)



