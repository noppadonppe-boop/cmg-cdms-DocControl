import { useEffect, useRef, useState } from 'react'
import { X, Pencil, Trash2, Loader2, ExternalLink, Save, ChevronDown, Plus } from 'lucide-react'
import FileUploadField from '@/components/FileUploadField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Document, DocumentCategory, DocumentStatus, StatusCode } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const PROJECT_SETTINGS_DOC = (projectId: string) => `CMG-cdms-DocControl/root/project_settings/${projectId}`

/** Extract a human-readable filename from a Firebase Storage URL */
function fileNameFromUrl(url: string): string {
  try {
    const decoded = decodeURIComponent(new URL(url).pathname)
    const raw = decoded.split('/').pop() ?? url
    // strip leading path segments before last '/'
    // Strip timestamp suffix added during upload: _1234567890
    return raw.replace(/_\d{10,}(\.[^.]+)$/, '$1').replace(/.*\//, '')
  } catch {
    return url
  }
}

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
  const [documentState, setDocumentState] = useState<Document & { fileUrls?: string[] }>(d)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [dwgTypeOptions, setDwgTypeOptions] = useState<string[]>([])
  const [detailStatusOptions, setDetailStatusOptions] = useState<string[]>([])
  const [dwgTypeInput, setDwgTypeInput] = useState('')
  const [detailStatusInput, setDetailStatusInput] = useState('')
  const [dwgTypeOpen, setDwgTypeOpen] = useState(false)
  const [detailStatusOpen, setDetailStatusOpen] = useState(false)
  const dwgTypeRef = useRef<HTMLDivElement>(null)
  const detailStatusRef = useRef<HTMLDivElement>(null)

  const fileUrls: string[] = documentState.fileUrls ?? (documentState.fileUrl ? [documentState.fileUrl] : [])

  const [form, setForm] = useState({
    documentNo: d.documentNo,
    title: d.title,
    revision: d.revision,
    category: d.category,
    status: d.status,
    statusCode: d.statusCode ?? '',
    reviewComment: d.reviewComment ?? '',
    transmittalId: d.transmittalId ?? '',
    dwgType: d.dwgType ?? '',
    detailStatus: d.detailStatus ?? '',
    fileUrls,
  })

  useEffect(() => {
    setDocumentState(d)
  }, [d])

  useEffect(() => {
    if (USE_MOCK) return
    let cancelled = false

    Promise.all([import('firebase/firestore'), import('@/services/firebase')]).then(
      async ([{ doc, getDoc }, { db }]) => {
        if (cancelled) return
        const snap = await getDoc(doc(db, PROJECT_SETTINGS_DOC(projectId)))
        if (cancelled) return
        const data = snap.data()
        setDwgTypeOptions(data?.dwgTypeOptions ?? [])
        setDetailStatusOptions(data?.detailStatusOptions ?? [])
      }
    )

    return () => { cancelled = true }
  }, [projectId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dwgTypeRef.current && !dwgTypeRef.current.contains(event.target as Node)) setDwgTypeOpen(false)
      if (detailStatusRef.current && !detailStatusRef.current.contains(event.target as Node)) setDetailStatusOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function saveOptions(nextDwgTypeOptions: string[], nextDetailStatusOptions: string[]) {
    if (USE_MOCK) return
    const [{ doc, setDoc }, { db }] = await Promise.all([
      import('firebase/firestore'),
      import('@/services/firebase'),
    ])
    await setDoc(doc(db, PROJECT_SETTINGS_DOC(projectId)), {
      dwgTypeOptions: nextDwgTypeOptions,
      detailStatusOptions: nextDetailStatusOptions,
    }, { merge: true })
  }

  function addDwgType() {
    const value = dwgTypeInput.trim()
    if (!value || dwgTypeOptions.includes(value)) return
    const next = [...dwgTypeOptions, value]
    setDwgTypeOptions(next)
    setDwgTypeInput('')
    setForm((prev) => ({ ...prev, dwgType: value }))
    void saveOptions(next, detailStatusOptions)
  }

  function removeDwgType(option: string) {
    const next = dwgTypeOptions.filter((item) => item !== option)
    setDwgTypeOptions(next)
    if (form.dwgType === option) setForm((prev) => ({ ...prev, dwgType: '' }))
    void saveOptions(next, detailStatusOptions)
  }

  function addDetailStatus() {
    const value = detailStatusInput.trim()
    if (!value || detailStatusOptions.includes(value)) return
    const next = [...detailStatusOptions, value]
    setDetailStatusOptions(next)
    setDetailStatusInput('')
    setForm((prev) => ({ ...prev, detailStatus: value }))
    void saveOptions(dwgTypeOptions, next)
  }

  function removeDetailStatus(option: string) {
    const next = detailStatusOptions.filter((item) => item !== option)
    setDetailStatusOptions(next)
    if (form.detailStatus === option) setForm((prev) => ({ ...prev, detailStatus: '' }))
    void saveOptions(dwgTypeOptions, next)
  }

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
      const updatedAt = Timestamp.now()
      await updateDoc(doc(db, 'CMG-cdms-DocControl', 'root', 'documents', d.documentId), {
        documentNo: form.documentNo.trim(),
        title: form.title.trim(),
        revision: form.revision.trim() || 'Rev.00',
        category: form.category,
        status: form.status,
        statusCode: form.statusCode || null,
        reviewComment: form.reviewComment.trim(),
        transmittalId: form.transmittalId.trim(),
        dwgType: form.dwgType.trim(),
        detailStatus: form.detailStatus.trim(),
        fileUrls: form.fileUrls,
        updatedBy: currentUserUid,
        updatedAt,
      })
      setDocumentState((prev) => ({
        ...prev,
        documentNo: form.documentNo.trim(),
        title: form.title.trim(),
        revision: form.revision.trim() || 'Rev.00',
        category: form.category,
        status: form.status,
        statusCode: form.statusCode ? form.statusCode as StatusCode : undefined,
        reviewComment: form.reviewComment.trim(),
        transmittalId: form.transmittalId.trim(),
        dwgType: form.dwgType.trim(),
        detailStatus: form.detailStatus.trim(),
        fileUrls: form.fileUrls,
        updatedBy: currentUserUid,
        updatedAt,
      }))
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
            <span className="font-mono text-sm font-semibold text-blue-700">{documentState.documentNo}</span>
            <span className="font-mono text-xs text-gray-500">{documentState.revision}</span>
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[documentState.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {documentState.status}
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
              <Row label="Document No." value={documentState.documentNo} className="font-mono font-semibold text-blue-700" />
              <Row label="Title" value={documentState.title} className="font-medium text-gray-900" />
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-32 shrink-0">Category</span>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[documentState.category] ?? 'bg-gray-100'}`}>
                  {documentState.category}
                </span>
              </div>
              <Row label="DWG Type" value={documentState.dwgType} />
              <Row label="Detail Status" value={documentState.detailStatus} />
              <Row label="Revision" value={documentState.revision} className="font-mono" />
              {documentState.statusCode && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-32 shrink-0">Status Code</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${STATUS_CODE_LABELS[documentState.statusCode]?.cls ?? 'bg-gray-100'}`}>
                    {STATUS_CODE_LABELS[documentState.statusCode]?.label ?? documentState.statusCode}
                  </span>
                </div>
              )}
              {documentState.reviewComment && <Row label="Review Comment" value={documentState.reviewComment} />}
              {documentState.transmittalId && <Row label="Transmittal ID" value={documentState.transmittalId} className="font-mono text-xs" />}
              <Row label="Updated" value={new Date(documentState.updatedAt.seconds * 1000).toLocaleDateString('en-GB')} />
              {!documentState.isLatest && (
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
                        title={url}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                        <ExternalLink size={12} />{fileNameFromUrl(url)}
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
                  <label className="text-sm font-medium text-gray-700">DWG Type</label>
                  <div ref={dwgTypeRef} className="relative">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setDwgTypeOpen((open) => !open)}
                      className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 pr-8 bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between disabled:opacity-50"
                    >
                      <span className={form.dwgType ? 'text-gray-800' : 'text-gray-400'}>{form.dwgType || 'Select...'}</span>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    </button>
                    {dwgTypeOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                        {dwgTypeOptions.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No options yet. Add below.</p>}
                        {dwgTypeOptions.map((option) => (
                          <div key={option} className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 group">
                            <button
                              type="button"
                              onClick={() => { setForm((prev) => ({ ...prev, dwgType: option })); setDwgTypeOpen(false) }}
                              className={['flex-1 text-left text-sm', form.dwgType === option ? 'font-semibold text-blue-600' : 'text-gray-700'].join(' ')}
                            >
                              {option}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeDwgType(option)}
                              className="ml-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove option"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-1 px-3 pt-2 pb-1 border-t border-gray-100 mt-1">
                          <input
                            value={dwgTypeInput}
                            onChange={(e) => setDwgTypeInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDwgType())}
                            placeholder="New option..."
                            className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <button type="button" onClick={addDwgType} className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700" title="Add option">
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Detail Status</label>
                  <div ref={detailStatusRef} className="relative">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setDetailStatusOpen((open) => !open)}
                      className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 pr-8 bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between disabled:opacity-50"
                    >
                      <span className={form.detailStatus ? 'text-gray-800' : 'text-gray-400'}>{form.detailStatus || 'Select...'}</span>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    </button>
                    {detailStatusOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                        {detailStatusOptions.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No options yet. Add below.</p>}
                        {detailStatusOptions.map((option) => (
                          <div key={option} className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 group">
                            <button
                              type="button"
                              onClick={() => { setForm((prev) => ({ ...prev, detailStatus: option })); setDetailStatusOpen(false) }}
                              className={['flex-1 text-left text-sm', form.detailStatus === option ? 'font-semibold text-emerald-600' : 'text-gray-700'].join(' ')}
                            >
                              {option}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeDetailStatus(option)}
                              className="ml-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove option"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-1 px-3 pt-2 pb-1 border-t border-gray-100 mt-1">
                          <input
                            value={detailStatusInput}
                            onChange={(e) => setDetailStatusInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDetailStatus())}
                            placeholder="New option..."
                            className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                          <button type="button" onClick={addDetailStatus} className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700" title="Add option">
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
