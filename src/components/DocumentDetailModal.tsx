import { useState } from 'react'
import { X, Pencil, Trash2, Loader2, ExternalLink, Save } from 'lucide-react'
import FileUploadField from '@/components/FileUploadField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Document, DocumentCategory, DocumentStatus, StatusCode } from '@/types'

const CATEGORIES: DocumentCategory[] = ['Drawing', 'Specification', 'Material Approval', 'Method Statement', 'Report', 'Correspondence', 'Other']
const DOC_STATUSES: DocumentStatus[] = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Approved as Noted', 'Revise and Resubmit', 'Rejected']
const STATUS_CODES: { value: StatusCode; label: string }[] = [
  { value: 'A', label: 'A – Approved' },
  { value: 'B', label: 'B – Approved as Noted' },
  { value: 'C', label: 'C – Revise and Resubmit' },
  { value: 'D', label: 'D – Rejected' },
]

const STATUS_CODE_LABELS: Record<string, { label: string; cls: string }> = {
  A: { label: 'A – Approved', cls: 'bg-green-100 text-green-700' },
  B: { label: 'B – Approved as Noted', cls: 'bg-teal-100 text-teal-700' },
  C: { label: 'C – Revise & Resubmit', cls: 'bg-red-100 text-red-700' },
  D: { label: 'D – Rejected', cls: 'bg-red-200 text-red-800' },
}
const STATUS_COLORS: Record<string, string> = {
  'Approved': 'bg-green-100 text-green-700',
  'Approved as Noted': 'bg-teal-100 text-teal-700',
  'Under Review': 'bg-yellow-100 text-yellow-800',
  'Revise and Resubmit': 'bg-red-100 text-red-700',
  'Submitted': 'bg-blue-100 text-blue-800',
  'Draft': 'bg-gray-100 text-gray-600',
  'Superseded': 'bg-gray-100 text-gray-400',
  'Rejected': 'bg-red-100 text-red-700',
}
const CATEGORY_COLORS: Record<string, string> = {
  'Drawing': 'bg-indigo-100 text-indigo-700',
  'Specification': 'bg-violet-100 text-violet-700',
  'Material Approval': 'bg-pink-100 text-pink-700',
  'Method Statement': 'bg-cyan-100 text-cyan-700',
  'Report': 'bg-amber-100 text-amber-700',
  'Correspondence': 'bg-orange-100 text-orange-700',
  'Other': 'bg-gray-100 text-gray-600',
}

interface Props {
  document: Document & { fileUrls?: string[] }
  canEditDelete: boolean
  projectId: string
  currentUserUid: string
  onClose: () => void
  onDeleted: () => void
}

export default function DocumentDetailModal({
  document: d,
  canEditDelete,
  projectId,
  currentUserUid,
  onClose,
  onDeleted,
}: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fileUrls: string[] = d.fileUrls ?? (d.fileUrl ? [d.fileUrl] : [])

  const [form, setForm] = useState({
    documentNo: d.documentNo,
    title: d.title,
    revision: d.revision,
    category: d.category,
    status: d.status,
    statusCode: d.statusCode ?? '',
    reviewComment: d.reviewComment ?? '',
    transmittalId: d.transmittalId ?? '',
    fileUrls,
  })

  async function handleSave() {
    if (!form.documentNo.trim() || !form.title.trim()) {
      setSaveError('กรุณากรอก Document No. และ Title')
      return
    }
    setSaving(true); setSaveError(null)
    try {
      const [{ doc, updateDoc, Timestamp }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('@/services/firebase'),
      ])
      await updateDoc(doc(db, 'CMG-cdms-DocControl', 'root', 'documents', d.documentId), {
        documentNo: form.documentNo.trim(),
        title: form.title.trim(),
        revision: form.revision.trim() || 'Rev.00',
        category: form.category,
        status: form.status,
        statusCode: form.statusCode || null,
        reviewComment: form.reviewComment.trim(),
        transmittalId: form.transmittalId.trim(),
        fileUrls: form.fileUrls,
        updatedBy: currentUserUid,
        updatedAt: Timestamp.now(),
      })
      setMode('view')
    } catch (err) {
      console.error('Update document failed:', err)
      setSaveError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const [{ doc, deleteDoc }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('@/services/firebase'),
      ])
      await deleteDoc(doc(db, 'CMG-cdms-DocControl', 'root', 'documents', d.documentId))
      onDeleted()
    } catch (err) {
      console.error('Delete document failed:', err)
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-mono text-sm font-semibold text-blue-700">{d.documentNo}</span>
            <span className="font-mono text-xs text-gray-500">{d.revision}</span>
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[d.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {d.status}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {canEditDelete && mode === 'view' && (
              <>
                <button
                  onClick={() => setMode('edit')}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {mode === 'view' ? (
            <div className="space-y-3 text-sm">
              <Row label="Document No." value={d.documentNo} className="font-mono font-semibold text-blue-700" />
              <Row label="Title" value={d.title} className="font-medium text-gray-900" />
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-32 shrink-0">Category</span>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[d.category] ?? 'bg-gray-100'}`}>
                  {d.category}
                </span>
              </div>
              <Row label="Revision" value={d.revision} className="font-mono" />
              {d.statusCode && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-32 shrink-0">Status Code</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${STATUS_CODE_LABELS[d.statusCode]?.cls ?? 'bg-gray-100'}`}>
                    {STATUS_CODE_LABELS[d.statusCode]?.label ?? d.statusCode}
                  </span>
                </div>
              )}
              {d.reviewComment && <Row label="Review Comment" value={d.reviewComment} />}
              {d.transmittalId && <Row label="Transmittal ID" value={d.transmittalId} className="font-mono text-xs" />}
              <Row label="Updated" value={new Date(d.updatedAt.seconds * 1000).toLocaleDateString('en-GB')} />
              {!d.isLatest && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 text-xs">
                  ⚠️ Superseded — this is not the latest revision
                </div>
              )}
              {fileUrls.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 w-32 shrink-0 mt-0.5">Files</span>
                  <div className="flex flex-col gap-1">
                    {fileUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                        <ExternalLink size={12} /> File {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {saveError && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{saveError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Document No. <span className="text-red-500">*</span></label>
                  <Input value={form.documentNo} onChange={(e) => setForm((f) => ({ ...f, documentNo: e.target.value }))}
                    className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Revision</label>
                  <Input value={form.revision} onChange={(e) => setForm((f) => ({ ...f, revision: e.target.value }))}
                    className="h-9 text-sm font-mono" disabled={saving} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                  <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as DocumentCategory }))}
                    disabled={saving} className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DocumentStatus }))}
                    disabled={saving} className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {DOC_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Status Code</label>
                  <select value={form.statusCode} onChange={(e) => setForm((f) => ({ ...f, statusCode: e.target.value }))}
                    disabled={saving} className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— None —</option>
                    {STATUS_CODES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Transmittal ID</label>
                  <Input value={form.transmittalId} onChange={(e) => setForm((f) => ({ ...f, transmittalId: e.target.value }))}
                    className="h-9 text-sm" disabled={saving} placeholder="Optional" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-gray-700">Review Comment</label>
                  <Input value={form.reviewComment} onChange={(e) => setForm((f) => ({ ...f, reviewComment: e.target.value }))}
                    className="h-9 text-sm" disabled={saving} placeholder="Optional" />
                </div>
                <div className="col-span-2">
                  <FileUploadField
                    value={form.fileUrls}
                    onChange={(urls) => setForm((f) => ({ ...f, fileUrls: urls }))}
                    generatePath={() => `documents/${projectId}/${form.documentNo.trim() || 'edit'}_${form.revision.trim() || 'Rev00'}_${Date.now()}`}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 shrink-0 flex gap-2 justify-end">
          {mode === 'edit' ? (
            <>
              <Button variant="outline" size="sm" onClick={() => { setMode('view'); setSaveError(null) }} disabled={saving}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</> : <><Save size={14} className="mr-1.5" />Save</>}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Delete Document</h3>
                <p className="text-xs text-gray-500 mt-1">
                  ต้องการลบ <span className="font-semibold text-gray-800">{d.documentNo} {d.revision}</span> ใช่หรือไม่?
                </p>
                <p className="text-xs text-red-600 mt-1.5">⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={deleting}>
                {deleting ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Deleting…</> : <><Trash2 size={14} className="mr-1.5" />Delete</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, className }: { label: string; value?: string; className?: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-500 w-32 shrink-0">{label}</span>
      <span className={`text-gray-800 ${className ?? ''}`}>{value || '—'}</span>
    </div>
  )
}
