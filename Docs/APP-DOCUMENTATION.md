# AI Generator React - Complete Application Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Authentication & User Roles](#3-authentication--user-roles)
4. [Core Features](#4-core-features)
5. [Pages & Routes](#5-pages--routes)
6. [Data Model](#6-data-model)
7. [Services Layer](#7-services-layer)
8. [Offline Support](#8-offline-support)
9. [State Management](#9-state-management)
10. [Export Features](#10-export-features)
11. [Integrations](#11-integrations)
12. [Calculations](#12-calculations)
13. [Localization](#13-localization)
14. [Theme System](#14-theme-system)
15. [Security](#15-security)
16. [Project Structure](#16-project-structure)
17. [Deployment](#17-deployment)

---

## 1. Overview

### What is AI Generator React?

A professional **water and air tightness testing management platform** designed for construction testing companies. The application digitizes the entire workflow of testing construction elements (shafts, pipes, gullies, channels) and generates compliance reports.

### Target Users

| User Type | Description |
|-----------|-------------|
| **Examiners** | Field professionals conducting water/air tests |
| **Site Managers** | Construction managers overseeing projects |
| **Administrators** | Staff managing examiners, materials, and system settings |
| **Customers** | Contractors receiving test reports |

### Key Capabilities

- Digital test report creation with automatic calculations
- Customer and construction site management
- Appointment scheduling with examiner assignments
- Word/PDF report generation
- Offline-first architecture with automatic sync
- Real-time team chat
- Multi-language support (Croatian/English)
- Role-based access control

---

## 2. Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19.2 + TypeScript 5.9 |
| **Build Tool** | Vite 7.2 |
| **Styling** | Tailwind CSS |
| **Routing** | React Router DOM 7.9 |
| **State Management** | React Query (TanStack) + Context API |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **Offline Storage** | IndexedDB |

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (React Components + Pages)                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CUSTOM HOOKS                             │
│        (useCustomers, useReports, useOfflineMutation)           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICES LAYER                            │
│   (customerService, reportService, appointmentService, etc.)    │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│      SUPABASE CLIENT      │   │        OFFLINE DATABASE       │
│   (PostgreSQL REST API)   │   │          (IndexedDB)          │
└───────────────────────────┘   └───────────────────────────────┘
                │                               │
                └───────────────┬───────────────┘
                                ▼
                    ┌───────────────────────┐
                    │      SYNC SERVICE     │
                    │  (Bidirectional Sync) │
                    └───────────────────────┘
```

---

## 3. Authentication & User Roles

### Authentication Flow

1. User enters username/email and password on `/login`
2. Supabase Auth validates credentials
3. On success, session token stored and profile loaded
4. User redirected to dashboard (or `/customers` in low-bandwidth mode)

### User Roles

| Role | Permissions |
|------|-------------|
| **User** | Create/edit reports, manage customers/constructions, schedule appointments, participate in chat, view analytics |
| **Admin** | All user permissions + manage examiners, manage materials, assign admin roles, manage accreditations |

### Profile Structure

```typescript
interface Profile {
  id: string;              // Auth user ID (UUID)
  name: string;            // First name
  last_name: string;       // Last name
  username: string;        // Login username
  email?: string;          // Email address
  title?: string;          // Professional title
  gender?: 'M' | 'F';      // For salutation in reports
  avatar_url?: string;     // Profile picture URL
  role: 'user' | 'admin';  // Access level
  accreditations: number[]; // Report type IDs user can certify
}
```

---

## 4. Core Features

### 4.1 Customer Management

Manage clients/contractors who commission testing work.

**Capabilities:**
- Create, edit, delete customers
- Search by name, location, work order, address
- Filter by creation year
- Sort by various fields
- Paginated listing
- Link to construction sites

**Customer Fields:**
- Name, Work Order, Location, Address
- Postal Code, City, OIB (tax ID)
- Created/Updated timestamps

---

### 4.2 Construction Management

Manage construction sites/projects for each customer.

**Capabilities:**
- Create, edit, delete constructions
- Archive/unarchive (soft delete)
- Link to customer
- View associated reports
- Track active vs. completed projects

**Construction Fields:**
- Name, Work Order, Location
- Active/Archived status
- Customer reference
- Created/Updated timestamps

---

### 4.3 Water & Air Testing Forms

The core functionality - creating digital test reports.

#### Water Method Form (WaterMethodForm)

**Step 1 - Parameters:**
- Examination date
- Examination procedure selection
- Structure type (round shaft, rectangular shaft, pipe, etc.)
- Scheme selection (A, B, C, D, E)
- Material selection (shaft material, pipe material)
- Dimensions (diameter, width, length, height)
- Temperature parameters

**Step 2 - Measurements:**
- Start/End pressure readings
- Start/End water level readings
- Stabilization time
- Saturation time
- Test duration
- Remarks and deviations

**Automatic Calculations:**
- Pressure loss
- Water volume loss
- Wetted surface area
- Allowed loss (per standards)
- **PASS/FAIL determination**

#### Air Method Form (AirMethodForm)

Similar structure adapted for air tightness testing with:
- Air pressure measurements
- Air-specific calculations
- Air leakage determination

---

### 4.4 Report Management

**Features:**
- Create reports from scratch or from drafts
- Edit existing reports
- Delete reports
- Organize by construction site
- Global reports view
- Ordinal numbering within construction
- Draft templates for reuse

---

### 4.5 Calendar & Appointments

Schedule and manage examination appointments.

**Features:**
- Month/Week/Day/Agenda views
- Create appointments with:
  - Title and description
  - Date and time
  - Customer and construction link
  - Multiple examiner assignments
  - Location details
- Edit and delete appointments
- Croatian/English date localization

---

### 4.6 Report Export & History

Generate professional documents from test data.

**Word Export (DOCX):**
- Template-based generation (`method1610.docx`)
- Dynamic content population via docxtemplater
- Embedded images from construction photos
- Optional PDF attachments appended
- Gender-aware salutations
- All measurements and calculations included

**PDF Export:**
- Batch export multiple reports
- Structured table layout
- Direct download

**Export History:**
- Track all exports with metadata
- Certifier, date, customer, construction
- Water/air remarks and deviations
- Searchable and filterable

---

### 4.7 Team Chat

Real-time messaging for team communication.

**Features:**
- Send/receive messages instantly
- Edit and delete own messages
- See sender profile and avatar
- Message timestamps
- Edit indicators
- Supabase Realtime subscriptions

---

### 4.8 Materials Management

Manage testing materials (admin only).

**Material Types:**
- **Shaft Materials** (type 1) - Window/shaft construction materials
- **Pipe Materials** (type 2) - Pipeline materials

**Capabilities:**
- Add new materials
- Edit material names
- Delete unused materials
- Protection against deleting in-use materials

---

### 4.9 Examiners Management

Manage testing professionals (admin only).

**Features:**
- Create examiner profiles
- Edit profile information
- Reset passwords
- Assign accreditations (water/air certification)
- Promote to admin role
- Upload profile avatars
- Automatic auth user creation

---

### 4.10 Analytics Dashboard

Visual statistics and metrics.

**Displays:**
- Pass/fail rates for water tests
- Pass/fail rates for air tests
- Total tests conducted
- Average test duration
- Recent activity (7-day window)
- Customer count
- Construction sites summary

---

## 5. Pages & Routes

| Route | Component | Description | Auth Required | Admin Only |
|-------|-----------|-------------|---------------|------------|
| `/login` | Login | User authentication | No | No |
| `/` | Dashboard | Overview stats and activity | Yes | No |
| `/customers` | Customers | Customer listing and search | Yes | No |
| `/customers/new` | CustomerForm | Create new customer | Yes | No |
| `/customers/:id` | CustomerForm | Edit customer | Yes | No |
| `/customers/:customerId/constructions` | Constructions | Construction sites for customer | Yes | No |
| `/customers/:customerId/constructions/new` | ConstructionForm | Create construction | Yes | No |
| `/customers/:customerId/constructions/:id` | ConstructionForm | Edit construction | Yes | No |
| `/customers/:customerId/constructions/:constructionId/reports` | ConstructionReports | Reports for construction | Yes | No |
| `/customers/:customerId/constructions/:constructionId/reports/new/water` | WaterMethodForm | Create water test | Yes | No |
| `/customers/:customerId/constructions/:constructionId/reports/new/air` | AirMethodForm | Create air test | Yes | No |
| `/customers/:customerId/constructions/:constructionId/reports/:id` | WaterMethodForm | Edit water test | Yes | No |
| `/customers/:customerId/constructions/:constructionId/reports/air/:id` | AirMethodForm | Edit air test | Yes | No |
| `/reports` | Reports | Global reports view | Yes | No |
| `/history` | History | Export history | Yes | No |
| `/history/:id` | HistoryDetails | Export details | Yes | No |
| `/calendar` | Calendar | Appointment scheduling | Yes | No |
| `/examiners` | Examiners | Examiner management | Yes | **Yes** |
| `/settings` | Settings | App settings and materials | Yes | Partial |
| `/analytics` | Analytics | Statistics dashboard | Yes | No |
| `/profile` | Profile | User profile | Yes | No |
| `/help` | Help | Support and help center | Yes | No |
| `/chat` | Chat | Team messaging | Yes | No |

---

## 6. Data Model

### Entity Relationship Diagram

```
┌─────────────┐       ┌───────────────────┐       ┌──────────────┐
│  customers  │──1:N──│   constructions   │──1:N──│ report_forms │
└─────────────┘       └───────────────────┘       └──────────────┘
       │                      │                          │
       │                      │                          │
       │              ┌───────┴───────┐                  │
       │              │               │                  │
       ▼              ▼               ▼                  ▼
┌─────────────┐ ┌───────────┐ ┌─────────────┐ ┌────────────────┐
│ appointments│ │report_    │ │report_files │ │report_exports  │
└─────────────┘ │exports    │ └─────────────┘ └────────────────┘
       │        └───────────┘                         │
       │              │                               │
       ▼              ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                          profiles                            │
│              (examiners / users / admins)                    │
└─────────────────────────────────────────────────────────────┘
```

### Main Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `customers` | Client/contractor records | name, work_order, location, address, oib |
| `constructions` | Construction sites | name, work_order, location, customer_id, is_archived |
| `report_forms` | Test report data | 44 fields including measurements, calculations, results |
| `report_exports` | Finalized exports | certifier_id, customer_id, construction_id, remarks |
| `report_export_forms` | Junction table | Links exports to forms |
| `appointments` | Scheduled exams | date, time, customer_id, construction_id, examiner_ids |
| `appointment_assignees` | Examiner assignments | appointment_id, examiner_id |
| `calendar_events` | Calendar entries | start, end, title, examiner_ids, customer_id |
| `profiles` | User profiles | name, last_name, username, role, accreditations |
| `materials` | Testing materials | name, material_type_id |
| `material_types` | Material categories | name (Shaft/Pipe) |
| `examination_procedures` | Test procedures | name, description |
| `report_types` | Water/Air types | name |
| `report_drafts` | Report templates | name, data |
| `report_files` | File attachments | report_id, file_path, file_type |
| `messages` | Chat messages | user_id, content, created_at |
| `certifiers` | Certifier info | name, credentials |

---

## 7. Services Layer

Each service handles CRUD operations for its domain.

### customerService

```typescript
customerService.getAll(options)      // Paginated list with filters
customerService.getById(id)          // Single customer
customerService.create(data)         // Create customer
customerService.update(id, data)     // Update customer
customerService.delete(id)           // Delete (cascade)
```

### constructionService

```typescript
constructionService.getByCustomer(customerId)  // Constructions for customer
constructionService.getById(id)                // Single construction
constructionService.create(data)               // Create construction
constructionService.update(id, data)           // Update construction
constructionService.delete(id)                 // Delete construction
constructionService.archive(id)                // Archive construction
```

### reportService

```typescript
reportService.getAll()                         // All reports
reportService.getByConstruction(constructionId) // Reports for construction
reportService.getById(id)                      // Single report
reportService.create(data)                     // Create report
reportService.update(id, data)                 // Update report
reportService.delete(id)                       // Delete report
```

### appointmentService

```typescript
appointmentService.getAll()                    // All appointments
appointmentService.getByDateRange(start, end)  // Filtered by date
appointmentService.create(data)                // Create appointment
appointmentService.update(id, data)            // Update appointment
appointmentService.delete(id)                  // Delete appointment
```

### examinerService

```typescript
examinerService.getAll()                       // All examiners
examinerService.create(data)                   // Create examiner + auth user
examinerService.update(id, data)               // Update examiner
examinerService.delete(id)                     // Delete examiner
examinerService.resetPassword(id, password)    // Reset password (edge function)
examinerService.updateAccreditations(id, data) // Update certifications
```

### messageService

```typescript
messageService.getAll()                        // All messages
messageService.create(data)                    // Send message
messageService.update(id, data)                // Edit message
messageService.delete(id)                      // Delete message
messageService.subscribe(callback)             // Realtime subscription
```

### wordExportService

```typescript
wordExportService.exportToWord(config)         // Generate DOCX
wordExportService.exportToPdf(reports)         // Generate PDF
```

### historyService

```typescript
historyService.getAll()                        // All exports
historyService.getById(id)                     // Single export with forms
historyService.create(data)                    // Create export record
```

---

## 8. Offline Support

### Architecture

The app implements an **offline-first** approach using IndexedDB for local storage and a sync queue for pending operations.

### IndexedDB Stores

| Store | Purpose |
|-------|---------|
| `customers` | Cached customer records |
| `constructions` | Cached construction records |
| `reports` | Cached report records |
| `appointments` | Cached appointment records |
| `sync_queue` | Pending operations to sync |
| `metadata` | App metadata |

### Sync Queue Operation

```typescript
interface SyncOperation {
  id: string;
  store: 'customers' | 'constructions' | 'reports' | 'appointments';
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  entityId?: string;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'in_progress' | 'failed';
  error?: string;
}
```

### Offline Flow

1. **User makes change while offline**
2. **Change saved to IndexedDB** with temporary ID (`temp_*`)
3. **Operation added to sync queue**
4. **UI updates optimistically**
5. **Toast shows "Saved offline"**

### Sync Flow (When Online)

1. **Connection detected**
2. **Sync service triggered**
3. **Process queue operations in order**
4. **Exponential backoff** for failures (max 5 retries)
5. **Replace temp IDs** with server IDs
6. **Invalidate React Query cache**
7. **UI refreshes with synced data**

### Low Bandwidth Mode

Toggle on login page to:
- Skip profile loading
- Reduce API calls
- Redirect to `/customers` instead of dashboard

---

## 9. State Management

### React Query Configuration

```typescript
{
  staleTime: 5 * 60 * 1000,       // 5 minutes
  cacheTime: 10 * 60 * 1000,      // 10 minutes
  retry: 1,
  refetchOnWindowFocus: false,
  refetchOnMount: 'if-stale',
  refetchOnReconnect: true
}
```

### Context Providers

| Context | Purpose | Key State |
|---------|---------|-----------|
| `AuthContext` | User authentication | session, profile, isAuthenticated, lowBandwidth |
| `OfflineContext` | Offline status | isOnline, pendingChanges, triggerSync() |
| `ThemeContext` | Visual theme | theme, primaryColor, setTheme() |
| `LanguageContext` | Internationalization | language, t() translation function |
| `ToastContext` | Notifications | showToast(), toasts[] |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useCustomers` | Fetch customers with pagination/filters |
| `useReports` | Fetch reports |
| `useReportsByConstruction` | Reports filtered by construction |
| `useCreateCustomer` | Create customer mutation |
| `useUpdateCustomer` | Update customer mutation |
| `useDeleteCustomer` | Delete customer mutation |
| `useOfflineMutation` | Generic offline-aware mutation wrapper |

---

## 10. Export Features

### Word Export Process

1. **Fetch template** from Supabase Storage (`method1610.docx`)
2. **Load template** with PizZip
3. **Initialize docxtemplater** with image module
4. **Populate data:**
   - Examination metadata
   - Certifier information
   - Customer/construction details
   - All measurements and calculations
   - Pass/fail status
   - Remarks and deviations
5. **Embed images** from report files
6. **Optionally append PDF** attachments
7. **Generate blob** and trigger download

### PDF Export Process

1. **Initialize jsPDF** document
2. **Add header** with company info
3. **Create table** with autoTable plugin
4. **Populate report data** in rows
5. **Add multiple reports** if batch export
6. **Generate blob** and trigger download

### Export Metadata Tracked

```typescript
interface ReportExport {
  id: string;
  certifier_id: string;
  customer_id: string;
  construction_id: string;
  construction_part_name: string;
  drainage_system_type: string;
  water_remarks: string;
  water_deviations: string;
  air_remarks: string;
  air_deviations: string;
  examination_date: string;
  created_at: string;
}
```

---

## 11. Integrations

### Supabase

| Feature | Usage |
|---------|-------|
| **Auth** | User authentication with email/username login |
| **Database** | PostgreSQL backend for all data |
| **Realtime** | Live chat message subscriptions |
| **Storage** | Templates, avatars, report file attachments |
| **Edge Functions** | Admin password reset |

### EmailJS

Used for:
- Support request submissions
- Help desk notifications

Environment variables:
```
VITE_EMAILJS_SERVICE_ID
VITE_EMAILJS_TEMPLATE_ID
VITE_EMAILJS_PUBLIC_KEY
```

### Key Libraries

| Library | Purpose |
|---------|---------|
| `docxtemplater` | Word document generation |
| `jspdf` + `jspdf-autotable` | PDF generation |
| `pizZip` | ZIP handling for DOCX |
| `pdf-lib` | PDF manipulation |
| `react-big-calendar` | Calendar component |
| `recharts` | Analytics charts |
| `lucide-react` | Icons |
| `date-fns` | Date formatting (Croatian locale) |

---

## 12. Calculations

### Water Test Calculations

Located in `/lib/calculations/report.ts`:

```typescript
// Pressure loss
pressureLoss = pressureStart - pressureEnd;

// Water level loss
waterLoss = waterLevelStart - waterLevelEnd;

// Wetted surface area (varies by structure type)
wettedSurface = calculateWettedSurface(type, dimensions);

// Volume loss
volumeLoss = waterLoss * surfaceArea;

// Allowed loss (per procedure standards)
allowedLoss = wettedSurface * allowedRate * duration;

// Result determination
result = volumeLoss <= allowedLoss ? 'PASSES' : 'FAILS';
```

### Structure Types Supported

| Type | Description | Calculation |
|------|-------------|-------------|
| Round Shaft | Circular vertical shaft | π × d × h |
| Rectangular Shaft | Square/rectangular shaft | 2(w + l) × h |
| Round Pipe | Circular horizontal pipe | π × d × L |
| Rectangular Pipe | Box culvert | 2(w + h) × L |

### Schemes (A-E)

Different testing configurations based on construction type and testing requirements.

---

## 13. Localization

### Supported Languages

| Code | Language | Status |
|------|----------|--------|
| `hr` | Croatian | Default |
| `en` | English | Full support |

### Translation Coverage

- Navigation menus
- Page titles and descriptions
- Form labels and placeholders
- Dialog messages
- Toast notifications
- Error messages
- Calendar controls
- Settings options
- Report form fields
- Help content

### Usage

```typescript
const { t, language, setLanguage } = useLanguage();

// In component
<h1>{t('customers.title')}</h1>
<Button>{t('common.save')}</Button>
```

---

## 14. Theme System

### Theme Options

| Theme | Description |
|-------|-------------|
| `light` | Light background, dark text |
| `dark` | Dark background, light text |
| `system` | Follows OS preference |

### Primary Colors

| Color | HSL Value |
|-------|-----------|
| Blue | 221.2 83.2% 53.3% |
| Green | 142.1 76.2% 36.3% |
| Red | 0 84.2% 60.2% |
| Orange | 24.6 95% 53.1% |
| Purple | 262.1 83.3% 57.8% |
| Pink | 330.4 81.2% 60.4% |
| Yellow | 47.9 95.8% 53.1% |
| Cyan | 189 94.5% 42.7% |

### Implementation

- CSS custom properties (`--primary`, `--background`, etc.)
- Tailwind CSS color classes
- localStorage persistence
- Real-time switching without reload

---

## 15. Security

### Authentication Security

- **Supabase Auth** handles credential validation
- **Session tokens** stored securely
- **Automatic session refresh**
- **Protected routes** require authentication

### Row Level Security (RLS)

All tables have RLS policies:

| Table | Policy |
|-------|--------|
| `customers` | Authenticated users: full access |
| `constructions` | Authenticated users: full access |
| `report_forms` | Authenticated users: full access |
| `appointments` | View all, modify own or if admin |
| `profiles` | View all (for lookups), modify own |
| `messages` | View all, modify own |
| `certifiers` | View all, admin modify |
| `materials` | View all, authenticated modify |

### Admin Functions

- Password reset via Edge Function (bypasses client)
- Role changes require admin privileges
- Material management restricted to admins

---

## 16. Project Structure

```
ai-generator-web/
├── src/
│   ├── App.tsx                    # Main router setup
│   ├── main.tsx                   # Entry point
│   │
│   ├── components/
│   │   ├── ui/                    # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Select.tsx
│   │   │   └── ...
│   │   ├── calendar/              # Calendar components
│   │   ├── constructions/         # Construction UI
│   │   ├── dashboard/             # Dashboard widgets
│   │   ├── examiners/             # Examiner management
│   │   ├── help/                  # Help center
│   │   ├── skeletons/             # Loading states
│   │   └── ...
│   │
│   ├── context/
│   │   ├── AuthContext.tsx        # Authentication state
│   │   ├── OfflineContext.tsx     # Offline detection
│   │   ├── ThemeContext.tsx       # Theme management
│   │   ├── LanguageContext.tsx    # i18n
│   │   └── ToastContext.tsx       # Notifications
│   │
│   ├── hooks/
│   │   ├── useCustomers.ts        # Customer queries
│   │   ├── useReports.ts          # Report queries
│   │   ├── useOfflineMutation.ts  # Offline mutations
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client
│   │   ├── offlineDb.ts           # IndexedDB wrapper
│   │   ├── syncService.ts         # Sync logic
│   │   ├── queryClient.ts         # React Query config
│   │   ├── pdfGenerator.ts        # PDF export
│   │   └── calculations/
│   │       ├── report.ts          # Test calculations
│   │       ├── testTime.ts        # Time calculations
│   │       └── airTable.ts        # Air test calcs
│   │
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Customers.tsx
│   │   ├── CustomerForm.tsx
│   │   ├── Constructions.tsx
│   │   ├── ConstructionForm.tsx
│   │   ├── ConstructionReports.tsx
│   │   ├── WaterMethodForm.tsx
│   │   ├── AirMethodForm.tsx
│   │   ├── Reports.tsx
│   │   ├── History.tsx
│   │   ├── HistoryDetails.tsx
│   │   ├── Calendar.tsx
│   │   ├── Examiners.tsx
│   │   ├── Settings.tsx
│   │   ├── Analytics.tsx
│   │   ├── Profile.tsx
│   │   ├── Help.tsx
│   │   └── Chat.tsx
│   │
│   ├── services/
│   │   ├── customerService.ts
│   │   ├── constructionService.ts
│   │   ├── reportService.ts
│   │   ├── appointmentService.ts
│   │   ├── examinerService.ts
│   │   ├── messageService.ts
│   │   ├── wordExportService.ts
│   │   └── historyService.ts
│   │
│   ├── types/
│   │   ├── index.ts               # All TypeScript interfaces
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── errorHandler.ts        # Error utilities
│   │   └── ...
│   │
│   └── styles/
│       └── ...
│
├── public/                         # Static assets
├── tests/                          # Test files
├── package.json                    # Dependencies
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
├── Dockerfile                      # Docker build
└── railway.json                    # Railway deployment
```

---

## 17. Deployment

### Build Process

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

VITE_EMAILJS_SERVICE_ID=your-service-id
VITE_EMAILJS_TEMPLATE_ID=your-template-id
VITE_EMAILJS_PUBLIC_KEY=your-public-key
```

### Docker Deployment

The included `Dockerfile` builds a production image:

1. Node.js build stage compiles the app
2. Nginx serves the static files
3. SPA routing configured for React Router

### Railway Deployment

`railway.json` configures automatic deployment:
- Build command: `npm run build`
- Start command: `npm start`
- Environment variables from Railway dashboard

---

## Summary

AI Generator React is a comprehensive, production-ready application featuring:

| Category | Highlights |
|----------|------------|
| **Core Function** | Water/air tightness testing management |
| **Architecture** | React 19 + TypeScript + Vite + Supabase |
| **Offline** | Full offline support with automatic sync |
| **Exports** | Professional Word/PDF report generation |
| **Security** | RLS policies, role-based access |
| **UX** | Multi-language, theming, real-time chat |
| **Performance** | Code splitting, caching, lazy loading |

The application serves the specialized construction testing industry while demonstrating enterprise-level patterns in state management, offline capabilities, and user experience design.
