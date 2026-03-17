import { useState, useEffect } from 'react'
import { Plus, Search, Filter, X, Loader2, ExternalLink, Mail } from 'lucide-react'
import FileUploadField from '@/components/FileUploadField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProject } from '@/contexts/ProjectContext'
import { useAuth } from '@/contexts/AuthContext'
import NoProjectSelected from '@/components/NoProjectSelected'
import { useEditLock } from '@/hooks/useEditLock'
import EditLockBanner from '@/components/EditLockBanner'
import type { Document, DocumentCategory, DocumentStatus } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const CATEGORIES: DocumentCategory[] = ['Drawing', 'Specification', 'Material Approval', 'Method Statement', 'Report', 'Correspondence', 'Other']
const DOC_STATUSES: DocumentStatus[] = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Approved as Noted', 'Revise and Resubmit', 'Rejected']

const EMPTY_DOC_FORM = {
  documentNo: '', title: '', revision: 'Rev.00',
  category: 'Drawing' as DocumentCategory,
  status: 'Submitted' as DocumentStatus,
  transmittalId: '',
  fileUrls: [] as string[],
}

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

export default function DocumentRegisterPage() {
  const { selectedProject } = useProject()
  const { currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [showSuperseded, setShowSuperseded] = useState(false)
  const [allDocs, setAllDocs] = useState<Document[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [docForm, setDocForm] = useState({ ...EMPTY_DOC_FORM })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const lockPath = `CMG-cdms-DocControl/root/documents_${selectedProject?.projectId ?? 'none'}`
  const { acquireLock, releaseLock, forceReleaseLock, isLockedByOther, isLockedByMe, lockedByName } = useEditLock(lockPath)

  function openPanel() { forceReleaseLock(); setDocForm({ ...EMPTY_DOC_FORM }); setSaveError(null); setPanelOpen(true) }
  function closePanel() { setPanelOpen(false); releaseLock() }

  useEffect(() => {
    if (!selectedProject) return
    if (USE_MOCK) {
      import('@/data/mockData').then(({ mockDocuments }) => {
        setAllDocs(mockDocuments.filter((d) => d.projectId === selectedProject.projectId))
      })
      return
    }
    let unsub: (() => void) | undefined
    let cancelled = false
    Promise.all([import('firebase/firestore'), import('@/services/firebase')]).then(
      ([{ collection, query, where, onSnapshot }, { db }]) => {
        if (cancelled) return
        unsub = onSnapshot(
          query(
            collection(db, 'CMG-cdms-DocControl', 'root', 'documents'),
            where('projectId', '==', selectedProject.projectId)
          ),
          (snap) => setAllDocs(snap.docs.map((d) => ({ documentId: d.id, ...d.data() } as Document))),
          (err) => console.error('[Documents] onSnapshot error:', err.code, err.message)
        )
      }
    )
    return () => { cancelled = true; unsub?.() }
  }, [selectedProject])

  if (!selectedProject) return <NoProjectSelected />

  const data = allDocs
    .filter((d) => showSuperseded || d.isLatest)
    .filter((d) =>
      search === '' ||
      d.documentNo.toLowerCase().includes(search.toLowerCase()) ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (a.documentNo !== b.documentNo) return a.documentNo.localeCompare(b.documentNo)
      return b.updatedAt.seconds - a.updatedAt.seconds
    })

  const latestCount = allDocs.filter((d) => d.isLatest).length

  async function handleSave() {
    if (!currentUser || !selectedProject) return
    if (!docForm.documentNo.trim() || !docForm.title.trim()) {
      setSaveError('กรุณากรอก Document No. และ Title')
      return
    }
    setSaving(true); setSaveError(null)
    try {
      const [{ collection, addDoc, Timestamp }, { db }] = await Promise.all([
        import('firebase/firestore'), import('@/services/firebase'),
      ])
      const now = Timestamp.now()
      await addDoc(collection(db, 'CMG-cdms-DocControl', 'root', 'documents'), {
        projectId: selectedProject.projectId,
        transmittalId: docForm.transmittalId.trim(),
        documentNo: docForm.documentNo.trim(),
        title: docForm.title.trim(),
        category: docForm.category,
        revision: docForm.revision.trim() || 'Rev.00',
        fileUrls: docForm.fileUrls,
        status: docForm.status,
        isLatest: true,
        createdBy: currentUser.uid,
        createdAt: now,
        updatedBy: currentUser.uid,
        updatedAt: now,
      })
      closePanel()
    } catch (err) {
      console.error('Save document failed:', err)
      setSaveError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Register</h1>
          <p className="text-sm text-gray-500 mt-1">
            {latestCount} documents · <span className="font-medium text-gray-700">{selectedProject.name}</span>
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={openPanel}>
          <Plus size={16} />
          Add Document
        </Button>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by doc no., title, or category..."
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600"
              checked={showSuperseded}
              onChange={(e) => setShowSuperseded(e.target.checked)}
            />
            Show superseded
          </label>
          <Button variant="outline" className="h-9 gap-2 text-sm">
            <Filter size={14} />
            Filter
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-0 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {data.length} document{data.length !== 1 ? 's' : ''}
            {showSuperseded && ' (including superseded)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Document No.</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rev.</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">File</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-sm text-gray-400">
                      No documents found.
                    </td>
                  </tr>
                ) : (
                  data.map((d) => (
                    <tr
                      key={d.documentId}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        !d.isLatest ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="px-5 py-3 font-mono text-xs font-medium text-blue-700">{d.documentNo}</td>
                      <td className="px-5 py-3 text-gray-700 max-w-xs">
                        <div className="truncate">{d.title}</div>
                        {!d.isLatest && (
                          <div className="text-xs text-gray-400 mt-0.5">Superseded</div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[d.category] ?? 'bg-gray-100 text-gray-600'}`}>
                          {d.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-700">{d.revision}</td>
                      <td className="px-5 py-3">
                        {d.statusCode ? (
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${STATUS_CODE_LABELS[d.statusCode]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                            {d.statusCode}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[d.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(d.updatedAt.seconds * 1000).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-5 py-3">
                        {(() => {
                          const urls: string[] = (d as Document & { fileUrls?: string[] }).fileUrls
                            ?? (d.fileUrl ? [d.fileUrl] : [])
                          if (!urls.length) return <span className="text-gray-300 text-xs">—</span>
                          return (
                            <div className="flex flex-col gap-0.5">
                              {urls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                                  <ExternalLink size={11} />{i + 1}
                                </a>
                              ))}
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={`mailto:?subject=${encodeURIComponent(`[${d.documentNo}] ${d.title}`)}&body=${encodeURIComponent(`Document No.: ${d.documentNo}\nTitle: ${d.title}\nCategory: ${d.category}\nRevision: ${d.revision}\nStatus: ${d.status}\nUpdated: ${new Date(d.updatedAt.seconds * 1000).toLocaleDateString('en-GB')}`)}`}
                          title="Send email"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Mail size={14} />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Document slide-over panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={closePanel} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-base font-semibold text-gray-900">Add Document</h2>
              <button onClick={closePanel} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <EditLockBanner lockedByName={lockedByName} isLockedByMe={isLockedByMe} />
              {saveError && <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{saveError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Document No. <span className="text-red-500">*</span></label>
                  <Input value={docForm.documentNo} onChange={(e) => setDocForm((f) => ({ ...f, documentNo: e.target.value }))}
                    onFocus={() => !isLockedByOther && acquireLock()}
                    placeholder="STR-SD-001" className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Revision</label>
                  <Input value={docForm.revision} onChange={(e) => setDocForm((f) => ({ ...f, revision: e.target.value }))}
                    placeholder="Rev.00" className="h-9 text-sm font-mono" disabled={saving} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                  <Input value={docForm.title} onChange={(e) => setDocForm((f) => ({ ...f, title: e.target.value }))}
                    onFocus={() => !isLockedByOther && acquireLock()}
                    placeholder="Document title" className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <select value={docForm.category} onChange={(e) => setDocForm((f) => ({ ...f, category: e.target.value as DocumentCategory }))}
                    disabled={saving} className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select value={docForm.status} onChange={(e) => setDocForm((f) => ({ ...f, status: e.target.value as DocumentStatus }))}
                    disabled={saving} className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {DOC_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-gray-700">Transmittal ID <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                  <Input value={docForm.transmittalId} onChange={(e) => setDocForm((f) => ({ ...f, transmittalId: e.target.value }))}
                    placeholder="Link to transmittal" className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="col-span-2">
                  <FileUploadField
                    value={docForm.fileUrls}
                    onChange={(urls) => setDocForm((f) => ({ ...f, fileUrls: urls }))}
                    generatePath={() => `documents/${selectedProject.projectId}/${docForm.documentNo.trim() || 'new'}_${docForm.revision.trim() || 'Rev00'}_${Date.now()}`}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex gap-3 shrink-0">
              <Button variant="outline" className="flex-1" onClick={closePanel} disabled={saving}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 size={15} className="mr-2 animate-spin" />Saving…</> : 'Save Document'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
