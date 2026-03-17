/**
 * Firestore Seed Script – CDMS Mock Data
 * ----------------------------------------
 * วิธีใช้:
 *   1. ตั้งค่า FIREBASE credentials ใน .env.local ก่อน
 *   2. รัน: npx tsx scripts/seedFirestore.ts
 *
 * ต้องติดตั้ง: npm install -D tsx
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { createRequire } from 'module'
import { existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// ── Init Firebase Admin ──────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const keyPath = join(__dirname, '..', 'serviceAccountKey.json')

if (!existsSync(keyPath)) {
  console.error('❌  serviceAccountKey.json not found at:', keyPath)
  console.error('   1. Go to Firebase Console → Project Settings → Service accounts')
  console.error('   2. Click "Generate new private key" and save as serviceAccountKey.json')
  console.error('      in the project root (same folder as package.json)')
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8')) as ServiceAccount

initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore()

// ── Firestore path ───────────────────────────────────────────────────────────
const ROOT_COL = 'CMG-cdms-DocControl'
const ROOT_DOC = 'root'
function subCol(name: string) {
  return db.collection(ROOT_COL).doc(ROOT_DOC).collection(name)
}

// ── Helper ───────────────────────────────────────────────────────────────────
function ts(dateStr: string) {
  return Timestamp.fromDate(new Date(dateStr))
}

// ── Seed Data ────────────────────────────────────────────────────────────────

const MOCK_UID = {
  alice: 'uid-alice-001',
  bob:   'uid-bob-002',
  carol: 'uid-carol-003',
  david: 'uid-david-004',
  eve:   'uid-eve-005',
}

async function cleanupCollections() {
  console.log('🧹 Cleaning up existing data...')
  const collections = ['users', 'projects', 'transmittals', 'documents', 'document_history']
  for (const col of collections) {
    // Clean nested path
    const snap = await subCol(col).get()
    const batch = db.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    // Also clean old flat root collections if they exist
    const oldSnap = await db.collection(col).get()
    if (oldSnap.size > 0) {
      const oldBatch = db.batch()
      oldSnap.docs.forEach((d) => oldBatch.delete(d.ref))
      await oldBatch.commit()
      console.log(`  ✓ Cleared old flat: ${col} (${oldSnap.size} docs)`)
    }
    console.log(`  ✓ Cleared: ${col} (${snap.size} docs)`)
  }
}

async function seedUsers() {
  console.log('⏳ Seeding users + Firebase Auth...')
  const adminAuth = getAuth()
  const users = [
    { uid: MOCK_UID.alice, email: 'alice@cmg-engineering.com',  displayName: 'Alice Srisuk',   password: 'Alice@1234',  role: 'MasterAdmin', isActive: true,  status: 'active'  },
    { uid: MOCK_UID.bob,   email: 'bob@main-contractor.com',    displayName: 'Bob Tanaka',     password: 'Bob@1234',    role: 'Engineer',    isActive: true,  status: 'active'  },
    { uid: MOCK_UID.carol, email: 'carol@client.com',           displayName: 'Carol Wongchai', password: 'Carol@1234',  role: 'Viewer',      isActive: false, status: 'pending' },
    { uid: MOCK_UID.david, email: 'david@sdc-partners.com',     displayName: 'David Chen',     password: 'David@1234',  role: 'Manager',     isActive: true,  status: 'active'  },
    { uid: MOCK_UID.eve,   email: 'eve@cooltech-mep.com',       displayName: 'Eve Nakamura',   password: 'Eve@1234',    role: 'Engineer',    isActive: true,  status: 'active'  },
  ]
  for (const user of users) {
    // Create or update Firebase Auth user with exact UID
    try {
      await adminAuth.createUser({ uid: user.uid, email: user.email, displayName: user.displayName, password: user.password })
      console.log(`  ✓ Auth created: ${user.displayName} (${user.uid})`)
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'auth/uid-already-exists' || (err as { code?: string }).code === 'auth/email-already-exists') {
        await adminAuth.updateUser(user.uid, { email: user.email, displayName: user.displayName, password: user.password })
        console.log(`  ✓ Auth updated: ${user.displayName} (${user.uid})`)
      } else {
        throw err
      }
    }
    // Write to nested Firestore path
    const { password: _, ...firestoreUser } = user
    await subCol('users').doc(user.uid).set(firestoreUser)
    console.log(`  ✓ Firestore user: ${user.displayName}`)
  }
}

async function seedProjects() {
  console.log('⏳ Seeding projects...')
  const projects = [
    {
      name: 'CMG Tower – Phase 1',
      description: 'Mixed-use high-rise development, 42 floors, Bangkok CBD. Budget: ฿2.4B.',
      memberIds: [MOCK_UID.alice, MOCK_UID.bob, MOCK_UID.carol, MOCK_UID.david, MOCK_UID.eve],
      roles: {
        [MOCK_UID.alice]: 'Admin',
        [MOCK_UID.bob]:   'Engineer',
        [MOCK_UID.carol]: 'Viewer',
        [MOCK_UID.david]: 'Manager',
        [MOCK_UID.eve]:   'Engineer',
      },
      createdBy: MOCK_UID.alice,
      createdAt: ts('2026-01-10'),
    },
    {
      name: 'Riverside Mixed-Use',
      description: 'Riverside condominium and retail complex, Chao Phraya waterfront. Budget: ฿980M.',
      memberIds: [MOCK_UID.alice, MOCK_UID.bob, MOCK_UID.david],
      roles: {
        [MOCK_UID.alice]: 'Admin',
        [MOCK_UID.bob]:   'Engineer',
        [MOCK_UID.david]: 'Manager',
      },
      createdBy: MOCK_UID.alice,
      createdAt: ts('2026-02-01'),
    },
  ]
  const projectIds: string[] = []
  for (const project of projects) {
    const ref = await subCol('projects').add(project)
    projectIds.push(ref.id)
    console.log(`  ✓ Project: ${project.name} (id: ${ref.id})`)
  }
  return projectIds
}

async function seedTransmittalsCMG(projectId: string) {
  console.log('⏳ Seeding transmittals – CMG Tower...')
  const transmittals = [
    // ── Incoming (10) ──
    { projectId, type: 'in', transmittalNo: 'TR-IN-26-001', sender: 'Main Contractor (BCS Co., Ltd.)',      recipient: 'CMG Engineering', date: ts('2026-03-01'), purpose: 'For Approval',     subject: 'Shop Drawings – Structural Steel Frame (Level B2–L3)',              status: 'Closed',       requiresReply: true,  createdBy: MOCK_UID.bob,   createdAt: ts('2026-03-01') },
    { projectId, type: 'in', transmittalNo: 'TR-IN-26-002', sender: 'Structural Consultant (SDC Partners)', recipient: 'CMG Engineering', date: ts('2026-03-05'), purpose: 'For Action',       subject: 'Method Statement – Piling Works (Bored Pile Ø600)',                 status: 'Closed',       requiresReply: true,  createdBy: MOCK_UID.david, createdAt: ts('2026-03-05') },
    { projectId, type: 'in', transmittalNo: 'TR-IN-26-003', sender: 'MEP Subcontractor (CoolTech MEP)',     recipient: 'CMG Engineering', date: ts('2026-03-10'), purpose: 'For Approval',     subject: 'Material Approval – HVAC Ducting (Galvanised Steel, 0.8mm)',        status: 'Under Review', requiresReply: true,  createdBy: MOCK_UID.eve,   createdAt: ts('2026-03-10') },
    { projectId, type: 'in', transmittalNo: 'TR-IN-26-004', sender: 'Client (CMG Property)',               recipient: 'CMG Engineering', date: ts('2026-03-12'), purpose: 'For Information',  subject: 'Meeting Minutes – Design Review March 2026',                        status: 'Closed',       requiresReply: false, createdBy: MOCK_UID.carol, createdAt: ts('2026-03-12') },
    { projectId, type: 'in', transmittalNo: 'TR-IN-26-005', sender: 'Main Contractor (BCS Co., Ltd.)',      recipient: 'CMG Engineering', date: ts('2026-03-15'), purpose: 'For Approval',     subject: 'Shop Drawings – Structural Steel Frame Rev.01 (Resubmission)',      status: 'Under Review', requiresReply: true,  createdBy: MOCK_UID.bob,   createdAt: ts('2026-03-15') },
    { projectId, type: 'in', transmittalNo: 'TR-IN-26-006', sender: 'MEP Subcontractor (CoolTech MEP)',     recipient: 'CMG Engineering', date: ts('2026-03-18'), purpose: 'For Approval',     subject: 'Material Approval – Chilled Water Pipe Insulation (19mm Armaflex)', status: 'Draft',        requiresReply: true,  createdBy: MOCK_UID.eve,   createdAt: ts('2026-03-18') },
    { projectId, type: 'in', transmittalNo: 'TR-IN-26-007', sender: 'Geotechnical Lab (GeoTest Co.)',       recipient: 'CMG Engineering', date: ts('2026-03-20'), purpose: 'For Record',       subject: 'Soil Investigation Report – Borehole BH-01 to BH-10',               status: 'Submitted',    requiresReply: false, createdBy: MOCK_UID.bob,   createdAt: ts('2026-03-20') },
    { projectId, type: 'in', transmittalNo: 'TR-IN-26-008', sender: 'Main Contractor (BCS Co., Ltd.)',      recipient: 'CMG Engineering', date: ts('2026-03-22'), purpose: 'For Approval',     subject: 'Material Approval – Reinforcing Steel Bar (SD40, Ø12–Ø32)',         status: 'Submitted',    requiresReply: true,  createdBy: MOCK_UID.bob,   createdAt: ts('2026-03-22') },
    { projectId, type: 'in', transmittalNo: 'TR-IN-26-009', sender: 'Structural Consultant (SDC Partners)', recipient: 'CMG Engineering', date: ts('2026-03-25'), purpose: 'For Action',       subject: 'RFI Response – Column Base Plate Detail (Grid C/5)',                status: 'Submitted',    requiresReply: true,  createdBy: MOCK_UID.david, createdAt: ts('2026-03-25') },
    { projectId, type: 'in', transmittalNo: 'TR-IN-26-010', sender: 'Client (CMG Property)',               recipient: 'CMG Engineering', date: ts('2026-03-28'), purpose: 'For Information',  subject: 'Revised Scope of Work – Basement Level B3 Car Park Extension',      status: 'Submitted',    requiresReply: false, createdBy: MOCK_UID.carol, createdAt: ts('2026-03-28') },
    // ── Outgoing (5) ──
    { projectId, type: 'out', transmittalNo: 'TR-OUT-26-001', sender: 'CMG Engineering', recipient: 'Main Contractor (BCS Co., Ltd.)',      date: ts('2026-03-03'), purpose: 'For Action',      subject: 'Review Comment – Shop Drawings STR-SD-001 Rev.00 (Code C)',         status: 'Closed',    requiresReply: false, createdBy: MOCK_UID.alice, createdAt: ts('2026-03-03') },
    { projectId, type: 'out', transmittalNo: 'TR-OUT-26-002', sender: 'CMG Engineering', recipient: 'Structural Consultant (SDC Partners)', date: ts('2026-03-07'), purpose: 'For Action',      subject: 'Approval – Method Statement Piling Works (Code A)',                 status: 'Closed',    requiresReply: false, createdBy: MOCK_UID.alice, createdAt: ts('2026-03-07') },
    { projectId, type: 'out', transmittalNo: 'TR-OUT-26-003', sender: 'CMG Engineering', recipient: 'Client (CMG Property)',               date: ts('2026-03-14'), purpose: 'For Information', subject: 'Monthly Progress Report – February 2026',                           status: 'Submitted', requiresReply: false, createdBy: MOCK_UID.alice, createdAt: ts('2026-03-14') },
    { projectId, type: 'out', transmittalNo: 'TR-OUT-26-004', sender: 'CMG Engineering', recipient: 'MEP Subcontractor (CoolTech MEP)',     date: ts('2026-03-16'), purpose: 'For Action',      subject: 'RFI #007 – HVAC Duct Routing Conflict at Level 5',                 status: 'Submitted', requiresReply: true,  createdBy: MOCK_UID.alice, createdAt: ts('2026-03-16') },
    { projectId, type: 'out', transmittalNo: 'TR-OUT-26-005', sender: 'CMG Engineering', recipient: 'Main Contractor (BCS Co., Ltd.)',      date: ts('2026-03-26'), purpose: 'For Action',      subject: 'Structural RFI #012 – Column Base Plate at Grid C/5',               status: 'Submitted', requiresReply: true,  createdBy: MOCK_UID.david, createdAt: ts('2026-03-26') },
  ]
  const ids: string[] = []
  for (const t of transmittals) {
    const ref = await subCol('transmittals').add(t)
    ids.push(ref.id)
    console.log(`  ✓ Transmittal: ${t.transmittalNo}`)
  }
  return ids
}

async function seedTransmittalsRiverside(projectId: string) {
  console.log('⏳ Seeding transmittals – Riverside...')
  const transmittals = [
    { projectId, type: 'in',  transmittalNo: 'RIV-IN-26-001',  sender: 'Architect (Design Studio Co.)',  recipient: 'CMG Engineering',            date: ts('2026-02-05'), purpose: 'For Approval',     subject: 'Design Development Drawings – Tower Block A (Level 1–10)',          status: 'Closed',       requiresReply: true,  createdBy: MOCK_UID.bob,   createdAt: ts('2026-02-05') },
    { projectId, type: 'in',  transmittalNo: 'RIV-IN-26-002',  sender: 'Civil Contractor (Rivercon)',    recipient: 'CMG Engineering',            date: ts('2026-02-18'), purpose: 'For Approval',     subject: 'Method Statement – Deep Excavation & Shoring',                     status: 'Under Review', requiresReply: true,  createdBy: MOCK_UID.bob,   createdAt: ts('2026-02-18') },
    { projectId, type: 'in',  transmittalNo: 'RIV-IN-26-003',  sender: 'MEP Consultant (TechServ)',      recipient: 'CMG Engineering',            date: ts('2026-03-02'), purpose: 'For Approval',     subject: 'Material Approval – Fire Suppression Sprinkler Heads (68°C)',       status: 'Submitted',    requiresReply: true,  createdBy: MOCK_UID.david, createdAt: ts('2026-03-02') },
    { projectId, type: 'in',  transmittalNo: 'RIV-IN-26-004',  sender: 'Client (Riverside Property)',   recipient: 'CMG Engineering',            date: ts('2026-03-10'), purpose: 'For Information',  subject: 'Revised Landscape Concept – Riverside Promenade Zone',              status: 'Closed',       requiresReply: false, createdBy: MOCK_UID.david, createdAt: ts('2026-03-10') },
    { projectId, type: 'in',  transmittalNo: 'RIV-IN-26-005',  sender: 'Civil Contractor (Rivercon)',   recipient: 'CMG Engineering',            date: ts('2026-03-18'), purpose: 'For Approval',     subject: 'Shop Drawings – Retaining Wall Type RW-01 (Riverside Promenade)',   status: 'Submitted',    requiresReply: true,  createdBy: MOCK_UID.bob,   createdAt: ts('2026-03-18') },
    { projectId, type: 'out', transmittalNo: 'RIV-OUT-26-001', sender: 'CMG Engineering',               recipient: 'Architect (Design Studio Co.)', date: ts('2026-02-15'), purpose: 'For Action',    subject: 'Review Comment – Design Development ARCH-DD-001 (Code B)',          status: 'Closed',    requiresReply: false, createdBy: MOCK_UID.alice, createdAt: ts('2026-02-15') },
    { projectId, type: 'out', transmittalNo: 'RIV-OUT-26-002', sender: 'CMG Engineering',               recipient: 'Client (Riverside Property)',   date: ts('2026-03-01'), purpose: 'For Information', subject: 'Monthly Progress Report – January 2026',                          status: 'Submitted', requiresReply: false, createdBy: MOCK_UID.alice, createdAt: ts('2026-03-01') },
    { projectId, type: 'out', transmittalNo: 'RIV-OUT-26-003', sender: 'CMG Engineering',               recipient: 'Civil Contractor (Rivercon)',   date: ts('2026-03-20'), purpose: 'For Action',    subject: 'RFI #003 – Retaining Wall Toe Condition at STA 2+450',             status: 'Submitted', requiresReply: true,  createdBy: MOCK_UID.david, createdAt: ts('2026-03-20') },
  ]
  const ids: string[] = []
  for (const t of transmittals) {
    const ref = await subCol('transmittals').add(t)
    ids.push(ref.id)
    console.log(`  ✓ Transmittal: ${t.transmittalNo}`)
  }
  return ids
}

async function seedDocumentsCMG(projectId: string, trIds: string[]) {
  console.log('⏳ Seeding documents – CMG Tower...')
  const [trIn1, trIn2, trIn3, , trIn5, trIn6, trIn7, trIn8, , , , , trOut3] = trIds

  const documents = [
    // STR-SD-001 Rev.00 – Superseded (Code C → resubmit)
    { projectId, transmittalId: trIn1,  documentNo: 'STR-SD-001', title: 'Shop Drawings – Structural Steel Frame (Level B2–L3)',              category: 'Drawing',          revision: 'Rev.00', fileUrl: '', status: 'Revise and Resubmit', isLatest: false, statusCode: 'C', reviewComment: 'Connection details at Grid A/3 insufficient. Revise weld schedule.',          createdBy: MOCK_UID.bob,   createdAt: ts('2026-03-01'), updatedAt: ts('2026-03-03'), updatedBy: MOCK_UID.alice },
    // STR-SD-001 Rev.01 – Latest (Under Review)
    { projectId, transmittalId: trIn5,  documentNo: 'STR-SD-001', title: 'Shop Drawings – Structural Steel Frame (Level B2–L3)',              category: 'Drawing',          revision: 'Rev.01', fileUrl: '', status: 'Under Review',        isLatest: true,                                                                                                    createdBy: MOCK_UID.bob,   createdAt: ts('2026-03-15'), updatedAt: ts('2026-03-15'), updatedBy: MOCK_UID.bob   },
    // STR-SD-002 Rev.00 – Approved (Code A)
    { projectId, transmittalId: trIn1,  documentNo: 'STR-SD-002', title: 'Foundation GA Plan – Piled Raft (Grid A–E)',                        category: 'Drawing',          revision: 'Rev.00', fileUrl: '', status: 'Approved',            isLatest: true,  statusCode: 'A',                                                                                             createdBy: MOCK_UID.bob,   createdAt: ts('2026-03-01'), updatedAt: ts('2026-03-07'), updatedBy: MOCK_UID.alice },
    // STR-SD-003 Rev.00 – Submitted (new)
    { projectId, transmittalId: trIn8,  documentNo: 'STR-SD-003', title: 'Shop Drawings – Reinforced Concrete Columns (Level L4–L10)',         category: 'Drawing',          revision: 'Rev.00', fileUrl: '', status: 'Submitted',           isLatest: true,                                                                                                    createdBy: MOCK_UID.bob,   createdAt: ts('2026-03-22'), updatedAt: ts('2026-03-22'), updatedBy: MOCK_UID.bob   },
    // CIV-MS-001 Rev.00 – Approved (Code A)
    { projectId, transmittalId: trIn2,  documentNo: 'CIV-MS-001', title: 'Method Statement – Piling Works (Bored Pile Ø600)',                  category: 'Method Statement', revision: 'Rev.00', fileUrl: '', status: 'Approved',            isLatest: true,  statusCode: 'A', reviewComment: 'Approved. Proceed as per submitted method.',                                createdBy: MOCK_UID.david, createdAt: ts('2026-03-05'), updatedAt: ts('2026-03-07'), updatedBy: MOCK_UID.alice },
    // MEP-MA-001 Rev.00 – Under Review
    { projectId, transmittalId: trIn3,  documentNo: 'MEP-MA-001', title: 'Material Approval – HVAC Ducting (Galvanised Steel, 0.8mm)',          category: 'Material Approval',revision: 'Rev.00', fileUrl: '', status: 'Under Review',        isLatest: true,                                                                                                    createdBy: MOCK_UID.eve,   createdAt: ts('2026-03-10'), updatedAt: ts('2026-03-10'), updatedBy: MOCK_UID.eve   },
    // MEP-MA-002 Rev.00 – Draft
    { projectId, transmittalId: trIn6,  documentNo: 'MEP-MA-002', title: 'Material Approval – Chilled Water Pipe Insulation (19mm Armaflex)',   category: 'Material Approval',revision: 'Rev.00', fileUrl: '', status: 'Draft',               isLatest: true,                                                                                                    createdBy: MOCK_UID.eve,   createdAt: ts('2026-03-18'), updatedAt: ts('2026-03-18'), updatedBy: MOCK_UID.eve   },
    // STR-SP-001 Rev.00 – Approved as Noted (Code B)
    { projectId, transmittalId: trIn1,  documentNo: 'STR-SP-001', title: 'Structural Steel Fabrication Specification',                          category: 'Specification',    revision: 'Rev.00', fileUrl: '', status: 'Approved as Noted',   isLatest: true,  statusCode: 'B', reviewComment: 'Approved. Note: Refer to latest ASTM A992 for wide flange sections.',      createdBy: MOCK_UID.bob,   createdAt: ts('2026-03-01'), updatedAt: ts('2026-03-07'), updatedBy: MOCK_UID.alice },
    // MEP-SP-001 Rev.00 – Submitted
    { projectId, transmittalId: trIn3,  documentNo: 'MEP-SP-001', title: 'MEP Works Specification – HVAC System (Chilled Water)',               category: 'Specification',    revision: 'Rev.00', fileUrl: '', status: 'Submitted',           isLatest: true,                                                                                                    createdBy: MOCK_UID.eve,   createdAt: ts('2026-03-10'), updatedAt: ts('2026-03-10'), updatedBy: MOCK_UID.eve   },
    // GEO-RPT-001 Rev.00 – For Record
    { projectId, transmittalId: trIn7,  documentNo: 'GEO-RPT-001',title: 'Soil Investigation Report – Borehole BH-01 to BH-10',                 category: 'Report',           revision: 'Rev.00', fileUrl: '', status: 'Submitted',           isLatest: true,                                                                                                    createdBy: MOCK_UID.bob,   createdAt: ts('2026-03-20'), updatedAt: ts('2026-03-20'), updatedBy: MOCK_UID.bob   },
    // GEN-RPT-001 Rev.00 – Monthly Report
    { projectId, transmittalId: trOut3, documentNo: 'GEN-RPT-001',title: 'Monthly Progress Report – February 2026',                             category: 'Report',           revision: 'Rev.00', fileUrl: '', status: 'Submitted',           isLatest: true,                                                                                                    createdBy: MOCK_UID.alice, createdAt: ts('2026-03-14'), updatedAt: ts('2026-03-14'), updatedBy: MOCK_UID.alice },
    // STR-CORR-001 – Rejected (Code D)
    { projectId, transmittalId: trIn2,  documentNo: 'STR-CORR-001',title: 'Correspondence – Steel Supplier Change Request (BCS to SteelMax)',   category: 'Correspondence',   revision: 'Rev.00', fileUrl: '', status: 'Rejected',            isLatest: true,  statusCode: 'D', reviewComment: 'Supplier change not approved. Original approved supplier must be used.',    createdBy: MOCK_UID.bob,   createdAt: ts('2026-03-05'), updatedAt: ts('2026-03-12'), updatedBy: MOCK_UID.alice },
  ]

  const ids: string[] = []
  for (const doc of documents) {
    const ref = await subCol('documents').add(doc)
    ids.push(ref.id)
    console.log(`  ✓ Document: ${doc.documentNo} ${doc.revision}`)
  }
  return ids
}

async function seedDocumentsRiverside(projectId: string, trIds: string[]) {
  console.log('⏳ Seeding documents – Riverside...')
  const [rivIn1, rivIn2, rivIn3, , rivIn5, , rivOut2] = trIds

  const documents = [
    { projectId, transmittalId: rivIn1,  documentNo: 'ARCH-DD-001', title: 'Design Development Drawings – Tower Block A (Level 1–10)',          category: 'Drawing',          revision: 'Rev.00', fileUrl: '', status: 'Approved as Noted',   isLatest: true,  statusCode: 'B', reviewComment: 'Approved as noted. Revise window schedule on Level 5.',                     createdBy: MOCK_UID.bob,   createdAt: ts('2026-02-05'), updatedAt: ts('2026-02-15'), updatedBy: MOCK_UID.alice },
    { projectId, transmittalId: rivIn2,  documentNo: 'CIV-EX-001',  title: 'Method Statement – Deep Excavation & Shoring Works',               category: 'Method Statement', revision: 'Rev.00', fileUrl: '', status: 'Under Review',        isLatest: true,                                                                                                    createdBy: MOCK_UID.bob,   createdAt: ts('2026-02-18'), updatedAt: ts('2026-02-18'), updatedBy: MOCK_UID.bob   },
    { projectId, transmittalId: rivIn3,  documentNo: 'MEP-MA-001',  title: 'Material Approval – Fire Suppression Sprinkler Heads (68°C)',       category: 'Material Approval',revision: 'Rev.00', fileUrl: '', status: 'Submitted',           isLatest: true,                                                                                                    createdBy: MOCK_UID.david, createdAt: ts('2026-03-02'), updatedAt: ts('2026-03-02'), updatedBy: MOCK_UID.david },
    { projectId, transmittalId: rivIn5,  documentNo: 'STR-RW-001',  title: 'Shop Drawings – Retaining Wall Type RW-01 (Riverside Promenade)',   category: 'Drawing',          revision: 'Rev.00', fileUrl: '', status: 'Submitted',           isLatest: true,                                                                                                    createdBy: MOCK_UID.bob,   createdAt: ts('2026-03-18'), updatedAt: ts('2026-03-18'), updatedBy: MOCK_UID.bob   },
    { projectId, transmittalId: rivOut2, documentNo: 'GEN-RPT-001', title: 'Monthly Progress Report – January 2026',                            category: 'Report',           revision: 'Rev.00', fileUrl: '', status: 'Submitted',           isLatest: true,                                                                                                    createdBy: MOCK_UID.alice, createdAt: ts('2026-03-01'), updatedAt: ts('2026-03-01'), updatedBy: MOCK_UID.alice },
  ]

  const ids: string[] = []
  for (const doc of documents) {
    const ref = await subCol('documents').add(doc)
    ids.push(ref.id)
    console.log(`  ✓ Document: ${doc.documentNo} ${doc.revision}`)
  }
  return ids
}

async function seedDocumentHistoryCMG(projectId: string, docIds: string[]) {
  console.log('⏳ Seeding document_history – CMG Tower...')
  const [docSD001R00, docSD001R01, docSD002, docSD003, docMS001, docMA001, docMA002, docSP001, docSP002MEP, docGeoRpt, docRpt, docCorr] = docIds

  const logs = [
    { projectId, documentId: docSD001R00, documentNo: 'STR-SD-001',  action: 'Created',         performedBy: MOCK_UID.bob,   performedByName: 'Bob Tanaka',   timestamp: ts('2026-03-01'), newStatus: 'Submitted' },
    { projectId, documentId: docSD001R00, documentNo: 'STR-SD-001',  action: 'Status Updated',   performedBy: MOCK_UID.alice, performedByName: 'Alice Srisuk', timestamp: ts('2026-03-03'), previousStatus: 'Submitted',     newStatus: 'Revise and Resubmit', comment: 'Connection details at Grid A/3 insufficient. Revise weld schedule.' },
    { projectId, documentId: docSD001R01, documentNo: 'STR-SD-001',  action: 'Revision Created', performedBy: MOCK_UID.bob,   performedByName: 'Bob Tanaka',   timestamp: ts('2026-03-15'), previousRevision: 'Rev.00', newRevision: 'Rev.01', newStatus: 'Submitted', comment: 'Revised per comment. Weld schedule updated, Grid A/3 connection detailed.' },
    { projectId, documentId: docSD002,    documentNo: 'STR-SD-002',  action: 'Created',         performedBy: MOCK_UID.bob,   performedByName: 'Bob Tanaka',   timestamp: ts('2026-03-01'), newStatus: 'Submitted' },
    { projectId, documentId: docSD002,    documentNo: 'STR-SD-002',  action: 'Status Updated',   performedBy: MOCK_UID.alice, performedByName: 'Alice Srisuk', timestamp: ts('2026-03-07'), previousStatus: 'Submitted',     newStatus: 'Approved' },
    { projectId, documentId: docSD003,    documentNo: 'STR-SD-003',  action: 'Created',         performedBy: MOCK_UID.bob,   performedByName: 'Bob Tanaka',   timestamp: ts('2026-03-22'), newStatus: 'Submitted' },
    { projectId, documentId: docMS001,    documentNo: 'CIV-MS-001',  action: 'Created',         performedBy: MOCK_UID.david, performedByName: 'David Chen',   timestamp: ts('2026-03-05'), newStatus: 'Submitted' },
    { projectId, documentId: docMS001,    documentNo: 'CIV-MS-001',  action: 'Status Updated',   performedBy: MOCK_UID.alice, performedByName: 'Alice Srisuk', timestamp: ts('2026-03-07'), previousStatus: 'Submitted',     newStatus: 'Approved',            comment: 'Approved. Proceed as per submitted method.' },
    { projectId, documentId: docMA001,    documentNo: 'MEP-MA-001',  action: 'Created',         performedBy: MOCK_UID.eve,   performedByName: 'Eve Nakamura', timestamp: ts('2026-03-10'), newStatus: 'Submitted' },
    { projectId, documentId: docMA001,    documentNo: 'MEP-MA-001',  action: 'Status Updated',   performedBy: MOCK_UID.alice, performedByName: 'Alice Srisuk', timestamp: ts('2026-03-11'), previousStatus: 'Submitted',     newStatus: 'Under Review' },
    { projectId, documentId: docMA002,    documentNo: 'MEP-MA-002',  action: 'Created',         performedBy: MOCK_UID.eve,   performedByName: 'Eve Nakamura', timestamp: ts('2026-03-18'), newStatus: 'Draft' },
    { projectId, documentId: docSP001,    documentNo: 'STR-SP-001',  action: 'Created',         performedBy: MOCK_UID.bob,   performedByName: 'Bob Tanaka',   timestamp: ts('2026-03-01'), newStatus: 'Submitted' },
    { projectId, documentId: docSP001,    documentNo: 'STR-SP-001',  action: 'Status Updated',   performedBy: MOCK_UID.alice, performedByName: 'Alice Srisuk', timestamp: ts('2026-03-07'), previousStatus: 'Submitted',     newStatus: 'Approved as Noted',   comment: 'Approved. Note: Refer to latest ASTM A992 for wide flange sections.' },
    { projectId, documentId: docSP002MEP, documentNo: 'MEP-SP-001',  action: 'Created',         performedBy: MOCK_UID.eve,   performedByName: 'Eve Nakamura', timestamp: ts('2026-03-10'), newStatus: 'Submitted' },
    { projectId, documentId: docGeoRpt,   documentNo: 'GEO-RPT-001', action: 'Created',         performedBy: MOCK_UID.bob,   performedByName: 'Bob Tanaka',   timestamp: ts('2026-03-20'), newStatus: 'Submitted' },
    { projectId, documentId: docRpt,      documentNo: 'GEN-RPT-001', action: 'Created',         performedBy: MOCK_UID.alice, performedByName: 'Alice Srisuk', timestamp: ts('2026-03-14'), newStatus: 'Submitted' },
    { projectId, documentId: docCorr,     documentNo: 'STR-CORR-001',action: 'Created',         performedBy: MOCK_UID.bob,   performedByName: 'Bob Tanaka',   timestamp: ts('2026-03-05'), newStatus: 'Submitted' },
    { projectId, documentId: docCorr,     documentNo: 'STR-CORR-001',action: 'Status Updated',   performedBy: MOCK_UID.alice, performedByName: 'Alice Srisuk', timestamp: ts('2026-03-12'), previousStatus: 'Submitted',     newStatus: 'Rejected',            comment: 'Supplier change not approved. Original approved supplier must be used.' },
  ]

  for (const log of logs) {
    await subCol('document_history').add(log)
    console.log(`  ✓ History: ${log.documentNo} → ${log.action}`)
  }
}

async function seedDocumentHistoryRiverside(projectId: string, docIds: string[]) {
  console.log('⏳ Seeding document_history – Riverside...')
  const [docArch, docEx, docFire, docRW, docRpt] = docIds

  const logs = [
    { projectId, documentId: docArch, documentNo: 'ARCH-DD-001', action: 'Created',       performedBy: MOCK_UID.bob,   performedByName: 'Bob Tanaka',   timestamp: ts('2026-02-05'), newStatus: 'Submitted' },
    { projectId, documentId: docArch, documentNo: 'ARCH-DD-001', action: 'Status Updated', performedBy: MOCK_UID.alice, performedByName: 'Alice Srisuk', timestamp: ts('2026-02-15'), previousStatus: 'Submitted', newStatus: 'Approved as Noted', comment: 'Approved as noted. Revise window schedule on Level 5.' },
    { projectId, documentId: docEx,   documentNo: 'CIV-EX-001',  action: 'Created',       performedBy: MOCK_UID.bob,   performedByName: 'Bob Tanaka',   timestamp: ts('2026-02-18'), newStatus: 'Submitted' },
    { projectId, documentId: docEx,   documentNo: 'CIV-EX-001',  action: 'Status Updated', performedBy: MOCK_UID.alice, performedByName: 'Alice Srisuk', timestamp: ts('2026-02-20'), previousStatus: 'Submitted', newStatus: 'Under Review' },
    { projectId, documentId: docFire, documentNo: 'MEP-MA-001',  action: 'Created',       performedBy: MOCK_UID.david, performedByName: 'David Chen',   timestamp: ts('2026-03-02'), newStatus: 'Submitted' },
    { projectId, documentId: docRW,   documentNo: 'STR-RW-001',  action: 'Created',       performedBy: MOCK_UID.bob,   performedByName: 'Bob Tanaka',   timestamp: ts('2026-03-18'), newStatus: 'Submitted' },
    { projectId, documentId: docRpt,  documentNo: 'GEN-RPT-001', action: 'Created',       performedBy: MOCK_UID.alice, performedByName: 'Alice Srisuk', timestamp: ts('2026-03-01'), newStatus: 'Submitted' },
  ]

  for (const log of logs) {
    await subCol('document_history').add(log)
    console.log(`  ✓ History: ${log.documentNo} → ${log.action}`)
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 CDMS Firestore Seed Script')
  console.log('================================\n')

  try {
    await db.collection(ROOT_COL).doc(ROOT_DOC).set({ _init: true, createdAt: Timestamp.now() }, { merge: true })
    console.log(`  ✓ Root document: ${ROOT_COL}/${ROOT_DOC}`)

    await cleanupCollections()
    await seedUsers()
    const [cmgId, rivId] = await seedProjects()

    // ── CMG Tower ──
    const cmgTrIds  = await seedTransmittalsCMG(cmgId)
    const cmgDocIds = await seedDocumentsCMG(cmgId, cmgTrIds)
    await seedDocumentHistoryCMG(cmgId, cmgDocIds)

    // ── Riverside ──
    const rivTrIds  = await seedTransmittalsRiverside(rivId)
    const rivDocIds = await seedDocumentsRiverside(rivId, rivTrIds)
    await seedDocumentHistoryRiverside(rivId, rivDocIds)

    console.log('\n✅ Seed complete! Path: CMG-cdms-DocControl/root/{subcollection}')
    console.log('   • users              : 5 records (alice/bob/carol/david/eve)')
    console.log('   • projects           : 2 records (CMG Tower, Riverside)')
    console.log('   • transmittals       : 23 records (15 CMG + 8 Riverside)')
    console.log('   • documents          : 17 records (12 CMG + 5 Riverside)')
    console.log('   • document_history   : 25 records')
    console.log('\n💡 Login credentials:')
    console.log('   alice@cmg-engineering.com / Alice@1234  (MasterAdmin)')
    console.log('   bob@main-contractor.com   / Bob@1234    (Engineer)')
    console.log('   carol@client.com          / Carol@1234  (Viewer – pending)')
    console.log('   david@sdc-partners.com    / David@1234  (Manager)')
    console.log('   eve@cooltech-mep.com      / Eve@1234    (Engineer)\n')
  } catch (err) {
    console.error('\n❌ Seed failed:', err)
    process.exit(1)
  }
}

main()
