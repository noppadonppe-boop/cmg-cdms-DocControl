import type {
  User,
  Project,
  Transmittal,
  Document,
  DocumentHistory,
} from '@/types'
import type { Timestamp } from 'firebase/firestore'

// ---------------------------------------------------------------------------
// Helper: create a plain Timestamp-shaped object (avoids Firebase SDK init at
// module load time which crashes the app before React mounts)
// ---------------------------------------------------------------------------
function ts(dateStr: string): Timestamp {
  const ms = new Date(dateStr).getTime()
  return { seconds: Math.floor(ms / 1000), nanoseconds: 0, toDate: () => new Date(dateStr), toMillis: () => ms, isEqual: () => false, valueOf: () => dateStr } as unknown as Timestamp
}

// ---------------------------------------------------------------------------
// MOCK USER IDs (ใช้แทน Firebase Auth UID จริง)
// ---------------------------------------------------------------------------
export const MOCK_UID = {
  alice: 'uid-alice-001',
  bob: 'uid-bob-002',
  carol: 'uid-carol-003',
}

// ---------------------------------------------------------------------------
// MOCK USERS
// ---------------------------------------------------------------------------
export const mockUsers: User[] = [
  {
    uid: MOCK_UID.alice,
    email: 'alice@cmg-engineering.com',
    displayName: 'Alice Srisuk',
    role: 'Admin',
    isActive: true,
  },
  {
    uid: MOCK_UID.bob,
    email: 'bob@main-contractor.com',
    displayName: 'Bob Tanaka',
    role: 'Engineer',
    isActive: true,
  },
  {
    uid: MOCK_UID.carol,
    email: 'carol@client.com',
    displayName: 'Carol Wongchai',
    role: 'Viewer',
    isActive: true,
  },
]

// ---------------------------------------------------------------------------
// MOCK PROJECTS
// ---------------------------------------------------------------------------
export const mockProjects: Project[] = [
  {
    projectId: 'proj-cmg-tower',
    name: 'CMG Tower – Phase 1',
    description: 'Mixed-use high-rise development, 42 floors, Bangkok CBD.',
    memberIds: [MOCK_UID.alice, MOCK_UID.bob, MOCK_UID.carol],
    roles: {
      [MOCK_UID.alice]: 'Admin',
      [MOCK_UID.bob]: 'Engineer',
      [MOCK_UID.carol]: 'Viewer',
    },
    createdBy: MOCK_UID.alice,
    createdAt: ts('2026-01-10'),
  },
  {
    projectId: 'proj-riverside',
    name: 'Riverside Mixed-Use',
    description: 'Riverside condominium and retail complex, Chao Phraya waterfront.',
    memberIds: [MOCK_UID.alice, MOCK_UID.bob],
    roles: {
      [MOCK_UID.alice]: 'Admin',
      [MOCK_UID.bob]: 'Manager',
    },
    createdBy: MOCK_UID.alice,
    createdAt: ts('2026-02-01'),
  },
]

// ---------------------------------------------------------------------------
// MOCK TRANSMITTALS – CMG Tower
// ---------------------------------------------------------------------------
const mockTransmittalsCMG: Transmittal[] = [
  // ── Incoming ──
  {
    transmittalId: 'tr-in-001',
    projectId: 'proj-cmg-tower',
    type: 'in',
    transmittalNo: 'TR-IN-26-001',
    sender: 'Main Contractor (BCS Co., Ltd.)',
    recipient: 'CMG Engineering',
    date: ts('2026-03-01'),
    purpose: 'For Approval',
    subject: 'Shop Drawings – Structural Steel Frame (Level B2–L3)',
    status: 'Closed',
    requiresReply: true,
    createdBy: MOCK_UID.bob,
    createdAt: ts('2026-03-01'),
  },
  {
    transmittalId: 'tr-in-002',
    projectId: 'proj-cmg-tower',
    type: 'in',
    transmittalNo: 'TR-IN-26-002',
    sender: 'Structural Consultant (SDC Partners)',
    recipient: 'CMG Engineering',
    date: ts('2026-03-05'),
    purpose: 'For Action',
    subject: 'Method Statement – Piling Works (Bored Pile Ø600)',
    status: 'Closed',
    requiresReply: true,
    createdBy: MOCK_UID.bob,
    createdAt: ts('2026-03-05'),
  },
  {
    transmittalId: 'tr-in-003',
    projectId: 'proj-cmg-tower',
    type: 'in',
    transmittalNo: 'TR-IN-26-003',
    sender: 'MEP Subcontractor (CoolTech MEP)',
    recipient: 'CMG Engineering',
    date: ts('2026-03-10'),
    purpose: 'For Approval',
    subject: 'Material Approval – HVAC Ducting (Galvanised Steel, 0.8mm)',
    status: 'Under Review',
    requiresReply: true,
    createdBy: MOCK_UID.bob,
    createdAt: ts('2026-03-10'),
  },
  {
    transmittalId: 'tr-in-004',
    projectId: 'proj-cmg-tower',
    type: 'in',
    transmittalNo: 'TR-IN-26-004',
    sender: 'Client (CMG Property)',
    recipient: 'CMG Engineering',
    date: ts('2026-03-12'),
    purpose: 'For Information',
    subject: 'Meeting Minutes – Design Review March 2026',
    status: 'Closed',
    requiresReply: false,
    createdBy: MOCK_UID.carol,
    createdAt: ts('2026-03-12'),
  },
  {
    transmittalId: 'tr-in-005',
    projectId: 'proj-cmg-tower',
    type: 'in',
    transmittalNo: 'TR-IN-26-005',
    sender: 'Main Contractor (BCS Co., Ltd.)',
    recipient: 'CMG Engineering',
    date: ts('2026-03-15'),
    purpose: 'For Approval',
    subject: 'Shop Drawings – Structural Steel Frame Rev.01 (Resubmission)',
    status: 'Under Review',
    requiresReply: true,
    createdBy: MOCK_UID.bob,
    createdAt: ts('2026-03-15'),
  },

  // ── Outgoing ──
  {
    transmittalId: 'tr-out-001',
    projectId: 'proj-cmg-tower',
    type: 'out',
    transmittalNo: 'TR-OUT-26-001',
    sender: 'CMG Engineering',
    recipient: 'Main Contractor (BCS Co., Ltd.)',
    date: ts('2026-03-03'),
    purpose: 'For Action',
    subject: 'Review Comment – Shop Drawings STR-SD-001 Rev.00 (Code C)',
    status: 'Closed',
    requiresReply: false,
    createdBy: MOCK_UID.alice,
    createdAt: ts('2026-03-03'),
  },
  {
    transmittalId: 'tr-out-002',
    projectId: 'proj-cmg-tower',
    type: 'out',
    transmittalNo: 'TR-OUT-26-002',
    sender: 'CMG Engineering',
    recipient: 'Structural Consultant (SDC Partners)',
    date: ts('2026-03-07'),
    purpose: 'For Action',
    subject: 'Approval – Method Statement Piling Works (Code A)',
    status: 'Closed',
    requiresReply: false,
    createdBy: MOCK_UID.alice,
    createdAt: ts('2026-03-07'),
  },
  {
    transmittalId: 'tr-out-003',
    projectId: 'proj-cmg-tower',
    type: 'out',
    transmittalNo: 'TR-OUT-26-003',
    sender: 'CMG Engineering',
    recipient: 'Client (CMG Property)',
    date: ts('2026-03-14'),
    purpose: 'For Information',
    subject: 'Monthly Progress Report – February 2026',
    status: 'Submitted',
    requiresReply: false,
    createdBy: MOCK_UID.alice,
    createdAt: ts('2026-03-14'),
  },
  {
    transmittalId: 'tr-out-004',
    projectId: 'proj-cmg-tower',
    type: 'out',
    transmittalNo: 'TR-OUT-26-004',
    sender: 'CMG Engineering',
    recipient: 'MEP Subcontractor (CoolTech MEP)',
    date: ts('2026-03-16'),
    purpose: 'For Action',
    subject: 'RFI #007 – HVAC Duct Routing Conflict at Level 5',
    status: 'Submitted',
    requiresReply: true,
    createdBy: MOCK_UID.alice,
    createdAt: ts('2026-03-16'),
  },
]

// ---------------------------------------------------------------------------
// MOCK DOCUMENTS – CMG Tower
// ---------------------------------------------------------------------------
const mockDocumentsCMG: Document[] = [
  // STR-SD-001 Rev.00 (Superseded – got Code C → resubmit)
  {
    documentId: 'doc-str-sd-001-r00',
    projectId: 'proj-cmg-tower',
    transmittalId: 'tr-in-001',
    documentNo: 'STR-SD-001',
    title: 'Shop Drawings – Structural Steel Frame (Level B2–L3)',
    category: 'Drawing',
    revision: 'Rev.00',
    fileUrl: '',
    status: 'Revise and Resubmit',
    isLatest: false,
    statusCode: 'C',
    reviewComment: 'Connection details at Grid A/3 insufficient. Revise weld schedule and resubmit.',
    createdBy: MOCK_UID.bob,
    createdAt: ts('2026-03-01'),
    updatedAt: ts('2026-03-03'),
    updatedBy: MOCK_UID.alice,
  },
  // STR-SD-001 Rev.01 (Latest – Under Review)
  {
    documentId: 'doc-str-sd-001-r01',
    projectId: 'proj-cmg-tower',
    transmittalId: 'tr-in-005',
    documentNo: 'STR-SD-001',
    title: 'Shop Drawings – Structural Steel Frame (Level B2–L3)',
    category: 'Drawing',
    revision: 'Rev.01',
    fileUrl: '',
    status: 'Under Review',
    isLatest: true,
    createdBy: MOCK_UID.bob,
    createdAt: ts('2026-03-15'),
    updatedAt: ts('2026-03-15'),
    updatedBy: MOCK_UID.bob,
  },

  // STR-SD-002 Rev.00 (Approved)
  {
    documentId: 'doc-str-sd-002-r00',
    projectId: 'proj-cmg-tower',
    transmittalId: 'tr-in-001',
    documentNo: 'STR-SD-002',
    title: 'Foundation GA Plan – Piled Raft (Grid A–E)',
    category: 'Drawing',
    revision: 'Rev.00',
    fileUrl: '',
    status: 'Approved',
    isLatest: true,
    statusCode: 'A',
    createdBy: MOCK_UID.bob,
    createdAt: ts('2026-03-01'),
    updatedAt: ts('2026-03-07'),
    updatedBy: MOCK_UID.alice,
  },

  // CIV-MS-001 Rev.00 (Approved)
  {
    documentId: 'doc-civ-ms-001-r00',
    projectId: 'proj-cmg-tower',
    transmittalId: 'tr-in-002',
    documentNo: 'CIV-MS-001',
    title: 'Method Statement – Piling Works (Bored Pile Ø600)',
    category: 'Method Statement',
    revision: 'Rev.00',
    fileUrl: '',
    status: 'Approved',
    isLatest: true,
    statusCode: 'A',
    reviewComment: 'Approved. Proceed as per submitted method.',
    createdBy: MOCK_UID.bob,
    createdAt: ts('2026-03-05'),
    updatedAt: ts('2026-03-07'),
    updatedBy: MOCK_UID.alice,
  },

  // MEP-MA-001 Rev.00 (Under Review)
  {
    documentId: 'doc-mep-ma-001-r00',
    projectId: 'proj-cmg-tower',
    transmittalId: 'tr-in-003',
    documentNo: 'MEP-MA-001',
    title: 'Material Approval – HVAC Ducting (Galvanised Steel, 0.8mm)',
    category: 'Material Approval',
    revision: 'Rev.00',
    fileUrl: '',
    status: 'Under Review',
    isLatest: true,
    createdBy: MOCK_UID.bob,
    createdAt: ts('2026-03-10'),
    updatedAt: ts('2026-03-10'),
    updatedBy: MOCK_UID.bob,
  },

  // STR-SP-001 Rev.00 (Approved as Noted)
  {
    documentId: 'doc-str-sp-001-r00',
    projectId: 'proj-cmg-tower',
    transmittalId: 'tr-in-001',
    documentNo: 'STR-SP-001',
    title: 'Structural Steel Fabrication Specification',
    category: 'Specification',
    revision: 'Rev.00',
    fileUrl: '',
    status: 'Approved as Noted',
    isLatest: true,
    statusCode: 'B',
    reviewComment: 'Approved. Note: Refer to latest ASTM A992 for wide flange sections.',
    createdBy: MOCK_UID.bob,
    createdAt: ts('2026-03-01'),
    updatedAt: ts('2026-03-07'),
    updatedBy: MOCK_UID.alice,
  },

  // GEN-RPT-001 Rev.00 (Submitted)
  {
    documentId: 'doc-gen-rpt-001-r00',
    projectId: 'proj-cmg-tower',
    transmittalId: 'tr-out-003',
    documentNo: 'GEN-RPT-001',
    title: 'Monthly Progress Report – February 2026',
    category: 'Report',
    revision: 'Rev.00',
    fileUrl: '',
    status: 'Submitted',
    isLatest: true,
    createdBy: MOCK_UID.alice,
    createdAt: ts('2026-03-14'),
    updatedAt: ts('2026-03-14'),
    updatedBy: MOCK_UID.alice,
  },
]

// ---------------------------------------------------------------------------
// MOCK DOCUMENT HISTORY – Audit Trail
// ---------------------------------------------------------------------------
export const mockDocumentHistory: DocumentHistory[] = [
  {
    logId: 'log-001',
    projectId: 'proj-cmg-tower',
    documentId: 'doc-str-sd-001-r00',
    documentNo: 'STR-SD-001',
    action: 'Created',
    performedBy: MOCK_UID.bob,
    performedByName: 'Bob Tanaka',
    timestamp: ts('2026-03-01'),
    newStatus: 'Submitted',
  },
  {
    logId: 'log-002',
    projectId: 'proj-cmg-tower',
    documentId: 'doc-str-sd-001-r00',
    documentNo: 'STR-SD-001',
    action: 'Status Updated',
    performedBy: MOCK_UID.alice,
    performedByName: 'Alice Srisuk',
    timestamp: ts('2026-03-03'),
    previousStatus: 'Submitted',
    newStatus: 'Revise and Resubmit',
    comment: 'Connection details at Grid A/3 insufficient. Revise weld schedule and resubmit.',
  },
  {
    logId: 'log-003',
    projectId: 'proj-cmg-tower',
    documentId: 'doc-str-sd-001-r01',
    documentNo: 'STR-SD-001',
    action: 'Revision Created',
    performedBy: MOCK_UID.bob,
    performedByName: 'Bob Tanaka',
    timestamp: ts('2026-03-15'),
    previousRevision: 'Rev.00',
    newRevision: 'Rev.01',
    newStatus: 'Submitted',
    comment: 'Revised per review comment. Weld schedule updated, Grid A/3 connection detailed.',
  },
  {
    logId: 'log-004',
    projectId: 'proj-cmg-tower',
    documentId: 'doc-civ-ms-001-r00',
    documentNo: 'CIV-MS-001',
    action: 'Created',
    performedBy: MOCK_UID.bob,
    performedByName: 'Bob Tanaka',
    timestamp: ts('2026-03-05'),
    newStatus: 'Submitted',
  },
  {
    logId: 'log-005',
    projectId: 'proj-cmg-tower',
    documentId: 'doc-civ-ms-001-r00',
    documentNo: 'CIV-MS-001',
    action: 'Status Updated',
    performedBy: MOCK_UID.alice,
    performedByName: 'Alice Srisuk',
    timestamp: ts('2026-03-07'),
    previousStatus: 'Submitted',
    newStatus: 'Approved',
    comment: 'Approved. Proceed as per submitted method.',
  },
  {
    logId: 'log-006',
    projectId: 'proj-cmg-tower',
    documentId: 'doc-mep-ma-001-r00',
    documentNo: 'MEP-MA-001',
    action: 'Created',
    performedBy: MOCK_UID.bob,
    performedByName: 'Bob Tanaka',
    timestamp: ts('2026-03-10'),
    newStatus: 'Submitted',
  },
  {
    logId: 'log-007',
    projectId: 'proj-cmg-tower',
    documentId: 'doc-str-sd-002-r00',
    documentNo: 'STR-SD-002',
    action: 'Status Updated',
    performedBy: MOCK_UID.alice,
    performedByName: 'Alice Srisuk',
    timestamp: ts('2026-03-07'),
    previousStatus: 'Submitted',
    newStatus: 'Approved',
  },

  // ── Riverside project history ──
  {
    logId: 'log-008',
    projectId: 'proj-riverside',
    documentId: 'doc-riv-arch-001-r00',
    documentNo: 'ARCH-DD-001',
    action: 'Created',
    performedBy: MOCK_UID.bob,
    performedByName: 'Bob Tanaka',
    timestamp: ts('2026-02-10'),
    newStatus: 'Submitted',
  },
  {
    logId: 'log-009',
    projectId: 'proj-riverside',
    documentId: 'doc-riv-arch-001-r00',
    documentNo: 'ARCH-DD-001',
    action: 'Status Updated',
    performedBy: MOCK_UID.alice,
    performedByName: 'Alice Srisuk',
    timestamp: ts('2026-02-15'),
    previousStatus: 'Submitted',
    newStatus: 'Approved as Noted',
  },
]

// ---------------------------------------------------------------------------
// MOCK TRANSMITTALS – Riverside Mixed-Use (merged into mockTransmittals below)
// ---------------------------------------------------------------------------
const mockTransmittalsRiverside: Transmittal[] = [
  {
    transmittalId: 'riv-tr-in-001',
    projectId: 'proj-riverside',
    type: 'in',
    transmittalNo: 'RIV-IN-26-001',
    sender: 'Architect (Design Studio Co.)',
    recipient: 'CMG Engineering',
    date: ts('2026-02-05'),
    purpose: 'For Approval',
    subject: 'Design Development Drawings – Tower Block A (Level 1–10)',
    status: 'Closed',
    requiresReply: true,
    createdBy: MOCK_UID.bob,
    createdAt: ts('2026-02-05'),
  },
  {
    transmittalId: 'riv-tr-in-002',
    projectId: 'proj-riverside',
    type: 'in',
    transmittalNo: 'RIV-IN-26-002',
    sender: 'Civil Contractor (Rivercon)',
    recipient: 'CMG Engineering',
    date: ts('2026-02-18'),
    purpose: 'For Approval',
    subject: 'Method Statement – Deep Excavation & Shoring',
    status: 'Under Review',
    requiresReply: true,
    createdBy: MOCK_UID.bob,
    createdAt: ts('2026-02-18'),
  },
  {
    transmittalId: 'riv-tr-out-001',
    projectId: 'proj-riverside',
    type: 'out',
    transmittalNo: 'RIV-OUT-26-001',
    sender: 'CMG Engineering',
    recipient: 'Architect (Design Studio Co.)',
    date: ts('2026-02-15'),
    purpose: 'For Action',
    subject: 'Review Comment – Design Development ARCH-DD-001 (Code B)',
    status: 'Closed',
    requiresReply: false,
    createdBy: MOCK_UID.alice,
    createdAt: ts('2026-02-15'),
  },
  {
    transmittalId: 'riv-tr-out-002',
    projectId: 'proj-riverside',
    type: 'out',
    transmittalNo: 'RIV-OUT-26-002',
    sender: 'CMG Engineering',
    recipient: 'Client (Riverside Property)',
    date: ts('2026-03-01'),
    purpose: 'For Information',
    subject: 'Monthly Progress Report – January 2026',
    status: 'Submitted',
    requiresReply: false,
    createdBy: MOCK_UID.alice,
    createdAt: ts('2026-03-01'),
  },
]

// ---------------------------------------------------------------------------
// MOCK DOCUMENTS – Riverside Mixed-Use (merged into mockDocuments below)
// ---------------------------------------------------------------------------
const mockDocumentsRiverside: Document[] = [
  {
    documentId: 'doc-riv-arch-001-r00',
    projectId: 'proj-riverside',
    transmittalId: 'riv-tr-in-001',
    documentNo: 'ARCH-DD-001',
    title: 'Design Development Drawings – Tower Block A (Level 1–10)',
    category: 'Drawing',
    revision: 'Rev.00',
    fileUrl: '',
    status: 'Approved as Noted',
    isLatest: true,
    statusCode: 'B',
    reviewComment: 'Approved as noted. Revise window schedule on Level 5.',
    createdBy: MOCK_UID.bob,
    createdAt: ts('2026-02-05'),
    updatedAt: ts('2026-02-15'),
    updatedBy: MOCK_UID.alice,
  },
  {
    documentId: 'doc-riv-civ-ms-001-r00',
    projectId: 'proj-riverside',
    transmittalId: 'riv-tr-in-002',
    documentNo: 'CIV-EX-001',
    title: 'Method Statement – Deep Excavation & Shoring Works',
    category: 'Method Statement',
    revision: 'Rev.00',
    fileUrl: '',
    status: 'Under Review',
    isLatest: true,
    createdBy: MOCK_UID.bob,
    createdAt: ts('2026-02-18'),
    updatedAt: ts('2026-02-18'),
    updatedBy: MOCK_UID.bob,
  },
  {
    documentId: 'doc-riv-rpt-001-r00',
    projectId: 'proj-riverside',
    transmittalId: 'riv-tr-out-002',
    documentNo: 'GEN-RPT-001',
    title: 'Monthly Progress Report – January 2026',
    category: 'Report',
    revision: 'Rev.00',
    fileUrl: '',
    status: 'Submitted',
    isLatest: true,
    createdBy: MOCK_UID.alice,
    createdAt: ts('2026-03-01'),
    updatedAt: ts('2026-03-01'),
    updatedBy: MOCK_UID.alice,
  },
]

// ---------------------------------------------------------------------------
// MERGED EXPORTS – all projects combined (pages filter by selectedProject.projectId)
// ---------------------------------------------------------------------------
export const mockTransmittals: Transmittal[] = [
  ...mockTransmittalsCMG,
  ...mockTransmittalsRiverside,
]

export const mockDocuments: Document[] = [
  ...mockDocumentsCMG,
  ...mockDocumentsRiverside,
]
