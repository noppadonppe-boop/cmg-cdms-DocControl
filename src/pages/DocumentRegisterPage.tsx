import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Filter, X, Loader2, Mail, ChevronDown, Trash2, Columns, GripVertical } from 'lucide-react'
import FileUploadField from '@/components/FileUploadField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useProject } from '@/contexts/ProjectContext'
import { useAuth } from '@/contexts/AuthContext'
import { useUser } from '@/contexts/UserContext'
import NoProjectSelected from '@/components/NoProjectSelected'
import { useEditLock } from '@/hooks/useEditLock'
import EditLockBanner from '@/components/EditLockBanner'
import DocumentDetailModal from '@/components/DocumentDetailModal'
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
  dwgType: '',
  detailStatus: '',
}

// โ”€โ”€ Firestore path helpers โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const DWG_TYPE_DOC   = (pid: string) => `CMG-cdms-DocControl/root/project_settings/${pid}`


const STATUS_CODE_LABELS: Record<string, { label: string; cls: string }> = {
  A: { label: 'A โ€“ Approved', cls: 'bg-green-100 text-green-700' },
  B: { label: 'B โ€“ Approved as Noted', cls: 'bg-teal-100 text-teal-700' },
  C: { label: 'C โ€“ Revise & Resubmit', cls: 'bg-red-100 text-red-700' },
  D: { label: 'D โ€“ Rejected', cls: 'bg-red-200 text-red-800' },
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
  const { userProfile } = useUser()
  const [search, setSearch] = useState('')
  const [showSuperseded, setShowSuperseded] = useState(false)
  const [allDocs, setAllDocs] = useState<Document[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [docForm, setDocForm] = useState({ ...EMPTY_DOC_FORM })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<Document | null>(null)

  // โ”€โ”€ Dynamic dropdown options (persisted per-project) โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
  const [dwgTypeOptions, setDwgTypeOptions] = useState<string[]>([])
  const [detailStatusOptions, setDetailStatusOptions] = useState<string[]>([])
  const [dwgTypeInput, setDwgTypeInput] = useState('')
  const [detailStatusInput, setDetailStatusInput] = useState('')
  const [dwgTypeOpen, setDwgTypeOpen] = useState(false)
  const [detailStatusOpen, setDetailStatusOpen] = useState(false)
  const dwgTypeRef = useRef<HTMLDivElement>(null)
  const detailStatusRef = useRef<HTMLDivElement>(null)
  const columnsMenuRef = useRef<HTMLDivElement>(null)
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false)
  const [columns, setColumns] = useState([
    { id: 'documentNo', label: 'Document No.', visible: true },
    { id: 'title', label: 'Title', visible: true },
    { id: 'category', label: 'Category', visible: true },
    { id: 'dwgType', label: 'DWG Type', visible: true },
    { id: 'detailStatus', label: 'Detail Status', visible: true },
    { id: 'revision', label: 'Rev.', visible: true },
    { id: 'statusCode', label: 'Code', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'updatedAt', label: 'Updated', visible: true },
    { id: 'file', label: 'File', visible: true },
    { id: 'actions', label: '', visible: true },
  ])
  const [draggedColumnIdx, setDraggedColumnIdx] = useState<number | null>(null)

  const canEditDelete = userProfile?.role === 'MasterAdmin' || userProfile?.role === 'Admin' || userProfile?.role === 'SiteAdmin'

  const lockPath = `CMG-cdms-DocControl/root/documents_${selectedProject?.projectId ?? 'none'}`
  const { acquireLock, releaseLock, forceReleaseLock, isLockedByOther, isLockedByMe, lockedByName } = useEditLock(lockPath)

  function openPanel() { forceReleaseLock(); setDocForm({ ...EMPTY_DOC_FORM }); setSaveError(null); setPanelOpen(true) }
  function closePanel() { setPanelOpen(false); setDwgTypeOpen(false); setDetailStatusOpen(false); releaseLock() }

  // โ”€โ”€ Load dynamic options from Firestore โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
  useEffect(() => {
    if (!selectedProject) return
    if (USE_MOCK) return
    let cancelled = false
    Promise.all([import('firebase/firestore'), import('@/services/firebase')]).then(
      ([{ doc, getDoc }, { db }]) => {
        if (cancelled) return
        getDoc(doc(db, DWG_TYPE_DOC(selectedProject.projectId))).then((snap) => {
          if (cancelled) return
          const data = snap.data()
          if (data?.dwgTypeOptions) setDwgTypeOptions(data.dwgTypeOptions)
          if (data?.detailStatusOptions) setDetailStatusOptions(data.detailStatusOptions)
        })
      }
    )
    return () => { cancelled = true }
  }, [selectedProject])

  // โ”€โ”€ Persist option lists โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
  async function saveOptions(dwgOpts: string[], detailOpts: string[]) {
    if (!selectedProject || USE_MOCK) return
    const [{ doc, setDoc }, { db }] = await Promise.all([
      import('firebase/firestore'), import('@/services/firebase'),
    ])
    await setDoc(doc(db, DWG_TYPE_DOC(selectedProject.projectId)), {
      dwgTypeOptions: dwgOpts,
      detailStatusOptions: detailOpts,
    }, { merge: true })
  }

  // โ”€โ”€ Add/remove helpers โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
  function addDwgType() {
    const v = dwgTypeInput.trim()
    if (!v || dwgTypeOptions.includes(v)) return
    const next = [...dwgTypeOptions, v]
    setDwgTypeOptions(next)
    setDwgTypeInput('')
    saveOptions(next, detailStatusOptions)
  }
  function removeDwgType(opt: string) {
    const next = dwgTypeOptions.filter((o) => o !== opt)
    setDwgTypeOptions(next)
    if (docForm.dwgType === opt) setDocForm((f) => ({ ...f, dwgType: '' }))
    saveOptions(next, detailStatusOptions)
  }
  function addDetailStatus() {
    const v = detailStatusInput.trim()
    if (!v || detailStatusOptions.includes(v)) return
    const next = [...detailStatusOptions, v]
    setDetailStatusOptions(next)
    setDetailStatusInput('')
    saveOptions(dwgTypeOptions, next)
  }
  function removeDetailStatus(opt: string) {
    const next = detailStatusOptions.filter((o) => o !== opt)
    setDetailStatusOptions(next)
    if (docForm.detailStatus === opt) setDocForm((f) => ({ ...f, detailStatus: '' }))
    saveOptions(dwgTypeOptions, next)
  }

  // โ”€โ”€ Close dropdowns on outside click โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(e.target as Node)) setColumnsMenuOpen(false)
      if (dwgTypeRef.current && !dwgTypeRef.current.contains(e.target as Node)) setDwgTypeOpen(false)
      if (detailStatusRef.current && !detailStatusRef.current.contains(e.target as Node)) setDetailStatusOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

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
      setSaveError('เธเธฃเธธเธ“เธฒเธเธฃเธญเธ Document No. เนเธฅเธฐ Title')
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
        dwgType: docForm.dwgType || '',
        detailStatus: docForm.detailStatus || '',
        isLatest: true,
        createdBy: currentUser.uid,
        createdAt: now,
        updatedBy: currentUser.uid,
        updatedAt: now,
      })
      closePanel()
    } catch (err) {
      console.error('Save document failed:', err)
      setSaveError('เธเธฑเธเธ—เธถเธเนเธกเนเธชเธณเน€เธฃเนเธ เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเน')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full gap-1.5">
      {/* Compact single-row toolbar */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <div className="flex items-baseline gap-2 shrink-0">
          <h1 className="text-base font-bold text-gray-900">Document Register</h1>
          <span className="text-xs text-gray-400">{latestCount} docs · <span className="font-medium text-gray-600">{selectedProject.name}</span></span>
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by doc no., title, or category..."
            className="pl-8 h-7 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5"
            checked={showSuperseded}
            onChange={(e) => setShowSuperseded(e.target.checked)}
          />
          Show superseded
        </label>
        <Button variant="outline" className="h-7 px-2.5 gap-1.5 text-xs">
          <Filter size={12} />
          Filter
        </Button>
        <div className="relative" ref={columnsMenuRef}>
          <Button variant="outline" className="h-7 px-2.5 gap-1.5 text-xs" onClick={() => setColumnsMenuOpen(!columnsMenuOpen)}>
            <Columns size={12} />
            Columns
          </Button>
          {columnsMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 shadow-xl rounded-md z-50 flex flex-col py-1">
              <div className="px-3 py-2 border-b border-gray-100 font-semibold text-xs text-gray-700">
                Manage Columns
              </div>
              <div className="max-h-64 overflow-y-auto p-1">
                {columns.map((col, idx) => (
                  <div
                    key={col.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggedColumnIdx(idx)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggedColumnIdx === null || draggedColumnIdx === idx) return
                      const next = [...columns]
                      const [moved] = next.splice(draggedColumnIdx, 1)
                      next.splice(idx, 0, moved)
                      setColumns(next)
                      setDraggedColumnIdx(null)
                    }}
                    className={`flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded text-xs cursor-move ${draggedColumnIdx === idx ? 'opacity-50 bg-gray-100' : ''}`}
                  >
                    <GripVertical size={12} className="text-gray-400" />
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={col.visible}
                      onChange={(e) => {
                        const next = [...columns]
                        next[idx].visible = e.target.checked
                        setColumns(next)
                      }}
                    />
                    <span className="flex-1 truncate select-none text-gray-700">{col.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button className="flex items-center gap-1.5 h-7 px-3 text-xs shrink-0" onClick={openPanel}>
          <Plus size={13} />
          Add Document
        </Button>
      </div>

      {/* Table */}
      <Card className="border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-200 bg-gray-50">
                  {columns.filter(c => c.visible).map(c => (
                    <th key={c.id} className="text-left px-3 py-1 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.filter(c => c.visible).length} className="px-3 py-6 text-center text-xs text-gray-400">
                      No documents found.
                    </td>
                  </tr>
                ) : (
                  data.map((d) => (
                    <tr
                      key={d.documentId}
                      className={`hover:bg-blue-50/40 transition-colors cursor-pointer select-none ${!d.isLatest ? 'opacity-50' : ''}`}
                      onDoubleClick={() => setDetailItem(d)}
                      title="Double-click to view details"
                    >
                      {columns.filter(c => c.visible).map(col => {
                        switch (col.id) {
                          case 'documentNo': return <td key={col.id} className="px-3 py-0.5 font-mono font-medium text-blue-700 whitespace-nowrap">{d.documentNo}</td>
                          case 'title': return (
                            <td key={col.id} className="px-3 py-0.5 text-gray-700 max-w-[240px]">
                              <div className="truncate">{d.title}</div>
                              {!d.isLatest && <div className="text-[10px] text-gray-400">Superseded</div>}
                            </td>
                          )
                          case 'category': return <td key={col.id} className="px-3 py-0.5"><span className={`inline-flex px-1.5 py-px rounded font-medium ${CATEGORY_COLORS[d.category] ?? 'bg-gray-100 text-gray-600'}`}>{d.category}</span></td>
                          case 'dwgType': return <td key={col.id} className="px-3 py-0.5">{d.dwgType ? <span className="inline-flex px-1.5 py-px rounded text-xs font-medium bg-purple-100 text-purple-700">{d.dwgType}</span> : <span className="text-gray-300">—</span>}</td>
                          case 'detailStatus': return <td key={col.id} className="px-3 py-0.5">{d.detailStatus ? <span className="inline-flex px-1.5 py-px rounded font-medium bg-emerald-100 text-emerald-700">{d.detailStatus}</span> : <span className="text-gray-300">—</span>}</td>
                          case 'revision': return <td key={col.id} className="px-3 py-0.5 font-mono text-gray-700 whitespace-nowrap">{d.revision}</td>
                          case 'statusCode': return <td key={col.id} className="px-3 py-0.5">{d.statusCode ? <span className={`inline-flex px-1.5 py-px rounded font-bold ${STATUS_CODE_LABELS[d.statusCode]?.cls ?? 'bg-gray-100 text-gray-600'}`}>{d.statusCode}</span> : <span className="text-gray-300">—</span>}</td>
                          case 'status': return <td key={col.id} className="px-3 py-0.5"><span className={`inline-flex px-1.5 py-px rounded font-medium ${STATUS_COLORS[d.status] ?? 'bg-gray-100 text-gray-600'}`}>{d.status}</span></td>
                          case 'updatedAt': return <td key={col.id} className="px-3 py-0.5 text-gray-500 whitespace-nowrap">{new Date(d.updatedAt.seconds * 1000).toLocaleDateString('en-GB')}</td>
                          case 'file': {
                            const urls: string[] = (d as Document & { fileUrls?: string[] }).fileUrls ?? (d.fileUrl ? [d.fileUrl] : [])
                            return (
                              <td key={col.id} className="px-3 py-0.5 text-center">
                                {urls.length > 0 ? (
                                  <span className="text-gray-600 font-medium">{urls.length}</span>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                            )
                          }
                          case 'actions': return (
                            <td key={col.id} className="px-3 py-0.5" onClick={(e) => e.stopPropagation()}>
                              <a href={`mailto:?subject=${encodeURIComponent(`[${d.documentNo}] ${d.title}`)}&body=${encodeURIComponent(`Document No.: ${d.documentNo}\nTitle: ${d.title}\nCategory: ${d.category}\nRevision: ${d.revision}\nStatus: ${d.status}\nUpdated: ${new Date(d.updatedAt.seconds * 1000).toLocaleDateString('en-GB')}`)}`} title="Send email" className="inline-flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Mail size={12} /></a>
                            </td>
                          )
                          default: return null;
                        }
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail / Edit / Delete Modal */}
      {detailItem && currentUser && (
        <DocumentDetailModal
          document={detailItem as Document & { fileUrls?: string[] }}
          canEditDelete={canEditDelete}
          projectId={selectedProject.projectId}
          currentUserUid={currentUser.uid}
          onClose={() => setDetailItem(null)}
          onDeleted={() => setDetailItem(null)}
        />
      )}

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
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">DWG Type</label>
                  <div ref={dwgTypeRef} className="relative">
                    <button type="button" disabled={saving} onClick={() => setDwgTypeOpen((v) => !v)}
                      className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 pr-8 bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between disabled:opacity-50">
                      <span className={docForm.dwgType ? 'text-gray-800' : 'text-gray-400'}>{docForm.dwgType || 'Select...'}</span>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    </button>
                    {dwgTypeOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                        {dwgTypeOptions.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No options yet. Add below.</p>}
                        {dwgTypeOptions.map((opt) => (
                          <div key={opt} className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 group">
                            <button type="button" onClick={() => { setDocForm((f) => ({ ...f, dwgType: opt })); setDwgTypeOpen(false) }}
                              className={['flex-1 text-left text-sm', docForm.dwgType === opt ? 'font-semibold text-blue-600' : 'text-gray-700'].join(' ')}>{opt}</button>
                            <button type="button" onClick={() => removeDwgType(opt)}
                              className="ml-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove option"><Trash2 size={12} /></button>
                          </div>
                        ))}
                        <div className="flex items-center gap-1 px-3 pt-2 pb-1 border-t border-gray-100 mt-1">
                          <input value={dwgTypeInput} onChange={(e) => setDwgTypeInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDwgType())}
                            placeholder="New option…" className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                          <button type="button" onClick={addDwgType} className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700" title="Add option"><Plus size={12} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Detail Status</label>
                  <div ref={detailStatusRef} className="relative">
                    <button type="button" disabled={saving} onClick={() => setDetailStatusOpen((v) => !v)}
                      className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 pr-8 bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between disabled:opacity-50">
                      <span className={docForm.detailStatus ? 'text-gray-800' : 'text-gray-400'}>{docForm.detailStatus || 'Select...'}</span>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    </button>
                    {detailStatusOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                        {detailStatusOptions.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No options yet. Add below.</p>}
                        {detailStatusOptions.map((opt) => (
                          <div key={opt} className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 group">
                            <button type="button" onClick={() => { setDocForm((f) => ({ ...f, detailStatus: opt })); setDetailStatusOpen(false) }}
                              className={['flex-1 text-left text-sm', docForm.detailStatus === opt ? 'font-semibold text-blue-600' : 'text-gray-700'].join(' ')}>{opt}</button>
                            <button type="button" onClick={() => removeDetailStatus(opt)}
                              className="ml-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove option"><Trash2 size={12} /></button>
                          </div>
                        ))}
                        <div className="flex items-center gap-1 px-3 pt-2 pb-1 border-t border-gray-100 mt-1">
                          <input value={detailStatusInput} onChange={(e) => setDetailStatusInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDetailStatus())}
                            placeholder="New option…" className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                          <button type="button" onClick={addDetailStatus} className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700" title="Add option"><Plus size={12} /></button>
                        </div>
                      </div>
                    )}
                  </div>
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
                {saving ? <><Loader2 size={15} className="mr-2 animate-spin" />Savingโ€ฆ</> : 'Save Document'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
