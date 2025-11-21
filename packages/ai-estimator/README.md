# 🤖 @salfagpt/ai-estimator

> AI-powered project estimation & tracking with historical calibration

Transform your AI-assisted development workflow with data-driven project estimates that learn from your actual performance.

---

## ✨ Features

- **📊 PERT Estimation**: Three-point estimates (optimistic/realistic/pessimistic)
- **🧮 Historical Calibration**: Automatically adjusts based on your past projects
- **📈 Progress Tracking**: Real-time tracking with accuracy metrics
- **🎯 Confidence Scoring**: Statistical confidence intervals
- **🔌 MCP Server**: Integrate with Claude Desktop / Cursor
- **💻 CLI Tool**: Beautiful command-line interface
- **📦 NPM SDK**: Use programmatically in your apps
- **🗄️ Firestore Ready**: Built-in persistence layer

---

## 🚀 Quick Start

### Installation

```bash
# NPM
npm install -g @salfagpt/ai-estimator

# Or use with npx
npx @salfagpt/ai-estimator estimate
```

### CLI Usage

#### 1. Estimate a New Project

```bash
ai-estimate estimate --name "Web Search Feature" --type "web-feature"
```

Interactive prompts will guide you through adding steps:

```
Step 1 name: Data Schema Extensions
Step 1 description: Extend ContextSource interface and create types
Optimistic hours: 2
Realistic hours: 3
Pessimistic hours: 4
Complexity: medium
```

**Output:**

```
✨ Estimation Results
─────────────────────────────────────────────────────────────
Project: Web Search Feature
Type: web-feature
Steps: 10

Time Estimates:
  Raw estimate:        53.0h (6.6 days)
  Calibrated estimate: 37.1h (4.6 days)
  Historical factor:   0.70x
  Confidence:          75%

Completion Dates:
  Optimistic:  2025-11-22
  Realistic:   2025-11-25
  Pessimistic: 2025-11-29

💡 Suggestions:
  • Historical data shows projects complete 30% faster. Estimates are calibrated.
```

#### 2. Track Progress

```bash
ai-estimate track <project-id> --step step-1 --hours 2.5
```

#### 3. View Progress Report

```bash
ai-estimate report <project-id>
```

#### 4. List Projects

```bash
ai-estimate list
ai-estimate list --status in-progress
```

#### 5. View Calibration Data

```bash
ai-estimate calibration
ai-estimate calibration --type web-feature
```

---

## 🔌 MCP Server (Claude Desktop / Cursor)

### Setup

Add to your MCP settings (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ai-estimator": {
      "command": "npx",
      "args": ["-y", "@salfagpt/ai-estimator", "mcp"]
    }
  }
}
```

### Available Tools

#### `estimate_project`

```typescript
{
  "name": "Web Search Feature",
  "description": "Add web search with training contribution",
  "steps": [
    {
      "name": "Data Schema",
      "description": "Extend interfaces",
      "optimisticHours": 2,
      "realisticHours": 3,
      "pessimisticHours": 4,
      "complexity": "medium"
    }
    // ... more steps
  ],
  "projectType": "web-feature",
  "useHistoricalCalibration": true
}
```

#### `track_progress`

```typescript
{
  "projectId": "project-123",
  "stepId": "step-1",
  "actualHours": 2.5,
  "tokensGenerated": 5000,
  "linesOfCode": 250,
  "notes": "Completed faster than expected"
}
```

#### `get_calibration`

```typescript
{
  "projectType": "web-feature",
  "complexity": "high",
  "minDataPoints": 3
}
```

#### `get_progress_report`

```typescript
{
  "projectId": "project-123"
}
```

#### `complete_project`

```typescript
{
  "projectId": "project-123",
  "actualHours": 35.5
}
```

---

## 📦 NPM SDK

### Installation

```bash
npm install @salfagpt/ai-estimator
```

### Usage

#### Quick Estimation

```typescript
import { estimateProject, pertEstimate } from '@salfagpt/ai-estimator';

// Quick PERT estimate
const { estimate, confidence } = pertEstimate(2, 3, 5);
console.log(`Estimate: ${estimate}h (confidence: ${confidence * 100}%)`);

// Full project estimation
const steps = [
  {
    id: 'step-1',
    name: 'Data Schema',
    description: 'Extend interfaces',
    optimisticHours: 2,
    realisticHours: 3,
    pessimisticHours: 4,
    complexity: 'medium' as const,
    dependencies: [],
    tags: [],
  },
  // ... more steps
];

const analysis = estimateProject(steps, {
  historicalFactor: 0.7,
  projectName: 'Web Search Feature',
  projectType: 'web-feature',
});

console.log(analysis);
// {
//   totalEstimated: 53.0,
//   totalCalibrated: 37.1,
//   confidence: 0.75,
//   realisticCompletion: Date,
//   warnings: [...],
//   suggestions: [...]
// }
```

#### Full Database Integration

```typescript
import {
  FirestoreAdapter,
  EstimationEngine,
  CalibrationEngine,
} from '@salfagpt/ai-estimator';
import admin from 'firebase-admin';

// Initialize Firestore
admin.initializeApp();
const db = new FirestoreAdapter(admin.firestore());

// Get historical data
const dataPoints = await db.getDataPoints({
  projectType: 'web-feature',
  limit: 10,
});

// Build calibration model
const calibration = CalibrationEngine.buildCalibrationModel(dataPoints);
console.log(`Historical factor: ${calibration.overallFactor}x`);

// Estimate with calibration
const estimation = EstimationEngine.estimateProject(
  steps,
  calibration.overallFactor
);

// Create project
const projectId = await db.createProject({
  // ... project data
});

// Track execution
await db.createExecution({
  projectId,
  stepId: 'step-1',
  actualHours: 2.5,
  // ... execution data
});
```

#### Progress Tracking

```typescript
import { ProgressTracker, calculateAccuracy } from '@salfagpt/ai-estimator';

// Calculate accuracy
const { factor, interpretation } = calculateAccuracy(3.0, 2.5);
console.log(`${interpretation} (${factor}x)`);
// "Faster than estimated (0.83x)"

// Estimate completion
const completionDate = estimateCompletion(
  10, // total steps
  3,  // completed steps
  new Date('2025-11-18')
);
console.log(`Estimated completion: ${completionDate}`);
```

---

## 🧮 How It Works

### PERT Estimation

Uses Program Evaluation and Review Technique:

```
Estimate = (Optimistic + 4×Realistic + Pessimistic) / 6
StdDev = (Pessimistic - Optimistic) / 6
Confidence = f(StdDev / Estimate)
```

### Historical Calibration

Learns from your actual performance:

```
Factor = Σ(Actual / Estimated) / N
Calibrated Estimate = Raw Estimate × Factor
```

**Example:**

- Raw estimate: 53h
- Historical factor: 0.7x (you complete 30% faster)
- Calibrated: 37.1h ✅

### Confidence Scoring

Based on coefficient of variation:

- **CV < 0.1**: 95% confidence (very tight estimates)
- **CV 0.1-0.2**: 80% confidence (reasonable variance)
- **CV 0.2-0.3**: 60% confidence (high uncertainty)
- **CV > 0.3**: 40% confidence (very uncertain)

---

## 📊 Real-World Example

Based on the Web Search Contextual feature estimation:

### Input

10 steps ranging from 2-10 hours each:

```
1. Data Schema (2/3/4h) - medium
2. User Consent UI (3/4/6h) - medium
3. Google Search Setup (2/3/4h) - low
4. Search Implementation (6/7/10h) - high
5. License Classification (4/5/8h) - high
... (5 more steps)
```

### Output

```
Raw Estimate:        53.0h (6.6 days)
Calibrated:          37.1h (4.6 days)
Historical Factor:   0.70x
Confidence:          75%

Completion Dates:
  Optimistic:  Nov 22 (4 days)
  Realistic:   Nov 25 (5 days)
  Pessimistic: Nov 29 (7 days)

By Complexity:
  low:        10.0h (19%)
  medium:     16.0h (30%)
  high:       27.0h (51%)
```

### After Completion

Track actual time:

```bash
ai-estimate complete <project-id> --hours 35.5
```

Updates historical factor:

```
Previous factor: 0.70x
New data point: 35.5h / 53.0h = 0.67x
Updated factor: 0.69x
```

Future estimates automatically use 0.69x ✅

---

## 🎯 Use Cases

### 1. AI-Assisted Development

Track how long AI actually takes vs. human estimates:

```bash
ai-estimate track --tokens 38000 --lines 3800
```

Compare AI burst output (3.4h) vs. total calendar time (37h).

### 2. Team Velocity

Calibrate by team member:

```typescript
const factor = getBestFactor(calibration, {
  userId: 'developer-a',
  projectType: 'backend-api',
});
// Returns user-specific factor
```

### 3. Project Planning

Generate accurate timelines:

```typescript
const analysis = estimateProject(steps, { historicalFactor: 0.7 });
console.log(`Realistic completion: ${analysis.realisticCompletion}`);
// Nov 25, 2025
```

### 4. Continuous Improvement

Track estimation accuracy over time:

```bash
ai-estimate calibration
```

```
Historical Calibration Data
─────────────────────────────────────────────────────
Data Points:     12
Overall Factor:  0.72x
Interpretation:  Completing faster than estimated

By Project Type:
  web-feature     0.70x
  backend-api     0.80x
  data-migration  0.65x
```

---

## 🗄️ Database Schema

### Firestore Collections

#### `ai_estimator_projects`

```typescript
{
  id: string;
  name: string;
  description: string;
  steps: ProjectStep[];
  estimatedTotalHours: number;
  calibratedHours: number;
  historicalFactor: number;
  confidenceLevel: number;
  status: 'planning' | 'in-progress' | 'completed' | 'cancelled';
  completedSteps: string[];
  actualHours?: number;
  userId: string;
  organizationId?: string;
  projectType?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `ai_estimator_executions`

```typescript
{
  id: string;
  projectId: string;
  stepId: string;
  estimatedHours: number;
  actualHours: number;
  tokensGenerated?: number;
  linesOfCode?: number;
  startedAt: Date;
  completedAt?: Date;
  notes?: string;
}
```

#### `ai_estimator_historical`

```typescript
{
  id: string;
  projectId: string;
  estimatedHours: number;
  actualHours: number;
  accuracyFactor: number;
  projectType: string;
  complexity: 'low' | 'medium' | 'high' | 'very-high';
  completedAt: Date;
  userId: string;
}
```

#### `ai_estimator_calibration`

```typescript
{
  id: string;
  version: string;
  overallFactor: number;
  factorByComplexity: Record<string, number>;
  factorByProjectType: Record<string, number>;
  dataPointsCount: number;
  confidenceInterval: { lower: number; upper: number };
  lastUpdated: Date;
}
```

---

## 🔧 Configuration

### Firestore Indexes

Required for querying:

```json
{
  "indexes": [
    {
      "collectionGroup": "ai_estimator_projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "ai_estimator_historical",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectType", "order": "ASCENDING" },
        { "fieldPath": "completedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 📈 Roadmap

- [x] Core estimation engine
- [x] CLI tool
- [x] MCP server
- [x] NPM SDK
- [x] Firestore adapter
- [ ] Web dashboard
- [ ] GitHub integration
- [ ] Jira sync
- [ ] ML-based calibration
- [ ] Multi-user analytics

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 License

MIT © Flow Platform

---

## 🙏 Acknowledgments

Inspired by the real-world need to accurately estimate AI-assisted development projects based on actual performance data.

Built with ❤️ using TypeScript, MCP SDK, and lots of estimation data.

---

**Made with 🤖 by Flow Platform**


