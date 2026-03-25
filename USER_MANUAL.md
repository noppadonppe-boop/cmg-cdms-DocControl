# คู่มือการใช้งานระบบ CDMS
## Construction Document Control System

**เวอร์ชัน:** 1.0  
**ปรับปรุงล่าสุด:** มีนาคม 2026  
**URL ระบบ:** https://cmg-cdms-doccontrol.web.app

---

## สารบัญ

1. [ภาพรวมและหลักการของระบบ](#1-ภาพรวมและหลักการของระบบ)
2. [โครงสร้างระบบและเทคโนโลยี](#2-โครงสร้างระบบและเทคโนโลยี)
3. [โครงสร้างฐานข้อมูล](#3-โครงสร้างฐานข้อมูล)
4. [User Role และสิทธิ์การใช้งาน](#4-user-role-และสิทธิ์การใช้งาน)
5. [ขั้นตอนการเข้าสู่ระบบ (Login Workflow)](#5-ขั้นตอนการเข้าสู่ระบบ-login-workflow)
6. [หน้า Dashboard](#6-หน้า-dashboard)
7. [Transmittal In (รับเอกสาร)](#7-transmittal-in-รับเอกสาร)
8. [Transmittal Out (ส่งเอกสาร)](#8-transmittal-out-ส่งเอกสาร)
9. [Document Register (ทะเบียนเอกสาร)](#9-document-register-ทะเบียนเอกสาร)
10. [Project Management (จัดการโครงการ)](#10-project-management-จัดการโครงการ)
11. [User Management (จัดการผู้ใช้งาน)](#11-user-management-จัดการผู้ใช้งาน)
12. [Settings (ตั้งค่า)](#12-settings-ตั้งค่า)
13. [ระบบ Edit Lock (ป้องกันการแก้ไขซ้อน)](#13-ระบบ-edit-lock-ป้องกันการแก้ไขซ้อน)
14. [Status Code ของเอกสาร](#14-status-code-ของเอกสาร)
15. [Workflow ภาพรวมการทำงานทั้งระบบ](#15-workflow-ภาพรวมการทำงานทั้งระบบ)

---

## 1. ภาพรวมและหลักการของระบบ

### 1.1 วัตถุประสงค์
CDMS (Construction Document Control System) คือระบบควบคุมเอกสารสำหรับโครงการก่อสร้าง ออกแบบมาเพื่อ:

- **ติดตามการรับ-ส่งเอกสาร** ผ่าน Transmittal (ใบนำส่งเอกสาร)
- **ควบคุมเวอร์ชันเอกสาร** (Revision Control) โดยอัตโนมัติ
- **บันทึก Audit Trail** ทุกการเปลี่ยนแปลงสถานะเอกสาร
- **กำหนดสิทธิ์การเข้าถึง** ตาม User Role และโครงการ
- **รองรับหลายโครงการ** ในระบบเดียว

### 1.2 แนวคิดหลัก (Core Concepts)

| แนวคิด | คำอธิบาย |
|--------|-----------|
| **Transmittal** | ใบนำส่งเอกสาร คือ "ซอง" ที่ใช้ส่ง/รับเอกสาร มีเลขที่เฉพาะ เช่น `TR-IN-26-001` |
| **Document** | ไฟล์เอกสารจริง เช่น แบบ Drawing, Spec มีเลขที่และ Revision เช่น `STR-SD-001 Rev.00` |
| **Revision** | การแก้ไขเอกสาร แต่ละครั้งจะเพิ่ม Revision (Rev.00 → Rev.01 → Rev.02) |
| **Status Code** | รหัสผลการตรวจสอบ A/B/C/D ใช้เมื่อต้องการ Reply กลับ |
| **Project** | หน่วยหลักของระบบ — ข้อมูลทุกอย่างแยกตามโครงการ |

### 1.3 ประเภทของ Transmittal Purpose

| Purpose | ความหมาย | ต้อง Reply | ต้อง Status Code |
|---------|-----------|-----------|-----------------|
| **For Approval** | ส่งเพื่อขออนุมัติ | ✅ ใช่ | ✅ ใช่ |
| **For Action** | ส่งเพื่อขอดำเนินการ | ✅ ใช่ | ✅ ใช่ |
| **For Information** | ส่งเพื่อทราบ | ❌ ไม่ | ❌ ไม่ |
| **For Record** | ส่งเพื่อเก็บบันทึก | ❌ ไม่ | ❌ ไม่ |

---

## 2. โครงสร้างระบบและเทคโนโลยี

### 2.1 Tech Stack

```
Frontend:   React 18 + Vite + TypeScript
Styling:    Tailwind CSS + shadcn/ui
Backend:    Firebase (Auth + Firestore + Storage)
Hosting:    Firebase Hosting
Architecture: SPA (Single Page Application)
```

### 2.2 โครงสร้างหน้าจอ

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (ซ้าย)          │  Main Content (ขวา)      │
│  ┌─────────────────────┐ │  ┌────────────────────┐  │
│  │  Logo + Project     │ │  │  Page Header       │  │
│  │  Selector           │ │  ├────────────────────┤  │
│  ├─────────────────────┤ │  │                    │  │
│  │  Navigation Menu    │ │  │  Page Content      │  │
│  │  - Dashboard        │ │  │  (Table / Form)    │  │
│  │  - Transmittal In   │ │  │                    │  │
│  │  - Transmittal Out  │ │  └────────────────────┘  │
│  │  - Documents        │ │                          │
│  │  - Projects         │ │                          │
│  │  - Settings         │ │                          │
│  │  - Users (Admin)    │ │                          │
│  ├─────────────────────┤ │                          │
│  │  User Profile Card  │ │                          │
│  └─────────────────────┘ │                          │
└─────────────────────────────────────────────────────┘
```

### 2.3 Real-time Updates
ระบบใช้ **Firebase Firestore `onSnapshot`** — ข้อมูลอัพเดทแบบ Real-time ทันทีเมื่อมีการเปลี่ยนแปลง โดยไม่ต้อง Refresh หน้า

---

## 3. โครงสร้างฐานข้อมูล

ข้อมูลทั้งหมดเก็บใน Firestore ที่ path: `CMG-cdms-DocControl/root/{collection}`

### 3.1 Collection: `users`
```
uid              string   — Firebase Auth UID (= Document ID)
email            string   — อีเมล
displayName      string   — ชื่อแสดง
role             string   — MasterAdmin | Admin | Manager | Engineer | Viewer
isActive         boolean  — สถานะ Active
status           string   — active | pending | disabled
assignedProjectIds  string[]  — รหัสโครงการที่ได้รับสิทธิ์
photoURL         string?  — URL รูปโปรไฟล์
requestedAt      Timestamp? — วันที่ขอสมัคร
```

### 3.2 Collection: `projects`
```
projectId        string   — Firestore Auto-ID (= Document ID)
name             string   — ชื่อโครงการ
description      string?  — คำอธิบาย
memberIds        string[] — UID ของสมาชิก
roles            map      — {uid: role} per-project role
createdBy        string   — UID ผู้สร้าง
createdAt        Timestamp
```

### 3.3 Collection: `transmittals`
```
transmittalId    string   — Firestore Auto-ID
projectId        string   — รหัสโครงการ
type             string   — 'in' | 'out'
transmittalNo    string   — เลขที่ Transmittal เช่น TR-IN-26-001
sender           string   — ผู้ส่ง
recipient        string   — ผู้รับ
date             Timestamp — วันที่บนใบนำส่ง
subject          string   — หัวเรื่อง
purpose          string   — For Approval | For Action | For Information | For Record
requiresReply    boolean  — ต้องการ Reply (true = For Approval/Action)
replyTransmittalId string? — เชื่อมกับ Transmittal ที่ Reply กลับ
status           string   — Draft | Submitted | Under Review | Closed
fileUrls         string[] — URL ไฟล์แนบ
createdBy        string   — UID ผู้สร้าง
createdAt        Timestamp
```

### 3.4 Collection: `documents`
```
documentId       string   — Firestore Auto-ID
projectId        string   — รหัสโครงการ
transmittalId    string   — เชื่อมกับ Transmittal ที่แนบมา
documentNo       string   — เลขที่เอกสาร เช่น STR-SD-001
title            string   — ชื่อเอกสาร
category         string   — Drawing | Specification | Material Approval |
                            Method Statement | Report | Correspondence | Other
revision         string   — Rev.00, Rev.01, Rev.02, ...
fileUrl          string   — Firebase Storage URL
status           string   — Draft | Submitted | Under Review | Approved |
                            Approved as Noted | Revise and Resubmit | Rejected | Superseded
isLatest         boolean  — true = Revision ปัจจุบัน, false = ถูกแทนที่แล้ว
statusCode       string?  — A | B | C | D (ผลการตรวจสอบ)
reviewComment    string?  — ความคิดเห็นจาก Reviewer
createdBy        string   — UID ผู้สร้าง
createdAt        Timestamp
updatedBy        string   — UID ผู้แก้ไขล่าสุด
updatedAt        Timestamp
```

### 3.5 Collection: `document_history` (Audit Log)
```
logId            string   — Firestore Auto-ID
projectId        string   — รหัสโครงการ
documentId       string   — รหัสเอกสาร
documentNo       string   — เลขที่เอกสาร
action           string   — Created | Submitted | Reviewed | Status Updated |
                            Revision Created | File Replaced
performedBy      string   — UID ผู้ดำเนินการ
performedByName  string   — ชื่อผู้ดำเนินการ
timestamp        Timestamp
comment          string?  — หมายเหตุ
previousStatus   string?  — สถานะก่อนหน้า
newStatus        string?  — สถานะใหม่
previousRevision string?  — Revision ก่อนหน้า
newRevision      string?  — Revision ใหม่
```

---

## 4. User Role และสิทธิ์การใช้งาน

### 4.1 ตารางสิทธิ์ตาม Role

| Module / เมนู | MasterAdmin | Admin | Manager | Engineer | Viewer |
|---------------|:-----------:|:-----:|:-------:|:--------:|:------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Transmittal In | ✅ | ✅ | ✅ | ✅ | ✅ |
| Transmittal Out | ✅ | ✅ | ✅ | ✅ | ✅ |
| Document Register | ✅ | ✅ | ✅ | ✅ | ✅ |
| Project Management | ✅ | ✅ | ✅ | ❌ | ❌ |
| Settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |

### 4.2 สิทธิ์การเขียนข้อมูล (Write Permissions)

| การดำเนินการ | MasterAdmin | Admin | Manager | Engineer | Viewer |
|-------------|:-----------:|:-----:|:-------:|:--------:|:------:|
| สร้าง Transmittal ใหม่ | ✅ | ✅ | ✅ | ✅ | ❌ |
| สร้าง Document ใหม่ | ✅ | ✅ | ✅ | ✅ | ❌ |
| แก้ไข/ลบ Transmittal | ✅ | ✅ | ❌ | ❌ | ❌ |
| แก้ไข/ลบ Document | ✅ | ✅ | ❌ | ❌ | ❌ |
| สร้างโครงการ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve/Disable User | ✅ | ❌ | ❌ | ❌ | ❌ |
| กำหนด Role ผู้ใช้ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 4.3 คำอธิบาย Role

**MasterAdmin**
- ผู้ดูแลระบบสูงสุด มีสิทธิ์ทุกอย่าง
- จัดการ User (Approve, Disable, เปลี่ยน Role, ลบ)
- กำหนดโครงการให้แต่ละ User

**Admin**
- ผู้ดูแลโครงการ มีสิทธิ์ทุกอย่างยกเว้น User Management
- แก้ไข/ลบ Transmittal และ Document ได้

**Manager**
- ผู้จัดการโครงการ สร้างข้อมูลได้ แต่ไม่สามารถลบหรือแก้ไขได้
- เข้าถึงเมนู Projects ได้

**Engineer**
- วิศวกร สร้าง Transmittal และ Document ได้
- ดูข้อมูลได้ทุกอย่าง ยกเว้น Projects และ Settings

**Viewer**
- ดูข้อมูลได้อย่างเดียว ไม่สามารถสร้างหรือแก้ไขได้

### 4.4 สถานะของ User Account

| สถานะ | ความหมาย | เข้าระบบได้ |
|-------|-----------|------------|
| **pending** | รอการอนุมัติจาก MasterAdmin | ❌ |
| **active** | ใช้งานได้ปกติ | ✅ |
| **disabled** | ถูกระงับการใช้งาน | ❌ |

---

## 5. ขั้นตอนการเข้าสู่ระบบ (Login Workflow)

### 5.1 การสมัครสมาชิก (Register)

ระบบ **ไม่มีหน้าสมัครสมาชิกแยกต่างหาก** — ผู้ใช้ใหม่ลงทะเบียนผ่าน Google Sign-In ครั้งแรก

```
[ผู้ใช้ใหม่]
    │
    ▼
กด "Continue with Google"
    │
    ▼
เลือก Google Account
    │
    ▼
ระบบสร้าง User Doc อัตโนมัติ
(role: Viewer, status: pending)
    │
    ▼
หน้าจอแสดง "Account Pending Approval"
    │
    ▼
MasterAdmin เห็นจำนวน Pending ใน Sidebar
    │
    ▼
MasterAdmin เข้าหน้า User Management → Approve
    │
    ▼
User เข้าระบบได้ (status: active)
```

### 5.2 การ Login ด้วย Email/Password

```
[ผู้ใช้]
    │
    ▼
กรอก Email + Password → กด Sign In
    │
    ▼
Firebase Authentication ตรวจสอบ Credentials
    │
    ├── ❌ ข้อมูลไม่ถูก → แสดง "Invalid email or password"
    │
    ▼
ดึง User Document จาก Firestore ตรวจสอบ status
    │
    ├── status = "pending"  → Sign Out + แสดง Warning สีส้ม
    ├── status = "disabled" → Sign Out + แสดง Error สีแดง
    │
    ▼
status = "active" → เข้าระบบสำเร็จ → Redirect to Dashboard
```

### 5.3 การ Login ด้วย Google

```
[ผู้ใช้]
    │
    ▼
กด "Continue with Google"
    │
    ▼
Firebase Google Popup
    │
    ▼
ตรวจสอบ status ใน Firestore (เหมือน Email Login)
    │
    ▼
ผ่าน → เข้าระบบ หรือ ไม่ผ่าน → Sign Out + แสดงข้อความ
```

### 5.4 การเลือกโครงการ (Project Selection)

หลังเข้าระบบ ผู้ใช้ต้องเลือกโครงการก่อนใช้งาน:

- **MasterAdmin / Admin** → เห็นทุกโครงการ
- **Manager / Engineer / Viewer** → เห็นเฉพาะโครงการที่ถูก MasterAdmin กำหนด `assignedProjectIds`
- หากยังไม่ได้กำหนด → เห็นตาม `memberIds` ของโครงการ

---

## 6. หน้า Dashboard

### 6.1 วัตถุประสงค์
แสดงภาพรวมสถานะของโครงการที่เลือกอยู่

### 6.2 ข้อมูลที่แสดง

**Summary Cards (4 การ์ด)**
| การ์ด | ข้อมูล |
|-------|--------|
| Transmittals In | จำนวน Transmittal ขาเข้าทั้งหมด |
| Transmittals Out | จำนวน Transmittal ขาออกทั้งหมด |
| Documents | จำนวนเอกสาร (Latest Revision) |
| Pending Reply | จำนวน Transmittal ที่รอ Reply (requiresReply = true, status ≠ Closed) |

**ตาราง Recent Transmittals**
- แสดง Transmittal ล่าสุด 10 รายการ (In + Out รวมกัน)
- เรียงตามวันที่ล่าสุดก่อน
- แสดง: เลขที่, วันที่, ประเภท (In/Out), Purpose, Status

### 6.3 Workflow

```
เลือกโครงการ (Sidebar)
    │
    ▼
Dashboard โหลดข้อมูลแบบ Real-time
    │
    ├── Transmittals In Count
    ├── Transmittals Out Count
    ├── Documents Count
    ├── Pending Reply Count
    └── Recent Transmittals Table
```

---

## 7. Transmittal In (รับเอกสาร)

### 7.1 วัตถุประสงค์
บันทึกและติดตามเอกสารที่ **รับเข้า** จากภายนอก (จากผู้รับเหมา, ลูกค้า, ที่ปรึกษา)

### 7.2 Transmittal Status

| Status | ความหมาย |
|--------|-----------|
| **Draft** | ร่าง ยังไม่ส่ง |
| **Submitted** | ส่งแล้ว รอดำเนินการ |
| **Under Review** | อยู่ระหว่างการตรวจสอบ |
| **Closed** | ปิดแล้ว ดำเนินการเสร็จสิ้น |

### 7.3 Workflow การสร้าง Transmittal In ใหม่

```
[Engineer/Manager/Admin/MasterAdmin]
    │
    ▼
กดปุ่ม "+ New Transmittal In"
    │
    ▼
ระบบตรวจสอบ Edit Lock
    ├── มีคนอื่น Lock อยู่ → แสดง Banner แจ้งว่าใครกำลังแก้ไข
    └── ไม่มี Lock → เปิด Slide-over Panel
    │
    ▼
กรอกข้อมูล:
    ├── Transmittal No. * (บังคับ)
    ├── Sender *          (บังคับ)
    ├── Recipient
    ├── Subject *         (บังคับ)
    ├── Date
    ├── Purpose           (For Approval / For Action / For Information / For Record)
    ├── Status            (Draft / Submitted / Under Review / Closed)
    └── แนบไฟล์           (รองรับหลายไฟล์, อัพโหลดไปยัง Firebase Storage)
    │
    ▼
กด "Save"
    │
    ▼
ระบบบันทึกลง Firestore Collection: transmittals
(type: 'in', projectId: ปัจจุบัน)
    │
    ▼
ตารางอัพเดท Real-time ทันที
```

### 7.4 การกรองและค้นหา

- **Search Box**: ค้นหาตาม Transmittal No., Subject, Sender
- ข้อมูลเรียงตามวันที่ล่าสุดก่อน (orderBy date DESC)

### 7.5 Actions ในตาราง

| Action | ไอคอน | คำอธิบาย | สิทธิ์ |
|--------|-------|-----------|-------|
| เปิดไฟล์แนบ | 🔗 ExternalLink | เปิดไฟล์ใน Tab ใหม่ | ทุก Role |
| ส่ง Email | ✉️ Mail | เปิด Email Client (mailto) | ทุก Role |

### 7.6 ข้อกำหนดสำคัญ

- Transmittal ที่มี `requiresReply = true` (For Approval / For Action) → ต้องมีการ Reply ด้วย Transmittal Out
- `requiresReply` ถูกตั้งอัตโนมัติตาม Purpose ที่เลือก

---

## 8. Transmittal Out (ส่งเอกสาร)

### 8.1 วัตถุประสงค์
บันทึกและติดตามเอกสารที่ **ส่งออก** ไปยังภายนอก

### 8.2 Workflow การสร้าง Transmittal Out ใหม่

```
[Engineer/Manager/Admin/MasterAdmin]
    │
    ▼
กดปุ่ม "+ New Transmittal Out"
    │
    ▼
กรอกข้อมูล (เหมือน Transmittal In แต่ type = 'out'):
    ├── Transmittal No. * เช่น TR-OUT-26-001
    ├── Sender *
    ├── Recipient
    ├── Subject *
    ├── Date
    ├── Purpose
    ├── Status
    └── แนบไฟล์
    │
    ▼
บันทึกลง Firestore (type: 'out')
    │
    ▼
ตารางอัพเดท Real-time
```

### 8.3 ความแตกต่างจาก Transmittal In

| | Transmittal In | Transmittal Out |
|--|----------------|-----------------|
| ทิศทาง | รับเข้า | ส่งออก |
| Sender | ผู้ส่งจากภายนอก | ฝ่ายของเรา |
| Recipient | ฝ่ายของเรา | ผู้รับภายนอก |
| การ Reply | เป็น Reply ให้ Transmittal In | ส่ง Reply กลับไป |

---

## 9. Document Register (ทะเบียนเอกสาร)

### 9.1 วัตถุประสงค์
เป็น Master Register ของเอกสารทั้งหมดในโครงการ ติดตามสถานะและ Revision ของแต่ละเอกสาร

### 9.2 Document Category

| Category | ใช้สำหรับ |
|----------|-----------|
| **Drawing** | แบบก่อสร้าง |
| **Specification** | ข้อกำหนดเทคนิค |
| **Material Approval** | การขออนุมัติวัสดุ |
| **Method Statement** | วิธีการก่อสร้าง |
| **Report** | รายงาน |
| **Correspondence** | จดหมายโต้ตอบ |
| **Other** | อื่นๆ |

### 9.3 Document Status Flow

```
Draft → Submitted → Under Review → Approved
                                 → Approved as Noted
                                 → Revise and Resubmit → (สร้าง Revision ใหม่)
                                 → Rejected

เมื่อมี Revision ใหม่ → Rev.00 กลายเป็น Superseded
                      → Rev.01 กลายเป็น isLatest = true
```

### 9.4 Workflow การเพิ่มเอกสารใหม่

```
[Engineer/Manager/Admin/MasterAdmin]
    │
    ▼
กดปุ่ม "+ Add Document"
    │
    ▼
ตรวจสอบ Edit Lock
    │
    ▼
กรอกข้อมูล:
    ├── Document No. *    (บังคับ) เช่น STR-SD-001
    ├── Title *           (บังคับ)
    ├── Category          (Drawing, Spec, etc.)
    ├── Revision          (เริ่มต้น Rev.00)
    ├── Status            (Draft, Submitted, etc.)
    ├── Transmittal No.   (อ้างอิง Transmittal ที่แนบมาด้วย)
    └── อัพโหลดไฟล์       (รองรับหลายไฟล์)
    │
    ▼
บันทึกลง Firestore
    ├── isLatest: true
    ├── projectId: โครงการปัจจุบัน
    └── สร้าง document_history record (action: 'Created')
    │
    ▼
ตารางอัพเดท Real-time
```

### 9.5 Workflow Revision Control (สร้าง Revision ใหม่)

เกิดขึ้นเมื่อเอกสารได้รับ **Status Code C (Revise and Resubmit)**:

```
Document Rev.00 ได้รับ Code C
    │
    ▼
ระบบสร้าง Document ใหม่โดยอัตโนมัติ:
    ├── documentNo: เดิม (STR-SD-001)
    ├── revision: Rev.01
    ├── isLatest: true
    └── status: Submitted
    │
    ▼
Document Rev.00 ถูกอัพเดท:
    ├── isLatest: false
    └── status: Superseded
    │
    ▼
บันทึก document_history:
    ├── action: 'Revision Created'
    ├── previousRevision: Rev.00
    └── newRevision: Rev.01
```

### 9.6 การกรองและค้นหา

- **Search**: ค้นหาตาม Document No., Title, Category
- **Show Superseded Toggle**: แสดง/ซ่อนเอกสารที่ถูกแทนที่ (Superseded)
  - ค่าเริ่มต้น: ซ่อน Superseded (แสดงเฉพาะ `isLatest = true`)
- เรียงตาม Document No. → วันที่อัพเดทล่าสุด

### 9.7 Actions ในตาราง

| Action | ไอคอน | คำอธิบาย | สิทธิ์ |
|--------|-------|-----------|-------|
| เปิดไฟล์ | 🔗 ExternalLink | เปิดไฟล์ใน Tab ใหม่ | ทุก Role |
| ส่ง Email | ✉️ Mail | เปิด Email Client | ทุก Role |

### 9.8 Status Code และ Audit Trail

ทุกการเปลี่ยนแปลง Status ของเอกสารจะถูกบันทึกใน `document_history` collection อัตโนมัติ:

| Action | เกิดเมื่อ |
|--------|-----------|
| Created | สร้างเอกสารใหม่ |
| Submitted | เปลี่ยน Status → Submitted |
| Reviewed | ตรวจสอบและให้ Status Code |
| Status Updated | เปลี่ยน Status อื่นๆ |
| Revision Created | สร้าง Revision ใหม่ |
| File Replaced | อัพโหลดไฟล์ใหม่ทับ |

---

## 10. Project Management (จัดการโครงการ)

### 10.1 วัตถุประสงค์
สร้างและดูโครงการทั้งหมดในระบบ

### 10.2 สิทธิ์การเข้าถึง
**MasterAdmin, Admin, Manager** เท่านั้น

### 10.3 Workflow การสร้างโครงการ

```
[Manager/Admin/MasterAdmin]
    │
    ▼
กรอกข้อมูลโครงการ:
    ├── Project Name * (บังคับ, อย่างน้อย 3 ตัวอักษร, สูงสุด 100 ตัวอักษร)
    └── Description    (ไม่บังคับ, สูงสุด 500 ตัวอักษร)
    │
    ▼
ระบบตรวจสอบ Edit Lock
(ป้องกัน 2 คนสร้างโครงการพร้อมกัน)
    │
    ▼
กด "Create Project"
    │
    ▼
บันทึกลง Firestore:
    ├── name, description
    ├── memberIds: [currentUser.uid]  (ผู้สร้างเป็น Member อัตโนมัติ)
    ├── roles: {currentUser.uid: 'Admin'}
    └── createdBy, createdAt
    │
    ▼
แสดงข้อความ "Project created successfully!"
Project Selector ใน Sidebar อัพเดทอัตโนมัติ
```

### 10.4 การดูรายการโครงการ

หน้านี้แสดงโครงการทั้งหมดที่ผู้ใช้มีสิทธิ์เข้าถึง พร้อมข้อมูล:
- ชื่อโครงการ
- คำอธิบาย
- วันที่สร้าง
- จำนวนสมาชิก

### 10.5 Badge แสดงสถานะโครงการ: Active / Switch

แต่ละ Project Card จะแสดง Badge ฝั่งขวา 2 แถว:

| Badge | สี | ความหมาย |
|-------|----|-----------|
| **Active** | น้ำเงิน | โครงการที่ **กำลังใช้งานอยู่** ในขณะนี้ — ข้อมูลทุกหน้าแสดงตามโครงการนี้ |
| **Switch** | เทา | โครงการที่ **ยังไม่ได้เลือก** — กดเพื่อเปลี่ยนมาใช้โครงการนี้ |
| **Admin / Member** | ม่วง / เทา | Role ของผู้ใช้คนนี้ในโครงการนั้น |

**หลักการทำงาน:**
- ระบบอนุญาตให้มีโครงการ **Active ได้แค่ 1 โครงการ** ในเวลาเดียวกันเสมอ
- เมื่อกด Card ที่แสดง **Switch** → โครงการนั้นกลายเป็น **Active** ทันที
- โครงการเดิมที่ Active จะกลายเป็น **Switch** อัตโนมัติ
- การเปลี่ยน Active Project มีผลกับ **ทุกหน้าพร้อมกัน** (Dashboard, Transmittal In/Out, Document Register)

```
ตัวอย่าง:

ก่อน:  [PRJ-072 → Active]   [Riverside → Switch]   [CMG Tower → Switch]

กด Card "Riverside Mixed-Use"
    │
    ▼
หลัง:  [PRJ-072 → Switch]   [Riverside → Active]   [CMG Tower → Switch]

→ ทุกหน้าแสดงข้อมูลของ "Riverside Mixed-Use" ทันที
```

> 💡 **เลือกโครงการผ่าน Sidebar ก็ได้** — กด Dropdown ชื่อโครงการที่ Top Bar มุมซ้ายบน เพื่อเปลี่ยนโครงการจากทุกหน้า โดยไม่ต้องกลับมาที่ Project Management

### 10.6 Workflow แก้ไขโครงการ (Edit)

สำหรับ **MasterAdmin, Admin, Manager** เท่านั้น:

```
Hover บน Project Card → ปุ่ม ✏️ ปรากฏมุมขวา
    │
    ▼
กด ✏️ → Left panel เปลี่ยนเป็น "Edit Project" (สีส้ม)
         Form ถูก pre-fill ด้วยชื่อและคำอธิบายเดิม
    │
    ▼
แก้ไขข้อมูล → กด "Save Changes"
    │
    ├── สำเร็จ → แสดง "Project updated successfully!"
    │            Card ในรายการอัพเดทอัตโนมัติ
    └── กด "Cancel" → กลับเป็น Create mode โดยไม่บันทึก
```

### 10.7 Workflow ลบโครงการ (Delete)

สำหรับ **MasterAdmin, Admin, Manager** เท่านั้น:

```
Hover บน Project Card → กดปุ่ม 🗑️
    │
    ▼
Confirmation Dialog แสดงขึ้น:
"ต้องการลบโครงการ [ชื่อ] ใช่หรือไม่?"
    │
    ├── กด "Cancel" → ปิด Dialog ไม่มีการเปลี่ยนแปลง
    └── กด "Delete" → ลบโครงการออกจาก Firestore
```

> ⚠️ **ข้อควรระวัง:** การลบโครงการจะลบเฉพาะ Project Document  
> **ไม่ได้ลบ** Transmittal, Document, และ document_history ที่อยู่ในโครงการนั้น

---

## 11. User Management (จัดการผู้ใช้งาน)

### 11.1 วัตถุประสงค์
MasterAdmin บริหารจัดการ User ทั้งหมดในระบบ

### 11.2 สิทธิ์การเข้าถึง
**MasterAdmin เท่านั้น** (เมนู Users ใน Sidebar)

### 11.3 การเข้าถึง
- URL: `/users`
- Sidebar แสดง Badge สีแดง จำนวน User ที่ pending รออนุมัติ

### 11.4 ฟีเจอร์หลัก

**การกรองและค้นหา**
- Search: ค้นหาตามชื่อหรืออีเมล
- Filter: ทั้งหมด / Pending / Active / Disabled

**การจัดการแต่ละ User**

| Action | เงื่อนไข | ผลลัพธ์ |
|--------|---------|---------|
| **Approve** | User มี status = pending | status → active, isActive → true |
| **Disable** | User มี status = active | status → disabled, isActive → false |
| **Re-enable** | User มี status = disabled | status → active, isActive → true |
| **เปลี่ยน Role** | ทุก User | เปลี่ยน Role ได้ 5 ระดับ |
| **กำหนดโครงการ** | User ที่ไม่ใช่ Admin | เลือกโครงการที่ User เห็นได้ |
| **ลบ User** | ทุก User | ยืนยันก่อนลบ |

### 11.5 Workflow การ Approve User ใหม่

```
User ใหม่ Sign In ครั้งแรก
    │
    ▼
ระบบสร้าง User Doc อัตโนมัติ (status: pending)
    │
    ▼
MasterAdmin เห็น Badge จำนวน Pending ที่ Sidebar
    │
    ▼
MasterAdmin เข้าหน้า /users
    │
    ▼
กรอง "Pending" เพื่อดู User รออนุมัติ
    │
    ▼
เปลี่ยน Role ให้เหมาะสม (Viewer, Engineer, Manager, Admin)
    │
    ▼
กดปุ่ม "✓ Approve"
    │
    ▼
User ได้รับ status: active → เข้าระบบได้ทันที
```

### 11.6 Workflow การกำหนดโครงการให้ User

```
MasterAdmin เปิด Dropdown "Projects" ของ User
    │
    ▼
เลือก/ยกเลิก Checkbox ของโครงการ
    │
    ▼
ระบบบันทึก assignedProjectIds[] ลง User Doc ทันที
    │
    ▼
User เห็นเฉพาะโครงการที่ถูกกำหนดทันที (Real-time)
```

> **หมายเหตุ:** MasterAdmin และ Admin เห็นทุกโครงการอัตโนมัติ ไม่ต้องกำหนด

### 11.7 Workflow การลบ User

```
MasterAdmin กดปุ่ม 🗑️ ข้าง User
    │
    ▼
Dialog ยืนยัน: "Delete [ชื่อ User]?"
    │
    ├── กด Cancel → ยกเลิก
    └── กด Delete → ลบ User Doc จาก Firestore
```

> **ข้อควรระวัง:** การลบ User จะลบเฉพาะ User Document ใน Firestore  
> Firebase Auth account ยังคงอยู่ (ต้องลบแยกใน Firebase Console หากต้องการ)

---

## 12. Settings (ตั้งค่า)

### 12.1 สิทธิ์การเข้าถึง
**MasterAdmin และ Admin** เท่านั้น

### 12.2 ฟีเจอร์
- ตั้งค่าโปรไฟล์ผู้ใช้งาน (Display Name, รูปโปรไฟล์)
- การตั้งค่าระบบอื่นๆ

---

## 13. ระบบ Edit Lock (ป้องกันการแก้ไขซ้อน)

### 13.1 หลักการทำงาน
เมื่อผู้ใช้คนหนึ่งเปิด Form สร้างข้อมูล ระบบจะ **ล็อก** ไม่ให้ผู้ใช้คนอื่นเปิด Form พร้อมกัน

### 13.2 กลไก
- Lock เก็บใน Firestore พร้อม Timestamp
- **TTL (Time-to-Live): 30 วินาที** — Lock หมดอายุอัตโนมัติ
- **Heartbeat: ทุก 10 วินาที** — ต่ออายุ Lock อัตโนมัติขณะที่ Form เปิดอยู่
- เมื่อปิด Form → ปล่อย Lock ทันที

### 13.3 Lock แต่ละเมนู

| เมนู | Lock Path |
|------|-----------|
| Transmittal In | `transmittals_in_{projectId}` |
| Transmittal Out | `transmittals_out_{projectId}` |
| Document Register | `documents_{projectId}` |
| Project Management | `projects` (global) |

### 13.4 Edit Lock Banner
เมื่อผู้ใช้อื่น Lock อยู่ จะแสดง Banner สีเหลืองด้านบนหน้า:

```
⚠️  [ชื่อผู้ใช้] is currently editing this section.
     Please wait before making changes.
```

---

## 14. Status Code ของเอกสาร

ใช้เมื่อ Transmittal มี Purpose = "For Approval" หรือ "For Action"

| Code | ชื่อ | ความหมาย | ผลต่อ Document |
|------|------|-----------|---------------|
| **A** | Approved | อนุมัติ | status → Approved |
| **B** | Approved as Noted | อนุมัติตามหมายเหตุ | status → Approved as Noted |
| **C** | Revise and Resubmit | แก้ไขและส่งใหม่ | สร้าง Revision ใหม่อัตโนมัติ, Rev เดิม → Superseded |
| **D** | Rejected | ปฏิเสธ | status → Rejected |

### 14.1 Workflow เมื่อได้รับ Code C

```
เอกสาร STR-SD-001 Rev.00 ได้รับ Code C
    │
    ▼
ระบบอัพเดท Rev.00:
    ├── status: "Revise and Resubmit"
    └── isLatest: false → Superseded
    │
    ▼
ระบบสร้าง Rev.01:
    ├── documentNo: "STR-SD-001" (เดิม)
    ├── revision: "Rev.01"
    ├── status: "Submitted"
    └── isLatest: true
    │
    ▼
บันทึก document_history:
    ├── action: "Revision Created"
    ├── previousRevision: "Rev.00"
    └── newRevision: "Rev.01"
    │
    ▼
Engineer แนบไฟล์ใหม่ที่แก้ไขแล้วใน Rev.01
ส่ง Transmittal Out พร้อม Rev.01
```

---

## 15. Workflow ภาพรวมการทำงานทั้งระบบ

### 15.1 Workflow หลัก: การส่งเอกสารเพื่อขออนุมัติ (For Approval)

```
┌─────────────────────────────────────────────────────────────┐
│                    APPROVAL WORKFLOW                         │
└─────────────────────────────────────────────────────────────┘

[STEP 1] Engineer สร้าง Document
    └── Document Register → Add Document
        ├── documentNo: STR-SD-001
        ├── revision: Rev.00
        ├── status: Draft
        └── อัพโหลดไฟล์ PDF

[STEP 2] Engineer สร้าง Transmittal Out (ส่งเอกสารไปให้ Client)
    └── Transmittal Out → New Transmittal Out
        ├── purpose: "For Approval"
        ├── status: Submitted
        └── แนบไฟล์ (เดียวกับ Document)

[STEP 3] Client ส่ง Reply กลับมา
    └── Transmittal In → New Transmittal In
        ├── purpose: "For Action" หรือ "For Information"
        └── แนบไฟล์ Reply จาก Client

[STEP 4] Admin/Manager อัพเดทสถานะเอกสาร
    └── Document Register → อัพเดท Status
        ├── statusCode: A/B/C/D
        └── reviewComment: ความคิดเห็น

[STEP 5A] Code A/B → อนุมัติ → จบ Workflow
    └── Document status → Approved / Approved as Noted
        Transmittal status → Closed

[STEP 5C] Code C → ต้องแก้ไข → วนซ้ำ
    └── ระบบสร้าง Rev.01 อัตโนมัติ
        Engineer แก้ไขและส่งใหม่ (กลับ STEP 2)

[STEP 5D] Code D → ปฏิเสธ → จบ
    └── Document status → Rejected
```

### 15.2 Workflow การเพิ่มสมาชิกใหม่ในระบบ

```
[ผู้ใช้ใหม่]          [MasterAdmin]
     │                     │
     ▼                     │
Sign in ครั้งแรก           │
(Google / Email)           │
     │                     │
     ▼                     │
User Doc สร้างอัตโนมัติ    │
status: pending             │
     │                     ▼
     │           เห็น Badge Pending ใน Sidebar
     │                     │
     │                     ▼
     │           เข้าหน้า /users
     │                     │
     │                     ▼
     │           กำหนด Role ให้เหมาะสม
     │                     │
     │                     ▼
     │           กำหนดโครงการที่เข้าถึงได้
     │                     │
     │                     ▼
     │           กด Approve
     │                     │
     ▼                     │
เข้าระบบได้ทันที ◄──────────┘
(status: active)
```

### 15.3 Workflow การทำงานร่วมกัน (Collaboration)

ระบบรองรับผู้ใช้หลายคนทำงานพร้อมกัน:

```
User A: เปิด Transmittal In Form → ระบบ Lock
    │
    ├── User B พยายามเปิด Form เดียวกัน
    │   └── เห็น Banner: "User A is currently editing"
    │       → รอ หรือ MasterAdmin/Admin ใช้ Force Release Lock
    │
    └── User A บันทึกและปิด Form → ระบบปล่อย Lock
        └── User B เปิด Form ได้

ข้อมูลทุกอย่างอัพเดท Real-time:
    ├── User A บันทึก Transmittal In
    └── User B เห็นข้อมูลใหม่ทันทีโดยไม่ต้อง Refresh
```

---

## ภาคผนวก

### A. Naming Convention แนะนำ

| ประเภท | รูปแบบแนะนำ | ตัวอย่าง |
|--------|------------|---------|
| Transmittal In No. | TR-IN-YY-XXX | TR-IN-26-001 |
| Transmittal Out No. | TR-OUT-YY-XXX | TR-OUT-26-001 |
| Document No. (Drawing) | {Discipline}-{Type}-XXX | STR-DWG-001 |
| Document No. (Spec) | {Discipline}-SP-XXX | MEP-SP-001 |
| Document No. (Mat. Approval) | {Discipline}-MA-XXX | STR-MA-001 |

### B. Browser รองรับ

| Browser | รองรับ |
|---------|-------|
| Google Chrome (แนะนำ) | ✅ |
| Microsoft Edge | ✅ |
| Mozilla Firefox | ✅ |
| Safari | ✅ |

### C. ข้อจำกัดระบบ

- ขนาดไฟล์แนบสูงสุด: **50 MB ต่อไฟล์**
- รองรับ Internet Connection เท่านั้น (ไม่รองรับ Offline)
- ข้อมูลอัพเดท Real-time ต้องใช้การเชื่อมต่อ Internet ที่เสถียร

### D. การแก้ปัญหาเบื้องต้น

| ปัญหา | วิธีแก้ |
|-------|---------|
| ข้อมูลไม่แสดง | ตรวจสอบ Internet Connection, Refresh หน้า |
| Login ไม่ได้ (Pending) | ติดต่อ MasterAdmin เพื่อ Approve Account |
| Login ไม่ได้ (Disabled) | ติดต่อ MasterAdmin เพื่อ Re-enable |
| บันทึกไม่ได้ (Lock) | รอให้ผู้ใช้อื่นปิด Form หรือรอ 30 วินาที |
| ไม่เห็นโครงการ | ติดต่อ MasterAdmin เพื่อกำหนด assignedProjectIds |
| Popup Google ถูก Block | อนุญาต Popup ใน Browser Settings |

---

*เอกสารนี้จัดทำสำหรับ CMG Construction Document Control System*  
*สงวนลิขสิทธิ์ © 2026 CMG Engineering*
