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
- `users`: { uid, email, displayName, role, isActive }
- `projects`: { projectId, name, memberIds (array for query), roles (map of uid:role) }
- `transmittals`: { transmittalId, projectId, type (in/out), transmittalNo, sender, recipient, date, purpose, status }
- `documents`: { documentId, projectId, transmittalId, documentNo, title, category, revision, fileUrl, status, isLatest (boolean) }
- `document_history`: { logId, documentId, action, performedBy, timestamp, comment }

## 4. Key Rules for AI Assistant
- Always use Tailwind CSS for styling.
- Use shadcn/ui components whenever building UI.
- Keep the UI clean, professional, and suitable for an Enterprise Dashboard.
- When creating a new Revision (e.g., Rev.01), automatically mark the old Revision (Rev.00) `isLatest: false` and the new one `isLatest: true`.
