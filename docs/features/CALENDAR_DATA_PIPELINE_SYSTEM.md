# Calendar-Based Data Pipeline System - Complete Solution

## 🎯 Vision

**Single Unified Platform** where users can:
1. **Schedule data capture events** in a visual calendar
2. **Pause/resume/edit** any scheduled event
3. **Automatically process** captured data through complete pipeline:
   - Transactional indexing (Firestore/BigQuery)
   - Vector store + chunking (RAG-ready)
   - Auto-generate intelligent agents
   - Deploy as data products
   - Monetize immediately

**User Experience:**
```
1. Open Calendar → See all data capture events
2. Click "+ New Event" → Configure data source
3. Drag to schedule time → System handles everything
4. Event runs → Data captured, processed, agent created
5. One-click deploy → Monetize as data product
```

---

## 🏗️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│           CALENDAR-BASED DATA PIPELINE SYSTEM                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📅 CALENDAR UI (User Interface)                                 │
│  ├─ Visual calendar view (month/week/day)                       │
│  ├─ Drag & drop event scheduling                                │
│  ├─ Event templates (Congreso, Web, PDF, API, RSS)             │
│  ├─ Pause/resume/edit/delete events                             │
│  ├─ Event status indicators (running/success/failed)            │
│  └─ Multi-tenant (per organization)                             │
│                                                                  │
│  ↓ User creates event                                           │
│                                                                  │
│  🗄️ EVENT CONFIGURATION (Firestore)                             │
│  ├─ data_capture_events collection                              │
│  │   ├─ Event schedule (cron/calendar)                          │
│  │   ├─ Data source config (URL, API key, etc)                  │
│  │   ├─ Processing pipeline config                              │
│  │   ├─ Agent generation config                                 │
│  │   └─ Monetization settings                                   │
│  └─ event_runs collection (execution history)                   │
│                                                                  │
│  ↓ Scheduled time arrives                                       │
│                                                                  │
│  🤖 ORCHESTRATOR (Cloud Scheduler → Cloud Function)             │
│  ├─ Check calendar for due events                               │
│  ├─ Validate event is active (not paused)                       │
│  ├─ Trigger data capture pipeline                               │
│  └─ Track execution status                                      │
│                                                                  │
│  ↓ Capture data                                                 │
│                                                                  │
│  📡 DATA CAPTURE LAYER                                           │
│  ├─ Puppeteer Scraper (web pages)                              │
│  ├─ PDF Downloader (documents)                                  │
│  ├─ API Client (REST/GraphQL)                                   │
│  ├─ RSS/Atom Parser (feeds)                                     │
│  ├─ Database Connector (MySQL/Postgres)                         │
│  └─ File System (GCS/S3)                                        │
│                                                                  │
│  ↓ Raw data captured                                            │
│                                                                  │
│  🔄 PROCESSING PIPELINE                                          │
│  │                                                              │
│  ├─ STEP 1: EXTRACTION                                          │
│  │   ├─ Gemini 2.5 Flash (HTML/PDF → text)                     │
│  │   ├─ OCR if needed (images)                                  │
│  │   ├─ Structured data extraction                              │
│  │   └─ Metadata enrichment                                     │
│  │                                                              │
│  ├─ STEP 2: TRANSACTIONAL INDEXING                             │
│  │   ├─ Save to Firestore (context_sources)                    │
│  │   ├─ Sync to BigQuery (document_metadata)                   │
│  │   ├─ Full-text search index                                 │
│  │   └─ Relational queries ready                               │
│  │                                                              │
│  ├─ STEP 3: VECTOR STORE + CHUNKING                            │
│  │   ├─ Smart chunking (semantic boundaries)                   │
│  │   ├─ Generate embeddings (text-embedding-004)               │
│  │   ├─ Store in BigQuery GREEN                                │
│  │   ├─ Vector index creation                                  │
│  │   └─ RAG-ready                                              │
│  │                                                              │
│  └─ STEP 4: AGENT GENERATION                                    │
│      ├─ Analyze content (topics, expertise)                    │
│      ├─ Generate system prompt (context-aware)                 │
│      ├─ Create agent (conversations collection)                │
│      ├─ Assign context sources                                 │
│      ├─ Configure for domain/org                               │
│      └─ Ready to use immediately                               │
│                                                                  │
│  ↓ Agent created                                                │
│                                                                  │
│  💰 MONETIZATION LAYER (Optional)                               │
│  ├─ Convert to data product (if configured)                    │
│  ├─ Generate MCP server                                         │
│  ├─ Generate npm SDK                                            │
│  ├─ Publish to marketplace                                      │
│  ├─ Enable Pub/Sub streams                                      │
│  └─ Start billing (Stripe)                                      │
│                                                                  │
│  ↓ Complete                                                     │
│                                                                  │
│  📊 ANALYTICS & MONITORING                                       │
│  ├─ Event execution metrics                                     │
│  ├─ Data quality scores                                         │
│  ├─ Agent performance                                           │
│  ├─ Revenue tracking                                            │
│  └─ Cost monitoring                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📅 Calendar UI Component

### Main Calendar View

**File:** `src/components/DataCaptureCalendar.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { firestore } from '@/lib/firestore';
import { useUser } from '@/hooks/useUser';

const localizer = momentLocalizer(moment);

interface DataCaptureEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'paused';
  sourceType: 'web' | 'pdf' | 'api' | 'rss' | 'database';
  sourceUrl?: string;
  lastRunAt?: Date;
  nextRunAt?: Date;
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  cronExpression?: string;
  processConfig: {
    enableIndexing: boolean;
    enableVectorStore: boolean;
    enableAgentGeneration: boolean;
    enableMonetization: boolean;
  };
}

export function DataCaptureCalendar() {
  const { user, organization } = useUser();
  const [events, setEvents] = useState<DataCaptureEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DataCaptureEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);

  // Load events for organization
  useEffect(() => {
    const unsubscribe = firestore
      .collection('data_capture_events')
      .where('organizationId', '==', organization?.id)
      .onSnapshot((snapshot) => {
        const loadedEvents = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            start: data.nextRunAt?.toDate() || new Date(),
            end: moment(data.nextRunAt?.toDate() || new Date()).add(1, 'hour').toDate(),
          } as DataCaptureEvent;
        });
        setEvents(loadedEvents);
      });

    return () => unsubscribe();
  }, [organization?.id]);

  // Handle selecting a slot (for creating new event)
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setNewEventDate(start);
    setShowCreateModal(true);
  };

  // Handle selecting an event (for editing)
  const handleSelectEvent = (event: DataCaptureEvent) => {
    setSelectedEvent(event);
  };

  // Color coding by status
  const eventStyleGetter = (event: DataCaptureEvent) => {
    let backgroundColor = '#3174ad';
    
    switch (event.status) {
      case 'running':
        backgroundColor = '#3b82f6'; // blue
        break;
      case 'completed':
        backgroundColor = '#10b981'; // green
        break;
      case 'failed':
        backgroundColor = '#ef4444'; // red
        break;
      case 'paused':
        backgroundColor = '#6b7280'; // gray
        break;
      case 'scheduled':
        backgroundColor = '#8b5cf6'; // purple
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: event.status === 'paused' ? 0.5 : 1,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Data Capture Calendar</h1>
          <p className="text-slate-600 mt-1">
            Schedule and manage automated data collection events
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            <span>➕</span>
            New Event
          </button>
          <button className="px-4 py-2 border rounded-lg">
            Templates
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-600 rounded"></div>
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span>Running</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          <span>Failed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-600 rounded opacity-50"></div>
          <span>Paused</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-lg p-4" style={{ height: 'calc(100vh - 250px)' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          selectable
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
        />
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          initialDate={newEventDate}
          organizationId={organization?.id}
        />
      )}

      {/* Event Details Sidebar */}
      {selectedEvent && (
        <EventDetailsSidebar
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={(updated) => {
            // Update event in Firestore
            firestore.collection('data_capture_events').doc(updated.id).update(updated);
          }}
        />
      )}
    </div>
  );
}
```

---

### Create Event Modal

**File:** `src/components/CreateEventModal.tsx`

```typescript
import React, { useState } from 'react';
import { firestore } from '@/lib/firestore';
import { DataCaptureEvent } from '@/types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  organizationId: string;
}

export function CreateEventModal({ isOpen, onClose, initialDate, organizationId }: CreateEventModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [config, setConfig] = useState({
    title: '',
    sourceType: 'web' as const,
    sourceUrl: '',
    sourceConfig: {},
    schedule: {
      type: 'once' as 'once' | 'recurring',
      date: initialDate || new Date(),
      recurrence: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
      cronExpression: '',
    },
    processing: {
      enableIndexing: true,
      enableVectorStore: true,
      enableAgentGeneration: true,
      enableMonetization: false,
    },
    agentConfig: {
      autoGenerate: true,
      title: '',
      model: 'gemini-2.5-flash' as const,
      systemPromptTemplate: '',
      tags: [] as string[],
    },
    monetization: {
      createDataProduct: false,
      pricing: {
        basic: 0,
        professional: 0,
        enterprise: 0,
      },
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Create Data Capture Event</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            <Step number={1} active={step === 1} completed={step > 1} label="Data Source" />
            <div className="flex-1 h-1 bg-slate-200 mx-2"></div>
            <Step number={2} active={step === 2} completed={step > 2} label="Schedule" />
            <div className="flex-1 h-1 bg-slate-200 mx-2"></div>
            <Step number={3} active={step === 3} completed={step > 3} label="Processing" />
            <div className="flex-1 h-1 bg-slate-200 mx-2"></div>
            <Step number={4} active={step === 4} completed={false} label="Review" />
          </div>

          {/* Step Content */}
          {step === 1 && (
            <DataSourceStep
              config={config}
              onChange={setConfig}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <ScheduleStep
              config={config}
              onChange={setConfig}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <ProcessingStep
              config={config}
              onChange={setConfig}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}

          {step === 4 && (
            <ReviewStep
              config={config}
              onBack={() => setStep(3)}
              onCreate={async () => {
                // Create event in Firestore
                await createDataCaptureEvent(config, organizationId);
                onClose();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ number, active, completed, label }: any) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
        completed ? 'bg-green-600 text-white' :
        active ? 'bg-blue-600 text-white' :
        'bg-slate-200 text-slate-600'
      }`}>
        {completed ? '✓' : number}
      </div>
      <span className="text-xs mt-2 font-medium">{label}</span>
    </div>
  );
}
```

---

### Step 1: Data Source Configuration

```typescript
function DataSourceStep({ config, onChange, onNext }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configure Data Source</h3>

      {/* Event Title */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Event Name
        </label>
        <input
          type="text"
          value={config.title}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          placeholder="e.g., Daily Congreso Scrape"
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Source Type */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Source Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <SourceTypeCard
            icon="🌐"
            title="Web Page"
            description="Scrape HTML content"
            selected={config.sourceType === 'web'}
            onClick={() => onChange({ ...config, sourceType: 'web' })}
          />
          <SourceTypeCard
            icon="📄"
            title="PDF Document"
            description="Extract from PDF"
            selected={config.sourceType === 'pdf'}
            onClick={() => onChange({ ...config, sourceType: 'pdf' })}
          />
          <SourceTypeCard
            icon="🔌"
            title="API"
            description="REST/GraphQL endpoint"
            selected={config.sourceType === 'api'}
            onClick={() => onChange({ ...config, sourceType: 'api' })}
          />
          <SourceTypeCard
            icon="📡"
            title="RSS Feed"
            description="Syndicated content"
            selected={config.sourceType === 'rss'}
            onClick={() => onChange({ ...config, sourceType: 'rss' })}
          />
          <SourceTypeCard
            icon="🗄️"
            title="Database"
            description="MySQL/Postgres query"
            selected={config.sourceType === 'database'}
            onClick={() => onChange({ ...config, sourceType: 'database' })}
          />
          <SourceTypeCard
            icon="📁"
            title="File System"
            description="GCS/S3 bucket"
            selected={config.sourceType === 'file'}
            onClick={() => onChange({ ...config, sourceType === 'file' })}
          />
        </div>
      </div>

      {/* Source URL/Config based on type */}
      {config.sourceType === 'web' && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Web URL
          </label>
          <input
            type="url"
            value={config.sourceUrl}
            onChange={(e) => onChange({ ...config, sourceUrl: e.target.value })}
            placeholder="https://congreso.cl/proyectos"
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          {/* Advanced scraping options */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-blue-600">
              Advanced scraping options
            </summary>
            <div className="mt-4 space-y-3 pl-4 border-l-2 border-blue-200">
              <input
                type="text"
                placeholder="Wait for selector (e.g., .content)"
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <input
                type="text"
                placeholder="Extract selector (e.g., article)"
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span className="text-sm">Download linked PDFs</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span className="text-sm">Scroll to bottom (infinite scroll)</span>
              </label>
            </div>
          </details>
        </div>
      )}

      {config.sourceType === 'api' && (
        <div className="space-y-3">
          <input
            type="url"
            placeholder="API Endpoint"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <select className="w-full px-4 py-2 border rounded-lg">
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
          </select>
          <textarea
            placeholder="Headers (JSON)"
            rows={3}
            className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
          />
          <textarea
            placeholder="Request Body (JSON)"
            rows={3}
            className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
          />
        </div>
      )}

      {/* Templates */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Or use a template
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button className="px-4 py-3 border-2 border-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50">
            🏛️ Congreso.cl Projects
          </button>
          <button className="px-4 py-3 border rounded-lg text-sm hover:bg-slate-50">
            📰 News RSS Feed
          </button>
          <button className="px-4 py-3 border rounded-lg text-sm hover:bg-slate-50">
            📊 Financial Data API
          </button>
          <button className="px-4 py-3 border rounded-lg text-sm hover:bg-slate-50">
            📋 Government Documents
          </button>
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={onNext}
          disabled={!config.title || !config.sourceUrl}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          Next: Schedule →
        </button>
      </div>
    </div>
  );
}

function SourceTypeCard({ icon, title, description, selected, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-4 border-2 rounded-lg text-left hover:border-blue-400 transition-colors ${
        selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
      }`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-slate-600 mt-1">{description}</div>
    </button>
  );
}
```

---

### Step 2: Schedule Configuration

```typescript
function ScheduleStep({ config, onChange, onBack, onNext }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configure Schedule</h3>

      {/* Schedule Type */}
      <div>
        <label className="block text-sm font-medium mb-2">
          When should this run?
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onChange({
              ...config,
              schedule: { ...config.schedule, type: 'once' }
            })}
            className={`p-4 border-2 rounded-lg ${
              config.schedule.type === 'once'
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200'
            }`}
          >
            <div className="font-semibold">Once</div>
            <div className="text-sm text-slate-600">Run at specific date/time</div>
          </button>
          <button
            onClick={() => onChange({
              ...config,
              schedule: { ...config.schedule, type: 'recurring' }
            })}
            className={`p-4 border-2 rounded-lg ${
              config.schedule.type === 'recurring'
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200'
            }`}
          >
            <div className="font-semibold">Recurring</div>
            <div className="text-sm text-slate-600">Repeat on schedule</div>
          </button>
        </div>
      </div>

      {/* Date/Time Picker */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={moment(config.schedule.date).format('YYYY-MM-DD')}
            onChange={(e) => onChange({
              ...config,
              schedule: { ...config.schedule, date: new Date(e.target.value) }
            })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Time
          </label>
          <input
            type="time"
            value={moment(config.schedule.date).format('HH:mm')}
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(':');
              const newDate = new Date(config.schedule.date);
              newDate.setHours(parseInt(hours), parseInt(minutes));
              onChange({
                ...config,
                schedule: { ...config.schedule, date: newDate }
              });
            }}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Recurrence Options */}
      {config.schedule.type === 'recurring' && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Repeat Frequency
          </label>
          <div className="grid grid-cols-4 gap-3">
            {['daily', 'weekly', 'monthly', 'custom'].map(freq => (
              <button
                key={freq}
                onClick={() => onChange({
                  ...config,
                  schedule: { ...config.schedule, recurrence: freq }
                })}
                className={`px-4 py-3 border-2 rounded-lg capitalize ${
                  config.schedule.recurrence === freq
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200'
                }`}
              >
                {freq}
              </button>
            ))}
          </div>

          {/* Custom Cron Expression */}
          {config.schedule.recurrence === 'custom' && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Cron Expression
              </label>
              <input
                type="text"
                value={config.schedule.cronExpression}
                onChange={(e) => onChange({
                  ...config,
                  schedule: { ...config.schedule, cronExpression: e.target.value }
                })}
                placeholder="0 9 * * 1-5  (Every weekday at 9 AM)"
                className="w-full px-4 py-2 border rounded-lg font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                Use cron syntax for custom schedules. 
                <a href="https://crontab.guru" target="_blank" className="text-blue-600 ml-1">
                  Need help?
                </a>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Timezone
        </label>
        <select className="w-full px-4 py-2 border rounded-lg">
          <option value="America/Santiago">America/Santiago (Chile)</option>
          <option value="America/New_York">America/New_York (EST)</option>
          <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
          <option value="Europe/London">Europe/London (GMT)</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      {/* Next Run Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm font-medium text-blue-900 mb-1">
          Next run scheduled for:
        </div>
        <div className="text-lg font-bold text-blue-700">
          {moment(config.schedule.date).format('MMMM D, YYYY [at] h:mm A')}
        </div>
        {config.schedule.type === 'recurring' && (
          <div className="text-sm text-blue-600 mt-1">
            Then {config.schedule.recurrence} at the same time
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-2 border rounded-lg"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Next: Processing →
        </button>
      </div>
    </div>
  );
}
```

---

### Step 3: Processing Configuration

```typescript
function ProcessingStep({ config, onChange, onBack, onNext }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configure Processing Pipeline</h3>

      <p className="text-sm text-slate-600">
        Choose what happens after data is captured
      </p>

      {/* Processing Options */}
      <div className="space-y-4">
        {/* Transactional Indexing */}
        <ProcessingOption
          title="Transactional Indexing"
          description="Save to Firestore + BigQuery for queries, analytics, and reporting"
          icon="🗄️"
          enabled={config.processing.enableIndexing}
          onChange={(enabled) => onChange({
            ...config,
            processing: { ...config.processing, enableIndexing: enabled }
          })}
          features={[
            'Firestore context_sources collection',
            'BigQuery document_metadata table',
            'Full-text search ready',
            'Relational queries enabled'
          ]}
        />

        {/* Vector Store + RAG */}
        <ProcessingOption
          title="Vector Store + Chunking (RAG)"
          description="Generate embeddings and chunk for semantic search and AI retrieval"
          icon="🔍"
          enabled={config.processing.enableVectorStore}
          onChange={(enabled) => onChange({
            ...config,
            processing: { ...config.processing, enableVectorStore: enabled }
          })}
          features={[
            'Smart semantic chunking',
            'text-embedding-004 embeddings',
            'BigQuery GREEN vector store',
            'RAG-ready for AI agents'
          ]}
          dependsOn={config.processing.enableIndexing ? null : 'Requires Transactional Indexing'}
        />

        {/* Auto-Generate Agent */}
        <ProcessingOption
          title="Auto-Generate AI Agent"
          description="Create an intelligent agent with captured content as context"
          icon="🤖"
          enabled={config.processing.enableAgentGeneration}
          onChange={(enabled) => onChange({
            ...config,
            processing: { ...config.processing, enableAgentGeneration: enabled }
          })}
          features={[
            'Context-aware system prompt',
            'Automatic topic detection',
            'Assigned to your organization',
            'Ready to chat immediately'
          ]}
          dependsOn={config.processing.enableVectorStore ? null : 'Requires Vector Store'}
        />

        {/* Monetize as Data Product */}
        <ProcessingOption
          title="Monetize as Data Product"
          description="Publish to marketplace with MCP server, npm SDK, and API access"
          icon="💰"
          enabled={config.processing.enableMonetization}
          onChange={(enabled) => onChange({
            ...config,
            processing: { ...config.processing, enableMonetization: enabled }
          })}
          features={[
            'Auto-generate MCP server',
            'Auto-generate npm SDK',
            'REST API endpoints',
            'Pub/Sub streaming',
            'Stripe billing integration'
          ]}
          dependsOn={config.processing.enableAgentGeneration ? null : 'Requires Agent Generation'}
        />
      </div>

      {/* Agent Configuration (if enabled) */}
      {config.processing.enableAgentGeneration && (
        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">Agent Configuration</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Agent Name Template
              </label>
              <input
                type="text"
                value={config.agentConfig.title}
                onChange={(e) => onChange({
                  ...config,
                  agentConfig: { ...config.agentConfig, title: e.target.value }
                })}
                placeholder="e.g., {source_title} Assistant"
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-xs text-slate-500 mt-1">
                Use {'{source_title}'}, {'{date}'}, {'{topic}'} as placeholders
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                AI Model
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onChange({
                    ...config,
                    agentConfig: { ...config.agentConfig, model: 'gemini-2.5-flash' }
                  })}
                  className={`px-4 py-3 border-2 rounded-lg ${
                    config.agentConfig.model === 'gemini-2.5-flash'
                      ? 'border-green-600 bg-green-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="font-semibold">⚡ Flash</div>
                  <div className="text-xs text-slate-600">Fast & efficient</div>
                </button>
                <button
                  onClick={() => onChange({
                    ...config,
                    agentConfig: { ...config.agentConfig, model: 'gemini-2.5-pro' }
                  })}
                  className={`px-4 py-3 border-2 rounded-lg ${
                    config.agentConfig.model === 'gemini-2.5-pro'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="font-semibold">💎 Pro</div>
                  <div className="text-xs text-slate-600">Maximum quality</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                System Prompt Template (Optional)
              </label>
              <textarea
                value={config.agentConfig.systemPromptTemplate}
                onChange={(e) => onChange({
                  ...config,
                  agentConfig: { ...config.agentConfig, systemPromptTemplate: e.target.value }
                })}
                placeholder="Leave empty for auto-generated prompt based on content..."
                rows={4}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                placeholder="legal, regulations, chile"
                onChange={(e) => onChange({
                  ...config,
                  agentConfig: {
                    ...config.agentConfig,
                    tags: e.target.value.split(',').map(t => t.trim())
                  }
                })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Monetization Configuration (if enabled) */}
      {config.processing.enableMonetization && (
        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">Monetization Settings</h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Basic Tier ($/mo)
                </label>
                <input
                  type="number"
                  value={config.monetization.pricing.basic}
                  onChange={(e) => onChange({
                    ...config,
                    monetization: {
                      ...config.monetization,
                      pricing: {
                        ...config.monetization.pricing,
                        basic: parseInt(e.target.value)
                      }
                    }
                  })}
                  placeholder="79"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Professional ($/mo)
                </label>
                <input
                  type="number"
                  value={config.monetization.pricing.professional}
                  onChange={(e) => onChange({
                    ...config,
                    monetization: {
                      ...config.monetization,
                      pricing: {
                        ...config.monetization.pricing,
                        professional: parseInt(e.target.value)
                      }
                    }
                  })}
                  placeholder="399"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enterprise ($/mo)
                </label>
                <input
                  type="number"
                  value={config.monetization.pricing.enterprise}
                  onChange={(e) => onChange({
                    ...config,
                    monetization: {
                      ...config.monetization,
                      pricing: {
                        ...config.monetization.pricing,
                        enterprise: parseInt(e.target.value)
                      }
                    }
                  })}
                  placeholder="1999"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.monetization.createDataProduct}
                onChange={(e) => onChange({
                  ...config,
                  monetization: {
                    ...config.monetization,
                    createDataProduct: e.target.checked
                  }
                })}
              />
              <span className="text-sm">
                Publish to marketplace immediately after first capture
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-2 border rounded-lg"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Next: Review →
        </button>
      </div>
    </div>
  );
}

function ProcessingOption({ title, description, icon, enabled, onChange, features, dependsOn }: any) {
  return (
    <div className={`border-2 rounded-lg p-4 ${
      enabled ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
    } ${dependsOn ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          disabled={!!dependsOn}
          className="mt-1 w-5 h-5"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{icon}</span>
            <h4 className="font-semibold">{title}</h4>
          </div>
          <p className="text-sm text-slate-600 mb-2">{description}</p>
          {dependsOn && (
            <p className="text-xs text-red-600 mb-2">⚠️ {dependsOn}</p>
          )}
          {enabled && (
            <ul className="text-xs text-slate-600 space-y-1">
              {features.map((feature: string, i: number) => (
                <li key={i}>✓ {feature}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 🗄️ Data Model (Firestore Collections)

### Collection: `data_capture_events`

```typescript
interface DataCaptureEvent {
  // Identity
  id: string;
  userId: string;
  organizationId: string;
  
  // Event Details
  title: string;
  description?: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'paused';
  
  // Data Source
  sourceType: 'web' | 'pdf' | 'api' | 'rss' | 'database' | 'file';
  sourceUrl?: string;
  sourceConfig: {
    // Web scraping
    waitForSelector?: string;
    extractSelector?: string;
    scrollToBottom?: boolean;
    downloadPDFs?: boolean;
    clickSelectors?: string[];
    
    // API
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    
    // Database
    connectionString?: string;
    query?: string;
    
    // File
    bucketName?: string;
    filePath?: string;
  };
  
  // Schedule
  scheduleType: 'once' | 'recurring';
  nextRunAt: Date;
  lastRunAt?: Date;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'custom';
  cronExpression?: string;
  timezone: string;
  
  // Processing Pipeline
  processingConfig: {
    enableIndexing: boolean;           // Save to Firestore + BigQuery
    enableVectorStore: boolean;        // Generate embeddings + chunk
    enableAgentGeneration: boolean;    // Auto-create agent
    enableMonetization: boolean;       // Publish as data product
  };
  
  // Agent Configuration (if enableAgentGeneration)
  agentConfig?: {
    autoGenerate: boolean;
    titleTemplate: string;             // "e.g., {source_title} Assistant"
    model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    systemPromptTemplate?: string;
    tags: string[];
    assignToDomains?: string[];
    createdAgentId?: string;           // Set after first run
  };
  
  // Monetization Configuration (if enableMonetization)
  monetizationConfig?: {
    createDataProduct: boolean;
    dataProductId?: string;            // Set after first run
    pricing: {
      basic: number;
      professional: number;
      enterprise: number;
    };
    accessMethods: ('mcp' | 'npm' | 'api' | 'pubsub')[];
  };
  
  // Execution Stats
  runCount: number;
  successCount: number;
  failureCount: number;
  lastError?: {
    message: string;
    timestamp: Date;
  };
  averageDurationMs?: number;
  totalItemsCaptured?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  source: 'localhost' | 'production';
}
```

**Indexes:**
```
- organizationId ASC, nextRunAt ASC
- status ASC, nextRunAt ASC
- userId ASC, createdAt DESC
```

---

### Collection: `event_runs`

```typescript
interface EventRun {
  id: string;
  eventId: string;
  userId: string;
  organizationId: string;
  
  // Execution
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  
  // Capture Results
  itemsCaptured: number;
  bytesDownloaded: number;
  sourceHash?: string;                 // MD5 of captured content
  hasChanges: boolean;                 // Different from previous run
  
  // Processing Results
  indexingResult?: {
    contextSourceId: string;
    recordsCreated: number;
    bigQueryRowsInserted: number;
  };
  
  vectorizationResult?: {
    chunksCreated: number;
    embeddingsGenerated: number;
    vectorStoreId: string;
  };
  
  agentGenerationResult?: {
    agentId: string;
    agentTitle: string;
    systemPromptGenerated: string;
  };
  
  monetizationResult?: {
    dataProductId: string;
    mcpServerId?: string;
    npmPackageName?: string;
    publishedToMarketplace: boolean;
  };
  
  // Costs
  estimatedCost: number;               // USD
  inputTokens: number;
  outputTokens: number;
  
  // Error
  error?: {
    message: string;
    code: string;
    stack?: string;
    screenshotPath?: string;
  };
  
  // Storage
  gcsPath?: string;                    // Raw captured data
  
  timestamp: Date;
}
```

**Indexes:**
```
- eventId ASC, timestamp DESC
- organizationId ASC, status ASC
- status ASC, startedAt DESC
```

---

## 🤖 Complete Processing Pipeline

**File:** `src/lib/event-processor.ts`

```typescript
import { firestore } from './firestore';
import { ScraperEngine } from './scraper-engine';
import { extractWithGemini } from './gemini';
import { vectorizeContent } from './bigquery-green';
import { generateAgent } from './agent-generator';
import { createDataProduct } from './data-product-generator';

export class EventProcessor {
  private scraperEngine: ScraperEngine;

  constructor() {
    this.scraperEngine = new ScraperEngine();
  }

  async processEvent(eventId: string): Promise<EventRun> {
    const runId = `run_${Date.now()}`;
    const startTime = Date.now();

    try {
      // 1. Load event configuration
      const eventDoc = await firestore.collection('data_capture_events').doc(eventId).get();
      if (!eventDoc.exists) {
        throw new Error(`Event ${eventId} not found`);
      }

      const event = { id: eventDoc.id, ...eventDoc.data() } as DataCaptureEvent;

      // Check if paused
      if (event.status === 'paused') {
        console.log(`Event ${eventId} is paused, skipping`);
        return null;
      }

      // 2. Create run record
      const run: Partial<EventRun> = {
        id: runId,
        eventId: eventId,
        userId: event.userId,
        organizationId: event.organizationId,
        status: 'running',
        startedAt: new Date(),
        timestamp: new Date(),
      };
      
      await firestore.collection('event_runs').doc(runId).set(run);

      // Update event status
      await firestore.collection('data_capture_events').doc(eventId).update({
        status: 'running',
        lastRunAt: new Date(),
      });

      // 3. CAPTURE DATA
      console.log(`📡 Capturing data from ${event.sourceType}: ${event.sourceUrl}`);
      
      const captureResult = await this.captureData(event);
      
      run.itemsCaptured = captureResult.itemCount;
      run.bytesDownloaded = captureResult.sizeBytes;
      run.sourceHash = captureResult.hash;
      run.hasChanges = true; // TODO: Compare with previous run
      run.gcsPath = captureResult.gcsPath;

      // 4. PROCESSING PIPELINE

      // Step 4a: Transactional Indexing
      if (event.processingConfig.enableIndexing) {
        console.log(`🗄️  Indexing ${captureResult.items.length} items...`);
        
        run.indexingResult = await this.indexData(
          event,
          captureResult.items,
          runId
        );
      }

      // Step 4b: Vector Store + Chunking
      if (event.processingConfig.enableVectorStore && run.indexingResult) {
        console.log(`🔍 Vectorizing content...`);
        
        run.vectorizationResult = await this.vectorizeData(
          run.indexingResult.contextSourceId,
          captureResult.items
        );
      }

      // Step 4c: Agent Generation
      if (event.processingConfig.enableAgentGeneration && run.vectorizationResult) {
        console.log(`🤖 Generating AI agent...`);
        
        run.agentGenerationResult = await this.generateAgent(
          event,
          run.indexingResult!.contextSourceId,
          captureResult
        );
      }

      // Step 4d: Monetization
      if (event.processingConfig.enableMonetization && run.agentGenerationResult) {
        console.log(`💰 Creating data product...`);
        
        run.monetizationResult = await this.monetizeData(
          event,
          run.agentGenerationResult.agentId,
          run.indexingResult!.contextSourceId
        );
      }

      // 5. Complete run
      run.status = 'completed';
      run.completedAt = new Date();
      run.durationMs = Date.now() - startTime;
      run.estimatedCost = this.calculateCost(run);

      await firestore.collection('event_runs').doc(runId).update(run);

      // Update event
      await firestore.collection('data_capture_events').doc(eventId).update({
        status: 'completed',
        runCount: admin.firestore.FieldValue.increment(1),
        successCount: admin.firestore.FieldValue.increment(1),
        averageDurationMs: run.durationMs,
        totalItemsCaptured: admin.firestore.FieldValue.increment(run.itemsCaptured),
        nextRunAt: this.calculateNextRun(event),
      });

      console.log(`✅ Event ${eventId} completed successfully`);
      
      return run as EventRun;

    } catch (error) {
      console.error(`❌ Event ${eventId} failed:`, error);
      
      // Log error
      await this.handleError(eventId, runId, error);
      
      throw error;
    }
  }

  private async captureData(event: DataCaptureEvent) {
    switch (event.sourceType) {
      case 'web':
        return await this.captureFromWeb(event);
      case 'pdf':
        return await this.captureFromPDF(event);
      case 'api':
        return await this.captureFromAPI(event);
      case 'rss':
        return await this.captureFromRSS(event);
      case 'database':
        return await this.captureFromDatabase(event);
      case 'file':
        return await this.captureFromFile(event);
      default:
        throw new Error(`Unsupported source type: ${event.sourceType}`);
    }
  }

  private async captureFromWeb(event: DataCaptureEvent) {
    // Use ScraperEngine
    const result = await this.scraperEngine.scrape({
      url: event.sourceUrl!,
      settings: event.sourceConfig,
    });

    return {
      items: result.items,
      itemCount: result.items.length,
      sizeBytes: result.totalBytes,
      hash: result.contentHash,
      gcsPath: result.gcsPath,
    };
  }

  private async indexData(
    event: DataCaptureEvent,
    items: any[],
    runId: string
  ) {
    const contextSourceIds: string[] = [];
    
    for (const item of items) {
      // Extract text with Gemini
      const extracted = await extractWithGemini(item.content, 'gemini-2.5-flash');
      
      // Create context source in Firestore
      const contextSource = await firestore.collection('context_sources').add({
        userId: event.userId,
        organizationId: event.organizationId,
        name: item.title || event.title,
        type: 'web-url',
        url: item.url || event.sourceUrl,
        extractedData: extracted.text,
        metadata: {
          eventId: event.id,
          runId: runId,
          capturedAt: new Date(),
          sourceType: event.sourceType,
          model: 'gemini-2.5-flash',
          charactersExtracted: extracted.text.length,
        },
        assignedToAgents: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
      });
      
      contextSourceIds.push(contextSource.id);
      
      // Sync to BigQuery (for analytics)
      // await syncToBigQuery(contextSource.id, extracted.text);
    }

    return {
      contextSourceId: contextSourceIds[0], // Primary source
      recordsCreated: contextSourceIds.length,
      bigQueryRowsInserted: contextSourceIds.length,
    };
  }

  private async vectorizeData(contextSourceId: string, items: any[]) {
    const chunks = await vectorizeContent(contextSourceId, items[0].content);
    
    return {
      chunksCreated: chunks.length,
      embeddingsGenerated: chunks.length,
      vectorStoreId: 'salfagpt.flow_dataset.vector_search_green',
    };
  }

  private async generateAgent(
    event: DataCaptureEvent,
    contextSourceId: string,
    captureResult: any
  ) {
    const agentConfig = event.agentConfig!;
    
    // Generate title from template
    const title = agentConfig.titleTemplate
      .replace('{source_title}', captureResult.items[0]?.title || event.title)
      .replace('{date}', new Date().toISOString().split('T')[0])
      .replace('{topic}', agentConfig.tags[0] || 'general');

    // Generate or use custom system prompt
    const systemPrompt = agentConfig.systemPromptTemplate || 
      this.generateSystemPrompt(captureResult, event);

    // Create agent
    const agentRef = await firestore.collection('conversations').add({
      userId: event.userId,
      organizationId: event.organizationId,
      title: title,
      agentModel: agentConfig.model,
      agentPrompt: systemPrompt,
      activeContextSourceIds: [contextSourceId],
      tags: agentConfig.tags,
      metadata: {
        eventId: event.id,
        autoGenerated: true,
        sourceUrl: event.sourceUrl,
        sourceType: event.sourceType,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
    });

    // Store agent ID in event (for subsequent runs)
    await firestore.collection('data_capture_events').doc(event.id).update({
      'agentConfig.createdAgentId': agentRef.id,
    });

    return {
      agentId: agentRef.id,
      agentTitle: title,
      systemPromptGenerated: systemPrompt,
    };
  }

  private async monetizeData(
    event: DataCaptureEvent,
    agentId: string,
    contextSourceId: string
  ) {
    const monetizationConfig = event.monetizationConfig!;
    
    // Create data product
    const dataProduct = await createDataProduct({
      name: event.title,
      category: 'custom',
      sourceType: event.sourceType,
      sourceAgentId: agentId,
      sourceContextIds: [contextSourceId],
      pricing: monetizationConfig.pricing,
      accessMethods: monetizationConfig.accessMethods,
      organizationId: event.organizationId,
    });

    // Generate MCP server (if enabled)
    let mcpServerId: string | undefined;
    if (monetizationConfig.accessMethods.includes('mcp')) {
      mcpServerId = await generateMCPServer(dataProduct.id, event.organizationId);
    }

    // Generate npm SDK (if enabled)
    let npmPackageName: string | undefined;
    if (monetizationConfig.accessMethods.includes('npm')) {
      npmPackageName = await generateNPMSDK(dataProduct.id);
    }

    // Publish to marketplace (if configured)
    if (monetizationConfig.createDataProduct) {
      await firestore.collection('data_products').doc(dataProduct.id).update({
        featured: true,
        published: true,
      });
    }

    // Store data product ID in event
    await firestore.collection('data_capture_events').doc(event.id).update({
      'monetizationConfig.dataProductId': dataProduct.id,
    });

    return {
      dataProductId: dataProduct.id,
      mcpServerId,
      npmPackageName,
      publishedToMarketplace: monetizationConfig.createDataProduct,
    };
  }

  private generateSystemPrompt(captureResult: any, event: DataCaptureEvent): string {
    const summary = captureResult.items[0]?.content?.substring(0, 500) + '...';
    
    return `You are an AI assistant specialized in ${event.agentConfig?.tags.join(', ') || 'general knowledge'}.

You have access to content captured from ${event.sourceUrl}, including:
- ${captureResult.itemCount} documents
- Captured on ${new Date().toLocaleDateString()}
- Source type: ${event.sourceType}

CONTENT SUMMARY:
${summary}

Your role is to:
1. Answer questions accurately based on the captured content
2. Cite specific sources when relevant
3. Admit when information is not available in your context
4. Provide actionable, helpful responses

Always base your answers on the official captured content.`;
  }

  private calculateNextRun(event: DataCaptureEvent): Date {
    if (event.scheduleType === 'once') {
      return null; // No next run for one-time events
    }

    const now = new Date();
    
    switch (event.recurrence) {
      case 'daily':
        return moment(now).add(1, 'day').toDate();
      case 'weekly':
        return moment(now).add(1, 'week').toDate();
      case 'monthly':
        return moment(now).add(1, 'month').toDate();
      case 'custom':
        // Parse cron and calculate next
        return cronParser.parseExpression(event.cronExpression!).next().toDate();
      default:
        return null;
    }
  }

  private calculateCost(run: Partial<EventRun>): number {
    let cost = 0;
    
    // Gemini extraction costs
    if (run.inputTokens) {
      cost += (run.inputTokens / 1000) * 0.00015; // $0.15 per 1M tokens
    }
    
    // Vectorization costs
    if (run.vectorizationResult) {
      cost += (run.vectorizationResult.embeddingsGenerated / 1000) * 0.0001; // $0.10 per 1M embeddings
    }
    
    // Storage costs (minimal)
    cost += 0.01;
    
    return cost;
  }

  private async handleError(eventId: string, runId: string, error: any) {
    // Update run
    await firestore.collection('event_runs').doc(runId).update({
      status: 'failed',
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN',
        stack: error.stack,
      },
    });

    // Update event
    await firestore.collection('data_capture_events').doc(eventId).update({
      status: 'failed',
      failureCount: admin.firestore.FieldValue.increment(1),
      lastError: {
        message: error.message,
        timestamp: new Date(),
      },
    });
  }
}
```

---

## 📋 Deployable Business Models

Now I'll create complete, ready-to-deploy business model templates for common use cases. These are full business plans you can launch immediately.

Let me continue in a follow-up document...


