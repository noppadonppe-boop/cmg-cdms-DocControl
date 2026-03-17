import type { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Shared Enums / Union Types
// ---------------------------------------------------------------------------

export type UserRole = 'MasterAdmin' | 'Admin' | 'Manager' | 'Engineer' | 'Viewer';

export type UserStatus = 'active' | 'pending' | 'disabled';

export type TransmittalType = 'in' | 'out';

export type TransmittalPurpose =
  | 'For Approval'
  | 'For Action'
  | 'For Information'
  | 'For Record';

export type TransmittalStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Closed';

export type DocumentCategory =
  | 'Drawing'
  | 'Specification'
  | 'Material Approval'
  | 'Method Statement'
  | 'Report'
  | 'Correspondence'
  | 'Other';

export type DocumentStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Approved as Noted'
  | 'Revise and Resubmit'
  | 'Rejected'
  | 'Superseded';

/** Code A–D reply codes per the CDMS workflow */
export type StatusCode = 'A' | 'B' | 'C' | 'D';

export type DocumentAction =
  | 'Created'
  | 'Submitted'
  | 'Reviewed'
  | 'Status Updated'
  | 'Revision Created'
  | 'File Replaced';

// ---------------------------------------------------------------------------
// Label Maps
// ---------------------------------------------------------------------------

export const STATUS_CODE_LABELS: Record<StatusCode, string> = {
  A: 'Approved',
  B: 'Approved as Noted',
  C: 'Revise and Resubmit',
  D: 'Rejected',
};

export const STATUS_CODE_DOCUMENT_STATUS: Record<StatusCode, DocumentStatus> = {
  A: 'Approved',
  B: 'Approved as Noted',
  C: 'Revise and Resubmit',
  D: 'Rejected',
};

// ---------------------------------------------------------------------------
// Firestore Collection Interfaces
// ---------------------------------------------------------------------------

/** Collection: `users` */
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  photoURL?: string;
  status?: UserStatus;
  requestedAt?: Timestamp;
  /** Project IDs this user is allowed to access */
  assignedProjectIds?: string[];
}

/** Collection: `projects` */
export interface Project {
  projectId: string;
  name: string;
  description?: string;
  /** Array of member UIDs — used for Firestore array-contains queries */
  memberIds: string[];
  /** Map of uid → role for per-project role resolution */
  roles: Record<string, UserRole>;
  createdAt: Timestamp;
  createdBy: string;
}

/** Collection: `transmittals` */
export interface Transmittal {
  transmittalId: string;
  projectId: string;
  type: TransmittalType;
  transmittalNo: string;
  sender: string;
  recipient: string;
  /** ISO date or readable label for the transmittal cover date */
  date: Timestamp;
  purpose: TransmittalPurpose;
  subject: string;
  status: TransmittalStatus;
  /**
   * true  → purpose is "For Approval" or "For Action" (reply + status code required)
   * false → purpose is "For Information" or "For Record" (no tracking)
   */
  requiresReply: boolean;
  /** Optional reference to the outgoing reply transmittal */
  replyTransmittalId?: string;
  createdAt: Timestamp;
  createdBy: string;
}

/** Collection: `documents` */
export interface Document {
  documentId: string;
  projectId: string;
  /** ID of the transmittal this document arrived/left with */
  transmittalId: string;
  documentNo: string;
  title: string;
  category: DocumentCategory;
  /** Zero-padded revision string, e.g. "Rev.00", "Rev.01" */
  revision: string;
  /** Firebase Storage download URL; empty string before upload */
  fileUrl: string;
  status: DocumentStatus;
  /** true only for the latest revision of this documentNo */
  isLatest: boolean;
  /**
   * Review reply code set when the document is closed out.
   * A = Approved, B = Approved as Noted,
   * C = Revise and Resubmit, D = Rejected
   */
  statusCode?: StatusCode;
  reviewComment?: string;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

/** Collection: `document_history`
 *  Append-only audit trail — never update, only addDoc.
 */
export interface DocumentHistory {
  logId: string;
  /** Denormalised so we can query all history for a project without joining */
  projectId: string;
  documentId: string;
  documentNo: string;
  action: DocumentAction;
  performedBy: string;
  performedByName: string;
  timestamp: Timestamp;
  comment?: string;
  previousStatus?: DocumentStatus;
  newStatus?: DocumentStatus;
  previousRevision?: string;
  newRevision?: string;
}

// ---------------------------------------------------------------------------
// Utility Types
// ---------------------------------------------------------------------------

/** Omit Firestore-generated fields when creating a new document */
export type CreateInput<T, K extends keyof T = never> = Omit<
  T,
  'createdAt' | 'updatedAt' | K
>;

/** Partial update payload — never allows overwriting identity fields */
export type UpdateInput<T> = Partial<Omit<T, 'projectId' | 'createdAt' | 'createdBy'>>;
