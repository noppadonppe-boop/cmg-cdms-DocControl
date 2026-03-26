import { useState } from 'react'
import { X, Pencil, Trash2, Loader2, ExternalLink, Save } from 'lucide-react'
import FileUploadField from '@/components/FileUploadField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Transmittal, TransmittalPurpose, TransmittalStatus } from '@/types'

const PURPOSE_COLORS: Record<string, string> = {
  'For Approval': 'bg-purple-100 text-purple-700',
  'For Action': 'bg-orange-100 text-orange-700',
  'For Information': 'bg-sky-100 text-sky-700',
  'For Record': 'bg-gray-100 text-gray-600',
}
const STATUS_COLORS: Record<string, string> = {
  'Under Review': 'bg-yellow-100 text-yellow-800',
  'Submitted': 'bg-blue-100 text-blue-800',
  'Closed': 'bg-green-100 text-green-800',
  'Draft': 'bg-gray-100 text-gray-600',
}

const PURPOSES: TransmittalPurpose[] = ['For Approval', 'For Action', 'For Information', 'For Record']
const STATUSES: TransmittalStatus[] = ['Draft', 'Submitted', 'Under Review', 'Closed']

interface Props {
  transmittal: Transmittal & { fileUrls?: string[] }
  transmittalType: 'in' | 'out'
  canEditDelete: boolean
  projectId: string
  onClose: () => void
  onDeleted: () => void
}

export default function TransmittalDetailModal({
  transmittal: t,
  transmittalType,
  canEditDelete,
  projectId,
  onClose,
  onDeleted,
}: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fileUrls: string[] = t.fileUrls ?? (
    (t as Transmittal & { fileUrl?: string }).fileUrl
      ? [(t as Transmittal & { fileUrl?: string }).fileUrl!]
      : []
  )

  const [form, setForm] = useState({
    transmittalNo: t.transmittalNo,
    sender: t.sender,
    recipient: t.recipient ?? '',
    subject: t.subject,
    purpose: t.purpose,
    status: t.status,
    date: new Date(t.date.seconds * 1000).toISOString().slice(0, 10),
    fileUrls,
  })

  async function handleSave() {
    if (!form.transmittalNo.trim() || !form.sender.trim() || !form.subject.trim()) {
      setSaveError('กรุณากรอก Transmittal No., Sender และ Subject')
      return
    }
    setSaving(true); setSaveError(null)
    try {
      const [{ doc, updateDoc, Timestamp }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('@/services/firebase'),
      ])
      await updateDoc(doc(db, 'CMG-cdms-DocControl', 'root', 'transmittals', t.transmittalId), {
        transmittalNo: form.transmittalNo.trim(),
        sender: form.sender.trim(),
        recipient: form.recipient.trim(),
        subject: form.subject.trim(),
        purpose: form.purpose,
        status: form.status,
        requiresReply: form.purpose === 'For Approval' || form.purpose === 'For Action',
        date: Timestamp.fromDate(new Date(form.date)),
        fileUrls: form.fileUrls,
      })
      setMode('view')
    } catch (err) {
      console.error('Update transmittal failed:', err)
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
      await deleteDoc(doc(db, 'CMG-cdms-DocControl', 'root', 'transmittals', t.transmittalId))
      onDeleted()
    } catch (err) {
      console.error('Delete transmittal failed:', err)
      setDeleting(false)
    }
  }

  const dateStr = new Date(t.date.seconds * 1000).toLocaleDateString('en-GB')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-sm font-semibold text-blue-700 truncate">{t.transmittalNo}</span>
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {t.status}
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
              <Row label={transmittalType === 'in' ? 'From' : 'Sender'} value={t.sender} />
              <Row label={transmittalType === 'in' ? 'Recipient' : 'To'} value={t.recipient} />
              <Row label="Subject" value={t.subject} className="font-medium text-gray-900" />
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-28 shrink-0">Purpose</span>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${PURPOSE_COLORS[t.purpose] ?? 'bg-gray-100'}`}>
                  {t.purpose}
                </span>
              </div>
              <Row label="Date" value={dateStr} />
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-28 shrink-0">Reply Required</span>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                  t.requiresReply ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {t.requiresReply ? 'Yes' : 'No'}
                </span>
              </div>
              {fileUrls.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 w-28 shrink-0 mt-0.5">Files</span>
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
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-gray-700">Transmittal No. <span className="text-red-500">*</span></label>
                  <Input value={form.transmittalNo} onChange={(e) => setForm((f) => ({ ...f, transmittalNo: e.target.value }))}
                    className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Sender <span className="text-red-500">*</span></label>
                  <Input value={form.sender} onChange={(e) => setForm((f) => ({ ...f, sender: e.target.value }))}
                    className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Recipient</label>
                  <Input value={form.recipient} onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value }))}
                    className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-gray-700">Subject <span className="text-red-500">*</span></label>
                  <Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Purpose</label>
                  <select value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value as TransmittalPurpose }))}
                    disabled={saving} className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TransmittalStatus }))}
                    disabled={saving} className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="col-span-2">
                  <FileUploadField
                    value={form.fileUrls}
                    onChange={(urls) => setForm((f) => ({ ...f, fileUrls: urls }))}
                    generatePath={() => `transmittals/${projectId}/${form.transmittalNo.trim() || 'edit'}_${transmittalType}_${Date.now()}`}
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
              <Button variant="outline" size="sm" onClick={() => { setMode('view'); setSaveError(null) }} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</> : <><Save size={14} className="mr-1.5" />Save</>}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          )}
        </div>
      </div>

      {/* Delete confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Delete Transmittal</h3>
                <p className="text-xs text-gray-500 mt-1">
                  ต้องการลบ <span className="font-semibold text-gray-800">{t.transmittalNo}</span> ใช่หรือไม่?
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
    <div className="flex items-center gap-2">
      <span className="text-gray-500 w-28 shrink-0">{label}</span>
      <span className={`text-gray-800 ${className ?? ''}`}>{value || '—'}</span>
    </div>
  )
}
