import { useState } from 'react'
import {
  BookOpen, ChevronRight, Info, Users, LogIn, LayoutDashboard,
  ArrowDownToLine, ArrowUpFromLine, FolderOpen, Layers, UserCog,
  Lock, Tag, GitBranch, AlertCircle, ListChecks,
} from 'lucide-react'

interface Section {
  id: string
  title: string
  icon: React.ElementType
}

const SECTIONS: Section[] = [
  { id: 'overview',       title: '1. ภาพรวมและหลักการ',           icon: Info },
  { id: 'roles',          title: '2. User Role และสิทธิ์',          icon: Users },
  { id: 'login',          title: '3. การเข้าสู่ระบบ',               icon: LogIn },
  { id: 'dashboard',      title: '4. Dashboard',                    icon: LayoutDashboard },
  { id: 'transmittal-in', title: '5. Transmittal In',               icon: ArrowDownToLine },
  { id: 'transmittal-out',title: '6. Transmittal Out',              icon: ArrowUpFromLine },
  { id: 'documents',      title: '7. Document Register',            icon: FolderOpen },
  { id: 'projects',       title: '8. Project Management',           icon: Layers },
  { id: 'users',          title: '9. User Management',              icon: UserCog },
  { id: 'editlock',       title: '10. Edit Lock',                   icon: Lock },
  { id: 'statuscode',     title: '11. Status Code',                 icon: Tag },
  { id: 'workflow',       title: '12. Workflow ภาพรวม',             icon: GitBranch },
  { id: 'troubleshoot',   title: '13. การแก้ปัญหาเบื้องต้น',        icon: AlertCircle },
  { id: 'workflow-detail', title: '14. Workflow โดยละเอียด',           icon: ListChecks },
]

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2 scroll-mt-6">
      {children}
    </h2>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-gray-800 mt-6 mb-2">{children}</h3>
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 my-4">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-2.5 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">{children}</th>
}

function Td({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return <td className={`px-4 py-2.5 border-b border-gray-100 text-gray-700 ${center ? 'text-center' : ''}`}>{children}</td>
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>{children}</span>
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-gray-50 border border-gray-200 border-l-4 border-l-blue-400 text-gray-700 rounded-lg p-4 text-xs font-mono overflow-x-auto my-4 leading-relaxed whitespace-pre">
      {children}
    </pre>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 border-l-4 border-l-blue-500 rounded-lg px-4 py-3 my-4 text-sm text-blue-800">
      {children}
    </div>
  )
}

function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 rounded-lg px-4 py-3 my-4 text-sm text-amber-800">
      {children}
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 mb-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{n}</span>
      <div className="text-sm text-gray-700 pt-0.5">{children}</div>
    </div>
  )
}

export default function UserManualPage() {
  const [activeSection, setActiveSection] = useState('overview')

  function scrollTo(id: string) {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex gap-6 h-full">

      {/* ── TOC Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0">
        <div className="sticky top-0">
          <div className="flex items-center gap-2 mb-4 px-1">
            <BookOpen size={18} className="text-blue-600" />
            <span className="font-semibold text-gray-800 text-sm">สารบัญ</span>
          </div>
          <nav className="space-y-0.5">
            {SECTIONS.map(({ id, title, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                  activeSection === id
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <Icon size={13} className="shrink-0" />
                <span className="truncate">{title}</span>
                {activeSection === id && <ChevronRight size={12} className="ml-auto shrink-0" />}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 px-8 py-6 overflow-y-auto">

        {/* Page Header */}
        <div className="flex items-start gap-4 pb-6 border-b border-gray-200 mb-2">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <BookOpen size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">คู่มือการใช้งานระบบ CDMS</h1>
            <p className="text-sm text-gray-500 mt-1">Construction Document Control System · v1.0.0</p>
          </div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 1: Overview */}
        {/* ════════════════════════════════════════ */}
        <SectionTitle id="overview"><Info size={18} className="text-blue-500" /> ภาพรวมและหลักการของระบบ</SectionTitle>

        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          CDMS (Construction Document Control System) คือระบบควบคุมเอกสารสำหรับโครงการก่อสร้าง ออกแบบมาเพื่อติดตามการรับ-ส่งเอกสาร
          ควบคุมเวอร์ชันเอกสาร และบันทึก Audit Trail ทุกการเปลี่ยนแปลง
        </p>

        <SubTitle>แนวคิดหลัก (Core Concepts)</SubTitle>
        <TableWrapper>
          <thead><tr><Th>แนวคิด</Th><Th>คำอธิบาย</Th><Th>ตัวอย่าง</Th></tr></thead>
          <tbody>
            <tr><Td><strong>Transmittal</strong></Td><Td>ใบนำส่งเอกสาร — "ซอง" ที่ใช้ส่ง/รับเอกสาร</Td><Td><code className="bg-gray-100 px-1 rounded text-xs">TR-IN-26-001</code></Td></tr>
            <tr><Td><strong>Document</strong></Td><Td>ไฟล์เอกสารจริง มีเลขที่และ Revision</Td><Td><code className="bg-gray-100 px-1 rounded text-xs">STR-SD-001 Rev.00</code></Td></tr>
            <tr><Td><strong>Revision</strong></Td><Td>การแก้ไขเอกสารแต่ละครั้ง เพิ่มขึ้นทีละ 1</Td><Td>Rev.00 → Rev.01 → Rev.02</Td></tr>
            <tr><Td><strong>Status Code</strong></Td><Td>รหัสผลการตรวจสอบ A/B/C/D</Td><Td>A = Approved</Td></tr>
            <tr><Td><strong>Project</strong></Td><Td>หน่วยหลักของระบบ ข้อมูลทุกอย่างแยกตามโครงการ</Td><Td>—</Td></tr>
          </tbody>
        </TableWrapper>

        <SubTitle>ประเภท Transmittal Purpose</SubTitle>
        <TableWrapper>
          <thead><tr><Th>Purpose</Th><Th>ความหมาย</Th><Th>ต้อง Reply</Th><Th>ต้อง Status Code</Th></tr></thead>
          <tbody>
            <tr><Td><Badge color="bg-purple-100 text-purple-700">For Approval</Badge></Td><Td>ส่งเพื่อขออนุมัติ</Td><Td center>✅</Td><Td center>✅</Td></tr>
            <tr><Td><Badge color="bg-blue-100 text-blue-700">For Action</Badge></Td><Td>ส่งเพื่อขอดำเนินการ</Td><Td center>✅</Td><Td center>✅</Td></tr>
            <tr><Td><Badge color="bg-gray-100 text-gray-600">For Information</Badge></Td><Td>ส่งเพื่อทราบ</Td><Td center>❌</Td><Td center>❌</Td></tr>
            <tr><Td><Badge color="bg-gray-100 text-gray-600">For Record</Badge></Td><Td>ส่งเพื่อเก็บบันทึก</Td><Td center>❌</Td><Td center>❌</Td></tr>
          </tbody>
        </TableWrapper>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 2: Roles */}
        {/* ════════════════════════════════════════ */}
        <SectionTitle id="roles"><Users size={18} className="text-green-500" /> User Role และสิทธิ์การใช้งาน</SectionTitle>

        <SubTitle>ตารางสิทธิ์ตาม Role</SubTitle>
        <TableWrapper>
          <thead>
            <tr>
              <Th>เมนู / Module</Th>
              <Th>MasterAdmin</Th><Th>Admin</Th><Th>Manager</Th><Th>Engineer</Th><Th>Viewer</Th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Dashboard', true, true, true, true, true],
              ['Transmittal In', true, true, true, true, true],
              ['Transmittal Out', true, true, true, true, true],
              ['Document Register', true, true, true, true, true],
              ['Project Management', true, true, true, false, false],
              ['Settings', true, true, false, false, false],
              ['User Management', true, false, false, false, false],
            ].map(([label, ...perms]) => (
              <tr key={String(label)}>
                <Td><strong>{label}</strong></Td>
                {(perms as boolean[]).map((p, i) => (
                  <Td key={i} center>{p ? '✅' : '❌'}</Td>
                ))}
              </tr>
            ))}
          </tbody>
        </TableWrapper>

        <SubTitle>สิทธิ์การเขียนข้อมูล</SubTitle>
        <TableWrapper>
          <thead><tr><Th>การดำเนินการ</Th><Th>MasterAdmin</Th><Th>Admin</Th><Th>Manager</Th><Th>Engineer</Th><Th>Viewer</Th></tr></thead>
          <tbody>
            {[
              ['สร้าง Transmittal ใหม่', true, true, true, true, false],
              ['สร้าง Document ใหม่', true, true, true, true, false],
              ['แก้ไข / ลบ Transmittal', true, true, false, false, false],
              ['แก้ไข / ลบ Document', true, true, false, false, false],
              ['สร้างโครงการ', true, true, true, false, false],
              ['Approve / Disable User', true, false, false, false, false],
            ].map(([label, ...perms]) => (
              <tr key={String(label)}>
                <Td>{label}</Td>
                {(perms as boolean[]).map((p, i) => <Td key={i} center>{p ? '✅' : '❌'}</Td>)}
              </tr>
            ))}
          </tbody>
        </TableWrapper>

        <SubTitle>สถานะ User Account</SubTitle>
        <TableWrapper>
          <thead><tr><Th>สถานะ</Th><Th>ความหมาย</Th><Th>เข้าระบบได้</Th></tr></thead>
          <tbody>
            <tr><Td><Badge color="bg-orange-100 text-orange-700">pending</Badge></Td><Td>รอการอนุมัติจาก MasterAdmin</Td><Td center>❌</Td></tr>
            <tr><Td><Badge color="bg-green-100 text-green-700">active</Badge></Td><Td>ใช้งานได้ปกติ</Td><Td center>✅</Td></tr>
            <tr><Td><Badge color="bg-red-100 text-red-700">disabled</Badge></Td><Td>ถูกระงับการใช้งาน</Td><Td center>❌</Td></tr>
          </tbody>
        </TableWrapper>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 3: Login */}
        {/* ════════════════════════════════════════ */}
        <SectionTitle id="login"><LogIn size={18} className="text-indigo-500" /> การเข้าสู่ระบบ (Login Workflow)</SectionTitle>

        <SubTitle>การ Login ด้วย Email / Password</SubTitle>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 my-4 text-sm text-gray-700 space-y-2">
          <Step n={1}>กรอก Email และ Password → กด <strong>Sign In</strong></Step>
          <Step n={2}>Firebase Authentication ตรวจสอบ Credentials</Step>
          <Step n={3}>ระบบดึง User Document จาก Firestore ตรวจสอบ <code className="bg-gray-200 px-1 rounded">status</code></Step>
          <Step n={4}><Badge color="bg-orange-100 text-orange-700">pending</Badge> หรือ <Badge color="bg-red-100 text-red-700">disabled</Badge> → Sign Out อัตโนมัติ + แสดงข้อความแจ้ง</Step>
          <Step n={5}><Badge color="bg-green-100 text-green-700">active</Badge> → เข้าระบบสำเร็จ → Redirect ไป Dashboard</Step>
        </div>

        <SubTitle>การสมัคร / Login ครั้งแรกด้วย Google</SubTitle>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 my-4 text-sm text-gray-700 space-y-2">
          <Step n={1}>กด <strong>Continue with Google</strong> → เลือก Google Account</Step>
          <Step n={2}>ระบบสร้าง User Document อัตโนมัติ (role: Viewer, <Badge color="bg-orange-100 text-orange-700">pending</Badge>)</Step>
          <Step n={3}>หน้าจอแสดง "Account Pending Approval"</Step>
          <Step n={4}>MasterAdmin เห็น Badge สีส้มใน Sidebar → เข้าหน้า Users → Approve</Step>
          <Step n={5}>User เข้าระบบได้ทันที</Step>
        </div>

        <InfoBox>
          💡 <strong>การเลือกโครงการ:</strong> MasterAdmin/Admin เห็นทุกโครงการ — ผู้ใช้อื่นเห็นเฉพาะโครงการที่ MasterAdmin กำหนดใน <strong>assignedProjectIds</strong>
        </InfoBox>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 4: Dashboard */}
        {/* ════════════════════════════════════════ */}
        <SectionTitle id="dashboard"><LayoutDashboard size={18} className="text-cyan-500" /> Dashboard</SectionTitle>

        <p className="text-sm text-gray-600 mb-4">แสดงภาพรวมสถานะของโครงการที่เลือกแบบ Real-time</p>

        <SubTitle>Summary Cards (4 การ์ด)</SubTitle>
        <TableWrapper>
          <thead><tr><Th>การ์ด</Th><Th>ข้อมูลที่แสดง</Th></tr></thead>
          <tbody>
            <tr><Td>Transmittals In</Td><Td>จำนวน Transmittal ขาเข้าทั้งหมด</Td></tr>
            <tr><Td>Transmittals Out</Td><Td>จำนวน Transmittal ขาออกทั้งหมด</Td></tr>
            <tr><Td>Documents</Td><Td>จำนวนเอกสาร (Latest Revision เท่านั้น)</Td></tr>
            <tr><Td>Pending Reply</Td><Td>Transmittal ที่ requiresReply=true และยังไม่ Closed</Td></tr>
          </tbody>
        </TableWrapper>

        <p className="text-sm text-gray-600">นอกจากนี้ยังแสดง <strong>Recent Transmittals</strong> ล่าสุด 10 รายการ (In + Out รวมกัน) เรียงตามวันที่ล่าสุด</p>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 5: Transmittal In */}
        {/* ════════════════════════════════════════ */}
        <SectionTitle id="transmittal-in"><ArrowDownToLine size={18} className="text-green-500" /> Transmittal In (รับเอกสาร)</SectionTitle>

        <p className="text-sm text-gray-600 mb-4">บันทึกและติดตามเอกสารที่ <strong>รับเข้า</strong> จากภายนอก เช่น ผู้รับเหมา ลูกค้า ที่ปรึกษา</p>

        <SubTitle>Transmittal Status</SubTitle>
        <TableWrapper>
          <thead><tr><Th>Status</Th><Th>ความหมาย</Th></tr></thead>
          <tbody>
            <tr><Td><Badge color="bg-gray-100 text-gray-600">Draft</Badge></Td><Td>ร่าง ยังไม่ส่ง</Td></tr>
            <tr><Td><Badge color="bg-blue-100 text-blue-700">Submitted</Badge></Td><Td>ส่งแล้ว รอดำเนินการ</Td></tr>
            <tr><Td><Badge color="bg-yellow-100 text-yellow-700">Under Review</Badge></Td><Td>อยู่ระหว่างการตรวจสอบ</Td></tr>
            <tr><Td><Badge color="bg-green-100 text-green-700">Closed</Badge></Td><Td>ปิดแล้ว ดำเนินการเสร็จสิ้น</Td></tr>
          </tbody>
        </TableWrapper>

        <SubTitle>Workflow สร้าง Transmittal In ใหม่</SubTitle>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 my-4 text-sm text-gray-700 space-y-2">
          <Step n={1}>กดปุ่ม <strong>+ New Transmittal In</strong></Step>
          <Step n={2}>ระบบตรวจสอบ Edit Lock — ถ้ามีคนอื่น Lock อยู่จะแสดง Banner แจ้ง</Step>
          <Step n={3}>กรอกข้อมูล: Transmittal No.* / Sender* / Subject* / Date / Purpose / Status</Step>
          <Step n={4}>แนบไฟล์ (รองรับหลายไฟล์ อัพโหลดไปยัง Firebase Storage)</Step>
          <Step n={5}>กด <strong>Save</strong> → บันทึกลง Firestore → ตารางอัพเดท Real-time ทันที</Step>
        </div>

        <InfoBox>💡 Transmittal ที่มี Purpose = <strong>For Approval</strong> หรือ <strong>For Action</strong> จะถูกตั้ง <code>requiresReply = true</code> อัตโนมัติ และนับใน Pending Reply บน Dashboard</InfoBox>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 6: Transmittal Out */}
        {/* ════════════════════════════════════════ */}
        <SectionTitle id="transmittal-out"><ArrowUpFromLine size={18} className="text-orange-500" /> Transmittal Out (ส่งเอกสาร)</SectionTitle>

        <p className="text-sm text-gray-600 mb-4">บันทึกและติดตามเอกสารที่ <strong>ส่งออก</strong> ไปยังภายนอก Workflow เหมือน Transmittal In แต่ <code className="bg-gray-100 px-1 rounded">type = 'out'</code></p>

        <SubTitle>ความแตกต่างจาก Transmittal In</SubTitle>
        <TableWrapper>
          <thead><tr><Th></Th><Th>Transmittal In</Th><Th>Transmittal Out</Th></tr></thead>
          <tbody>
            <tr><Td>ทิศทาง</Td><Td>รับเข้าจากภายนอก</Td><Td>ส่งออกไปภายนอก</Td></tr>
            <tr><Td>Sender</Td><Td>ผู้ส่งจากภายนอก</Td><Td>ฝ่ายของเรา</Td></tr>
            <tr><Td>Recipient</Td><Td>ฝ่ายของเรา</Td><Td>ผู้รับภายนอก</Td></tr>
            <tr><Td>เลขที่แนะนำ</Td><Td><code className="bg-gray-100 px-1 rounded text-xs">TR-IN-26-001</code></Td><Td><code className="bg-gray-100 px-1 rounded text-xs">TR-OUT-26-001</code></Td></tr>
          </tbody>
        </TableWrapper>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 7: Documents */}
        {/* ════════════════════════════════════════ */}
        <SectionTitle id="documents"><FolderOpen size={18} className="text-violet-500" /> Document Register (ทะเบียนเอกสาร)</SectionTitle>

        <p className="text-sm text-gray-600 mb-4">Master Register ของเอกสารทั้งหมดในโครงการ ติดตามสถานะและ Revision ของแต่ละเอกสาร</p>

        <SubTitle>Document Category</SubTitle>
        <div className="flex flex-wrap gap-2 my-3">
          {[
            ['Drawing','bg-indigo-100 text-indigo-700'],
            ['Specification','bg-violet-100 text-violet-700'],
            ['Material Approval','bg-pink-100 text-pink-700'],
            ['Method Statement','bg-cyan-100 text-cyan-700'],
            ['Report','bg-amber-100 text-amber-700'],
            ['Correspondence','bg-orange-100 text-orange-700'],
            ['Other','bg-gray-100 text-gray-600'],
          ].map(([label, cls]) => <Badge key={label} color={cls}>{label}</Badge>)}
        </div>

        <SubTitle>Document Status Flow</SubTitle>
        <CodeBlock>{`Draft → Submitted → Under Review ─┬─ Approved
                                  ├─ Approved as Noted
                                  ├─ Revise and Resubmit → (สร้าง Revision ใหม่)
                                  └─ Rejected

เมื่อมี Revision ใหม่:
  Rev.00  →  isLatest: false  →  Superseded
  Rev.01  →  isLatest: true   →  ปัจจุบัน`}</CodeBlock>

        <SubTitle>Workflow เพิ่มเอกสารใหม่</SubTitle>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 my-4 text-sm text-gray-700 space-y-2">
          <Step n={1}>กดปุ่ม <strong>+ Add Document</strong></Step>
          <Step n={2}>กรอกข้อมูล: Document No.* / Title* / Category / Revision / Status / Transmittal No.</Step>
          <Step n={3}>อัพโหลดไฟล์ (รองรับหลายไฟล์)</Step>
          <Step n={4}>กด <strong>Save</strong> → บันทึกลง Firestore พร้อม <code>isLatest: true</code></Step>
          <Step n={5}>ระบบสร้าง <strong>Audit Log</strong> ใน <code>document_history</code> อัตโนมัติ (action: Created)</Step>
        </div>

        <SubTitle>Revision Control</SubTitle>
        <p className="text-sm text-gray-600 mb-3">เมื่อเอกสารได้รับ <Badge color="bg-red-100 text-red-700">Code C — Revise and Resubmit</Badge> ระบบสร้าง Revision ใหม่อัตโนมัติ:</p>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 my-4 text-sm text-gray-700 space-y-2">
          <Step n={1}>Rev.00 ถูกอัพเดท: <code>isLatest: false</code>, status: Superseded</Step>
          <Step n={2}>สร้าง Rev.01 ใหม่: documentNo เดิม, <code>isLatest: true</code>, status: Submitted</Step>
          <Step n={3}>บันทึก document_history: action = "Revision Created"</Step>
          <Step n={4}>Engineer แนบไฟล์ใหม่ที่แก้ไขแล้ว → ส่ง Transmittal Out พร้อม Rev.01</Step>
        </div>

        <SubTitle>Show Superseded Toggle</SubTitle>
        <p className="text-sm text-gray-600">ค่าเริ่มต้นซ่อน Superseded — กด Toggle เพื่อแสดงทุก Revision ของเอกสาร</p>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 8: Projects */}
        {/* ════════════════════════════════════════ */}
        <SectionTitle id="projects"><Layers size={18} className="text-teal-500" /> Project Management (จัดการโครงการ)</SectionTitle>

        <p className="text-sm text-gray-600 mb-2">สำหรับ <strong>MasterAdmin, Admin, Manager</strong> เท่านั้น</p>

        <SubTitle>Workflow สร้างโครงการ</SubTitle>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 my-4 text-sm text-gray-700 space-y-2">
          <Step n={1}>กรอก <strong>Project Name</strong> (อย่างน้อย 3 ตัวอักษร) และ Description (ไม่บังคับ)</Step>
          <Step n={2}>ระบบตรวจสอบ Edit Lock ก่อนบันทึก</Step>
          <Step n={3}>กด <strong>Create Project</strong> → บันทึกลง Firestore</Step>
          <Step n={4}>ผู้สร้างถูกเพิ่มเป็น memberIds อัตโนมัติ</Step>
          <Step n={5}>Project Selector ใน Sidebar อัพเดททันที</Step>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 9: Users */}
        {/* ════════════════════════════════════════ */}
        <SectionTitle id="users"><UserCog size={18} className="text-purple-500" /> User Management (จัดการผู้ใช้งาน)</SectionTitle>

        <p className="text-sm text-gray-600 mb-2">สำหรับ <strong>MasterAdmin เท่านั้น</strong> — เข้าถึงได้ที่เมนู <strong>Users</strong> ใน Sidebar</p>

        <SubTitle>Actions ที่ทำได้</SubTitle>
        <TableWrapper>
          <thead><tr><Th>Action</Th><Th>เงื่อนไข</Th><Th>ผลลัพธ์</Th></tr></thead>
          <tbody>
            <tr><Td><Badge color="bg-green-100 text-green-700">Approve</Badge></Td><Td>User มี status = pending</Td><Td>status → active</Td></tr>
            <tr><Td><Badge color="bg-red-100 text-red-700">Disable</Badge></Td><Td>User มี status = active</Td><Td>status → disabled, เข้าระบบไม่ได้</Td></tr>
            <tr><Td><Badge color="bg-blue-100 text-blue-700">Re-enable</Badge></Td><Td>User มี status = disabled</Td><Td>status → active</Td></tr>
            <tr><Td>เปลี่ยน Role</Td><Td>ทุก User</Td><Td>เปลี่ยน Role ได้ 5 ระดับ</Td></tr>
            <tr><Td>กำหนดโครงการ</Td><Td>User ที่ไม่ใช่ Admin</Td><Td>กำหนด assignedProjectIds[]</Td></tr>
            <tr><Td><Badge color="bg-red-100 text-red-700">ลบ User</Badge></Td><Td>ทุก User (ต้องยืนยัน)</Td><Td>ลบ User Document ออกจาก Firestore</Td></tr>
          </tbody>
        </TableWrapper>

        <SubTitle>Workflow Approve User ใหม่</SubTitle>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 my-4 text-sm text-gray-700 space-y-2">
          <Step n={1}>User Sign In ครั้งแรก → ระบบสร้าง User Doc (status: pending)</Step>
          <Step n={2}>MasterAdmin เห็น Badge สีส้มที่เมนู Users ใน Sidebar</Step>
          <Step n={3}>เข้าหน้า Users → กรอง "Pending"</Step>
          <Step n={4}>เปลี่ยน Role ให้เหมาะสม (Viewer, Engineer, Manager, Admin)</Step>
          <Step n={5}>กด <strong>Approve</strong> → User เข้าระบบได้ทันที</Step>
        </div>

        <WarnBox>⚠️ การลบ User จะลบเฉพาะ User Document ใน Firestore — Firebase Auth account ยังคงอยู่ ต้องลบแยกใน Firebase Console หากต้องการ</WarnBox>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 10: Edit Lock */}
        {/* ════════════════════════════════════════ */}
        <SectionTitle id="editlock"><Lock size={18} className="text-amber-500" /> ระบบ Edit Lock (ป้องกันการแก้ไขซ้อน)</SectionTitle>

        <p className="text-sm text-gray-600 mb-4">เมื่อผู้ใช้เปิด Form ระบบจะ Lock ป้องกันผู้ใช้คนอื่นเปิด Form พร้อมกัน</p>

        <TableWrapper>
          <thead><tr><Th>Parameter</Th><Th>ค่า</Th><Th>คำอธิบาย</Th></tr></thead>
          <tbody>
            <tr><Td>TTL</Td><Td>30 วินาที</Td><Td>Lock หมดอายุอัตโนมัติถ้าไม่มี Heartbeat</Td></tr>
            <tr><Td>Heartbeat</Td><Td>ทุก 10 วินาที</Td><Td>ต่ออายุ Lock อัตโนมัติขณะ Form เปิดอยู่</Td></tr>
            <tr><Td>Release</Td><Td>ทันที</Td><Td>ปล่อย Lock เมื่อปิด Form</Td></tr>
          </tbody>
        </TableWrapper>

        <p className="text-sm text-gray-600 mt-3">เมื่อ Lock ถูกถือครองอยู่ จะแสดง <strong>Banner สีเหลือง</strong> ด้านบนหน้า:</p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 my-3 text-sm text-amber-800 font-medium">
          ⚠️ [ชื่อผู้ใช้] is currently editing this section. Please wait before making changes.
        </div>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 11: Status Code */}
        {/* ════════════════════════════════════════ */}
        <SectionTitle id="statuscode"><Tag size={18} className="text-pink-500" /> Status Code ของเอกสาร</SectionTitle>

        <p className="text-sm text-gray-600 mb-4">ใช้เมื่อ Transmittal มี Purpose = <Badge color="bg-purple-100 text-purple-700">For Approval</Badge> หรือ <Badge color="bg-blue-100 text-blue-700">For Action</Badge></p>

        <TableWrapper>
          <thead><tr><Th>Code</Th><Th>ชื่อ</Th><Th>ความหมาย</Th><Th>ผลต่อ Document</Th></tr></thead>
          <tbody>
            <tr>
              <Td><Badge color="bg-green-100 text-green-700 text-base font-bold">A</Badge></Td>
              <Td>Approved</Td><Td>อนุมัติ</Td><Td>status → Approved</Td>
            </tr>
            <tr>
              <Td><Badge color="bg-teal-100 text-teal-700 text-base font-bold">B</Badge></Td>
              <Td>Approved as Noted</Td><Td>อนุมัติตามหมายเหตุ</Td><Td>status → Approved as Noted</Td>
            </tr>
            <tr>
              <Td><Badge color="bg-red-100 text-red-700 text-base font-bold">C</Badge></Td>
              <Td>Revise and Resubmit</Td><Td>แก้ไขและส่งใหม่</Td><Td>สร้าง Revision ใหม่อัตโนมัติ</Td>
            </tr>
            <tr>
              <Td><Badge color="bg-red-200 text-red-800 text-base font-bold">D</Badge></Td>
              <Td>Rejected</Td><Td>ปฏิเสธ</Td><Td>status → Rejected</Td>
            </tr>
          </tbody>
        </TableWrapper>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 12: Workflow */}
        {/* ════════════════════════════════════════ */}
        <SectionTitle id="workflow"><GitBranch size={18} className="text-blue-500" /> Workflow ภาพรวมการทำงานทั้งระบบ</SectionTitle>

        <SubTitle>Workflow หลัก: For Approval</SubTitle>
        <CodeBlock>{`[STEP 1] Engineer สร้าง Document
         Document Register → Add Document
         ─ documentNo: STR-SD-001, revision: Rev.00, status: Draft
         ─ อัพโหลดไฟล์ PDF

[STEP 2] Engineer สร้าง Transmittal Out (ส่งเอกสารไปให้ Client)
         ─ purpose: "For Approval", status: Submitted
         ─ แนบไฟล์เดียวกับ Document

[STEP 3] Client ส่ง Reply กลับมา
         Transmittal In → New Transmittal In
         ─ แนบไฟล์ Reply จาก Client

[STEP 4] Admin/Manager อัพเดทสถานะเอกสาร
         ─ statusCode: A / B / C / D + reviewComment

[STEP 5A] Code A หรือ B → อนุมัติ → จบ Workflow
          ─ Document status → Approved / Approved as Noted
          ─ Transmittal status → Closed

[STEP 5C] Code C → ต้องแก้ไข → วนซ้ำ
          ─ ระบบสร้าง Rev.01 อัตโนมัติ
          ─ Engineer แก้ไขและส่งใหม่ (กลับ STEP 2)

[STEP 5D] Code D → ปฏิเสธ → จบ
          ─ Document status → Rejected`}</CodeBlock>

        <SubTitle>Real-time Collaboration</SubTitle>
        <p className="text-sm text-gray-600">ระบบรองรับผู้ใช้หลายคนทำงานพร้อมกัน — ข้อมูลทุกอย่างอัพเดท Real-time ผ่าน Firestore <code>onSnapshot</code> โดยไม่ต้อง Refresh</p>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 13: Troubleshoot */}
        {/* ════════════════════════════════════════ */}
        <SectionTitle id="troubleshoot"><AlertCircle size={18} className="text-red-500" /> การแก้ปัญหาเบื้องต้น</SectionTitle>

        <TableWrapper>
          <thead><tr><Th>ปัญหา</Th><Th>วิธีแก้</Th></tr></thead>
          <tbody>
            <tr><Td>ข้อมูลไม่แสดง / ตารางว่างเปล่า</Td><Td>ตรวจสอบ Internet Connection และ Refresh หน้า</Td></tr>
            <tr><Td>Login ไม่ได้ (Pending)</Td><Td>ติดต่อ MasterAdmin เพื่อ Approve Account</Td></tr>
            <tr><Td>Login ไม่ได้ (Disabled)</Td><Td>ติดต่อ MasterAdmin เพื่อ Re-enable Account</Td></tr>
            <tr><Td>บันทึกไม่ได้ — Lock</Td><Td>รอให้ผู้ใช้อื่นปิด Form หรือรอ 30 วินาที Lock หมดอายุ</Td></tr>
            <tr><Td>ไม่เห็นโครงการ</Td><Td>ติดต่อ MasterAdmin เพื่อกำหนด Assigned Projects</Td></tr>
            <tr><Td>Google Popup ถูก Block</Td><Td>อนุญาต Popup ใน Browser Settings</Td></tr>
            <tr><Td>ไฟล์แนบไม่อัพโหลด</Td><Td>ตรวจสอบขนาดไฟล์ (สูงสุด 50 MB ต่อไฟล์)</Td></tr>
          </tbody>
        </TableWrapper>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 14: Workflow โดยละเอียด */}
        {/* ════════════════════════════════════════ */}
        <SectionTitle id="workflow-detail"><ListChecks size={18} className="text-indigo-600" /> Workflow โดยละเอียด — ทุกกระบวนการ</SectionTitle>

        <InfoBox>
          <strong>สัญลักษณ์ Role:</strong>{' '}
          🔴 MasterAdmin &nbsp;|&nbsp; 🔵 Admin &nbsp;|&nbsp; 🟢 Manager &nbsp;|&nbsp; 🟡 Engineer &nbsp;|&nbsp; ⚪ Viewer (ดูได้อย่างเดียว)
        </InfoBox>

        <SubTitle>16.1 User Onboarding (เข้าร่วมระบบครั้งแรก)</SubTitle>
        <p className="text-sm text-gray-600 mb-2">ผู้เกี่ยวข้อง: ผู้ใช้ใหม่ + 🔴 MasterAdmin</p>
        <div className="space-y-2">
          <Step n={1}><strong>ผู้ใช้ใหม่</strong> — เปิด URL แล้ว Sign in ด้วย Google หรือ Email ระบบสร้าง User Document อัตโนมัติ: <code>status: &quot;pending&quot;, role: &quot;Viewer&quot;</code></Step>
          <Step n={2}><strong>ผู้ใช้ใหม่</strong> — เห็นหน้า &quot;Pending Approval&quot; ยังเข้าระบบไม่ได้</Step>
          <Step n={3}><strong>🔴 MasterAdmin</strong> — เห็น Badge สีส้มใน Sidebar → เข้า /users → เลือก Role → กำหนดโครงการ → กด <strong>Approve</strong></Step>
          <Step n={4}><strong>ระบบ</strong> — อัพเดท <code>status: &quot;active&quot;</code> ผู้ใช้ใหม่เข้าระบบได้ทันที (Real-time)</Step>
        </div>

        <SubTitle>16.2 สร้างโครงการใหม่ (Create Project)</SubTitle>
        <p className="text-sm text-gray-600 mb-2">ผู้เกี่ยวข้อง: 🔴🔵🟢</p>
        <div className="space-y-2">
          <Step n={1}><strong>🔴🔵🟢</strong> — เข้า Project Management → กรอก Project Name (บังคับ 3-100 ตัว) + Description → กด <strong>Create Project</strong></Step>
          <Step n={2}><strong>ระบบ</strong> — ตรวจ Edit Lock → บันทึก Firestore พร้อม <code>memberIds, roles, createdAt</code></Step>
          <Step n={3}><strong>ระบบ</strong> — Project ปรากฏในรายการและ Top Bar Selector ทันที</Step>
          <Step n={4}><strong>🔴 MasterAdmin</strong> — เข้า User Management กำหนดโครงการใหม่ให้ User ที่เกี่ยวข้อง</Step>
        </div>

        <SubTitle>16.3 รับเอกสาร (Transmittal In)</SubTitle>
        <p className="text-sm text-gray-600 mb-2">ผู้เกี่ยวข้อง: 🔵🟢🟡</p>
        <div className="space-y-2">
          <Step n={1}><strong>🔵🟢🟡</strong> — ได้รับเอกสารจากภายนอก → เข้า Transmittal In → กด &quot;+ New Transmittal&quot;</Step>
          <Step n={2}><strong>🔵🟢🟡</strong> — กรอก Transmittal No.*, Sender*, Subject*, Purpose, Status, Date แนบไฟล์ PDF</Step>
          <Step n={3}><strong>ระบบ</strong> — บันทึก <code>requiresReply = true</code> (For Approval/Action) → ปรากฏในตาราง Real-time → Dashboard &quot;Pending Reply&quot; เพิ่มขึ้น</Step>
          <Step n={4}><strong>🔵🟢</strong> — คลิก Link ไฟล์ดาวน์โหลด หรือกด ✉️ ส่ง Forward ทางอีเมล</Step>
        </div>

        <SubTitle>16.4 ส่งเอกสาร (Transmittal Out)</SubTitle>
        <p className="text-sm text-gray-600 mb-2">ผู้เกี่ยวข้อง: 🔵🟢🟡</p>
        <div className="space-y-2">
          <Step n={1}><strong>🟡🟢</strong> — เตรียมไฟล์ PDF → เข้า Transmittal Out → กด &quot;+ New Transmittal&quot;</Step>
          <Step n={2}><strong>🟡🟢</strong> — กรอก Transmittal No.*, Sender*, Recipient, Subject*, Purpose (For Approval/Action/Information/Record), Date แนบไฟล์</Step>
          <Step n={3}><strong>ระบบ</strong> — บันทึก <code>requiresReply = true</code> (For Approval/Action) → ปรากฏในตาราง Real-time</Step>
          <Step n={4}><strong>🟡🟢</strong> — กด ✉️ เพื่อ copy ข้อมูลส่งทางอีเมลพร้อม Link ไฟล์</Step>
        </div>

        <SubTitle>16.5 บันทึกเอกสาร (Add Document)</SubTitle>
        <p className="text-sm text-gray-600 mb-2">ผู้เกี่ยวข้อง: 🔵🟢🟡</p>
        <div className="space-y-2">
          <Step n={1}><strong>🟡 Engineer</strong> — เข้า Document Register → กด &quot;+ Add Document&quot;</Step>
          <Step n={2}><strong>🟡</strong> — กรอก Document No.*, Revision (Rev.00), Title*, Category, Status, Transmittal ID (ไม่บังคับ) แนบไฟล์</Step>
          <Step n={3}><strong>ระบบ</strong> — บันทึก <code>isLatest: true</code> → ปรากฏในตาราง Real-time → Dashboard &quot;Total Documents&quot; เพิ่มขึ้น</Step>
        </div>

        <SubTitle>16.6 ตรวจสอบและอนุมัติเอกสาร (Review &amp; Approve)</SubTitle>
        <p className="text-sm text-gray-600 mb-2">ผู้เกี่ยวข้อง: 🟡 Engineer → 🔵🟢 Admin/Manager → Client</p>
        <div className="space-y-2">
          <Step n={1}><strong>🟡 Engineer</strong> — บันทึก Document Rev.00 → สร้าง Transmittal Out, purpose: &quot;For Approval&quot; → แนบไฟล์ → ส่งให้ผู้ตรวจสอบ</Step>
          <Step n={2}><strong>Client/ผู้ตรวจสอบ</strong> — รับเอกสาร ตรวจสอบ ส่งคำตอบกลับพร้อม Status Code A/B/C/D</Step>
          <Step n={3}><strong>🔵🟢</strong> — สร้าง Transmittal In (บันทึก Reply) แนบไฟล์คำตอบ</Step>
          <Step n={4}><strong>🔵🟢</strong> — เปิด Document Register อัพเดท Status Code:</Step>
        </div>
        <TableWrapper>
          <thead><tr><Th>Code</Th><Th>ความหมาย</Th><Th>ผล</Th></tr></thead>
          <tbody>
            <tr><Td><span className="font-bold text-green-700">A</span></Td><Td>Approved</Td><Td>Document → Approved, Transmittal → Closed</Td></tr>
            <tr><Td><span className="font-bold text-teal-700">B</span></Td><Td>Approved as Noted</Td><Td>Document → Approved as Noted, Transmittal → Closed</Td></tr>
            <tr><Td><span className="font-bold text-red-700">C</span></Td><Td>Revise &amp; Resubmit</Td><Td>Rev.00 → Superseded, สร้าง Rev.01 ใหม่ วนกลับขั้นที่ 1</Td></tr>
            <tr><Td><span className="font-bold text-red-900">D</span></Td><Td>Rejected</Td><Td>Document → Rejected, จบ Workflow</Td></tr>
          </tbody>
        </TableWrapper>

        <SubTitle>16.7 แก้ไขและส่งเอกสารใหม่ (Revision Cycle — Code C)</SubTitle>
        <p className="text-sm text-gray-600 mb-2">ผู้เกี่ยวข้อง: 🔵🟢 Admin/Manager → 🟡 Engineer</p>
        <div className="space-y-2">
          <Step n={1}><strong>🔵🟢</strong> — รับ Code C → บันทึก Transmittal In → อัพเดท Document: <code>statusCode=&quot;C&quot;, status=&quot;Revise and Resubmit&quot;, isLatest=false</code></Step>
          <Step n={2}><strong>🔵🟢</strong> — สร้าง Document ใหม่: documentNo เดิม, revision=Rev.01, status=&quot;Submitted&quot;, isLatest=true</Step>
          <Step n={3}><strong>🟡 Engineer</strong> — แก้ไขเอกสารตาม Comment → อัพโหลดไฟล์ใหม่ (Rev.01)</Step>
          <Step n={4}><strong>🟡 Engineer</strong> — สร้าง Transmittal Out ใหม่ แนบ Rev.01 → วนกลับขั้นตอน 16.6</Step>
          <Step n={5}>ทำซ้ำจนได้ Code A หรือ B → <strong>Document Approved</strong></Step>
        </div>

        <SubTitle>16.8 ปิด Transmittal (Close)</SubTitle>
        <p className="text-sm text-gray-600 mb-2">ผู้เกี่ยวข้อง: 🔵🟢</p>
        <div className="space-y-2">
          <Step n={1}><strong>🔵🟢</strong> — เข้าตาราง Transmittal In/Out → ค้นหา Transmittal → อัพเดท Status เป็น &quot;Closed&quot;</Step>
          <Step n={2}><strong>ระบบ</strong> — Badge เปลี่ยนเป็น &quot;Closed&quot; (สีเขียว) → Dashboard &quot;Pending Reply&quot; ลดลง</Step>
        </div>
        <WarnBox>Transmittal จะหายจาก &quot;Pending Reply&quot; เมื่อ <code>requiresReply=true AND status=&quot;Closed&quot;</code></WarnBox>

        <SubTitle>16.9 แก้ไขโครงการ (Edit Project)</SubTitle>
        <p className="text-sm text-gray-600 mb-2">ผู้เกี่ยวข้อง: 🔴🔵🟢</p>
        <div className="space-y-2">
          <Step n={1}><strong>🔴🔵🟢</strong> — Hover บน Project Card → กดปุ่ม ✏️ (Pencil)</Step>
          <Step n={2}><strong>ระบบ</strong> — ฟอร์มเปลี่ยนเป็น &quot;Edit Project&quot; (สีส้ม) พร้อม pre-fill ข้อมูลเดิม</Step>
          <Step n={3}><strong>🔴🔵🟢</strong> — แก้ไข Name/Description → กด &quot;Save Changes&quot;</Step>
          <Step n={4}><strong>ระบบ</strong> — <code>updateDoc</code> → Card อัพเดททันที กด &quot;Cancel&quot; ได้ตลอดเวลาเพื่อยกเลิก</Step>
        </div>

        <SubTitle>16.10 ลบโครงการ (Delete Project)</SubTitle>
        <p className="text-sm text-gray-600 mb-2">ผู้เกี่ยวข้อง: 🔴🔵🟢</p>
        <div className="space-y-2">
          <Step n={1}><strong>🔴🔵🟢</strong> — Hover บน Project Card → กดปุ่ม 🗑️</Step>
          <Step n={2}><strong>ระบบ</strong> — แสดง Confirmation Dialog พร้อมคำเตือน</Step>
          <Step n={3}><strong>🔴🔵🟢</strong> — กด &quot;Delete&quot; ยืนยัน → <code>deleteDoc</code> → Project หายออกจากรายการทันที</Step>
        </div>
        <WarnBox>⚠️ การลบโครงการ <strong>ไม่ได้ลบ</strong> Transmittal และ Document ที่อยู่ในโครงการนั้น</WarnBox>

        <SubTitle>16.11 จัดการ User (Role / Disable / Project)</SubTitle>
        <p className="text-sm text-gray-600 mb-2">ผู้เกี่ยวข้อง: 🔴 MasterAdmin เท่านั้น</p>
        <div className="space-y-2">
          <Step n={1}><strong>เปลี่ยน Role</strong> — เลือก Dropdown Role ข้าง User → ระบบอัพเดท Firestore ทันที เมนู Sidebar ของ User เปลี่ยนทันที (Real-time)</Step>
          <Step n={2}><strong>Disable User</strong> — กด &quot;Disable&quot; → <code>status: &quot;disabled&quot;</code> User เข้าระบบไม่ได้ทันที</Step>
          <Step n={3}><strong>Re-enable User</strong> — กด &quot;Re-enable&quot; → <code>status: &quot;active&quot;</code> User เข้าระบบได้ทันที</Step>
          <Step n={4}><strong>กำหนดโครงการ</strong> — กด Dropdown &quot;Projects&quot; → ติ๊ก Checkbox → บันทึก <code>assignedProjectIds[]</code> ทันที (MasterAdmin/Admin เห็นทุกโครงการอัตโนมัติ)</Step>
        </div>

        <SubTitle>16.12 ตารางสรุป: ใครทำอะไรได้บ้าง</SubTitle>
        <TableWrapper>
          <thead>
            <tr>
              <Th>กระบวนการ</Th>
              <th className="px-4 py-2.5 bg-gray-50 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">🔴 MA</th>
              <th className="px-4 py-2.5 bg-gray-50 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">🔵 Admin</th>
              <th className="px-4 py-2.5 bg-gray-50 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">🟢 Mgr</th>
              <th className="px-4 py-2.5 bg-gray-50 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">🟡 Eng</th>
              <th className="px-4 py-2.5 bg-gray-50 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">⚪ Viewer</th>
            </tr>
          </thead>
          <tbody>
            <tr><Td>Sign in / Register</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td></tr>
            <tr><Td>ดู Dashboard</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td></tr>
            <tr><Td>สร้าง Transmittal In/Out</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td><Td center>❌</Td></tr>
            <tr><Td>ดู Transmittal In/Out</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td></tr>
            <tr><Td>บันทึก / ดู Document</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td><Td center>ดูเท่านั้น</Td></tr>
            <tr><Td>อัพเดทสถานะ Document</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td><Td center>❌</Td></tr>
            <tr><Td>สร้าง / แก้ไข / ลบโครงการ</Td><Td center>✅</Td><Td center>✅</Td><Td center>✅</Td><Td center>❌</Td><Td center>❌</Td></tr>
            <tr><Td>Approve / Disable / ลบ User</Td><Td center>✅</Td><Td center>❌</Td><Td center>❌</Td><Td center>❌</Td><Td center>❌</Td></tr>
            <tr><Td>เปลี่ยน Role / กำหนดโครงการ User</Td><Td center>✅</Td><Td center>❌</Td><Td center>❌</Td><Td center>❌</Td><Td center>❌</Td></tr>
            <tr><Td>เข้า Settings</Td><Td center>✅</Td><Td center>✅</Td><Td center>❌</Td><Td center>❌</Td><Td center>❌</Td></tr>
          </tbody>
        </TableWrapper>

        <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          คู่มือการใช้งาน CDMS v1.0.0 · © 2026 CMG Engineering
        </div>

      </div>
    </div>
  )
}
