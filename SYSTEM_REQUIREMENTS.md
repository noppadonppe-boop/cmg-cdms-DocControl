# Construction Document Control System (CDMS) - Core Logic & Schema

## 1. Tech Stack
- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Backend/Database: Firebase (Auth, Firestore, Storage)
- Architecture: Single Page Application (SPA), Client-Side Rendering (CSR)

## 2. Core Workflow & Terminology
1. **Transmittal (In/Out):** The "envelope" or email used to send/receive documents. It has a unique No. (e.g., TR-IN-26-001).
2. **Document:** The actual file (e.g., Drawing, Material Approval). Must have a `Document No.` and `Revision` (e.g., Rev.00, Rev.01).
3. **Action Types:**
   - `For Approval / For Action`: Requires tracking and a reply.
   - `For Information / For Record`: No tracking required.
4. **Status Codes (For Reply):**
   - Code A: Approved
   - Code B: Approved as Noted
   - Code C: Revise and Resubmit (Triggers new Revision creation)
   - Code D: Rejected

## 3. Firestore Database Schema (NoSQL Root Collections)

All collections are **flat root collections** (not subcollections).
Every non-user document carries `projectId` so all data is filterable per project.

### `users`
```
uid           string   (= Firebase Auth UID, used as document ID)
email         string
displayName   string
role          'Admin' | 'Manager' | 'Engineer' | 'Viewer'
isActive      boolean
```

### `projects`
```
projectId     string   (= Firestore auto-ID, stored in the document itself)
name          string
description   string?
memberIds     string[] (UIDs — enables array-contains queries for membership)
roles         map<uid, UserRole>  (per-project role override)
createdBy     string   (UID)
createdAt     Timestamp
```

### `transmittals`
```
transmittalId       string   (= Firestore auto-ID)
projectId           string   ← filter all transmittals by project
type                'in' | 'out'
transmittalNo       string   e.g. TR-IN-26-001
sender              string
recipient           string
date                Timestamp  (cover date on the transmittal letter)
subject             string
purpose             'For Approval' | 'For Action' | 'For Information' | 'For Record'
requiresReply       boolean    (true when purpose = For Approval | For Action)
replyTransmittalId  string?    (links outgoing reply back to the incoming TR)
status              'Draft' | 'Submitted' | 'Under Review' | 'Closed'
createdBy           string   (UID)
createdAt           Timestamp
```

### `documents`
```
documentId      string   (= Firestore auto-ID)
projectId       string   ← filter all documents by project
transmittalId   string   (which transmittal this document came in/out with)
documentNo      string   e.g. STR-SD-001
title           string
category        'Drawing' | 'Specification' | 'Material Approval' |
                'Method Statement' | 'Report' | 'Correspondence' | 'Other'
revision        string   e.g. Rev.00, Rev.01
fileUrl         string   (Firebase Storage download URL)
status          'Draft' | 'Submitted' | 'Under Review' | 'Approved' |
                'Approved as Noted' | 'Revise and Resubmit' | 'Rejected' | 'Superseded'
isLatest        boolean  (true = current revision; false = superseded)
statusCode      'A' | 'B' | 'C' | 'D'  (optional, set when reviewed)
reviewComment   string?
createdBy       string   (UID)
createdAt       Timestamp
updatedBy       string   (UID — last person to change status/upload)
updatedAt       Timestamp
```

### `document_history`  ← append-only audit trail, never update
```
logId             string   (= Firestore auto-ID)
projectId         string   ← denormalised for per-project history queries
documentId        string
documentNo        string   (denormalised for display without extra fetch)
action            'Created' | 'Submitted' | 'Reviewed' | 'Status Updated' |
                  'Revision Created' | 'File Replaced'
performedBy       string   (UID)
performedByName   string   (denormalised display name)
timestamp         Timestamp
comment           string?
previousStatus    DocumentStatus?
newStatus         DocumentStatus?
previousRevision  string?
newRevision       string?
```

### Firestore Query Patterns
```ts
// All projects the current user is a member of
query(collection(db, 'projects'), where('memberIds', 'array-contains', uid))

// All transmittals for a project, filtered by type
query(collection(db, 'transmittals'),
  where('projectId', '==', projectId),
  where('type', '==', 'in'),
  orderBy('date', 'desc'))

// Latest revision of all documents in a project
query(collection(db, 'documents'),
  where('projectId', '==', projectId),
  where('isLatest', '==', true))

// Full revision history for one document number
query(collection(db, 'documents'),
  where('projectId', '==', projectId),
  where('documentNo', '==', documentNo),
  orderBy('createdAt', 'asc'))

// Audit trail for a project
query(collection(db, 'document_history'),
  where('projectId', '==', projectId),
  orderBy('timestamp', 'desc'))
```

## 4. Key Rules for AI Assistant
- Always use Tailwind CSS for styling.
- Use shadcn/ui components whenever building UI.
- Keep the UI clean, professional, and suitable for an Enterprise Dashboard.
- When creating a new Revision (e.g., Rev.01), automatically mark the old Revision (Rev.00) `isLatest: false` and the new one `isLatest: true`.
