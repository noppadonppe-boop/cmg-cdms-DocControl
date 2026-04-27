import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Filter, X, Loader2, Mail, Columns, GripVertical } from 'lucide-react'
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
import TransmittalDetailModal from '@/components/TransmittalDetailModal'
import type { Transmittal, TransmittalPurpose, TransmittalStatus } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

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

const EMPTY_FORM = {
  transmittalNo: '', sender: '', recipient: '', subject: '',
  purpose: 'For Information' as TransmittalPurpose,
  status: 'Submitted' as TransmittalStatus,
  date: new Date().toISOString().slice(0, 10),
  fileUrls: [] as string[],
}

export default function TransmittalInPage() {
  const { selectedProject } = useProject()
  const { currentUser } = useAuth()
  const { userProfile } = useUser()
  const [search, setSearch] = useState('')
  const [allData, setAllData] = useState<Transmittal[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<Transmittal | null>(null)

  const columnsMenuRef = useRef<HTMLDivElement>(null)
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false)
  const [columns, setColumns] = useState([
    { id: 'transmittalNo', label: 'Transmittal No.', visible: true },
    { id: 'sender', label: 'From', visible: true },
    { id: 'subject', label: 'Subject', visible: true },
    { id: 'purpose', label: 'Purpose', visible: true },
    { id: 'date', label: 'Date', visible: true },
    { id: 'requiresReply', label: 'Reply Req.', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'file', label: 'File', visible: true },
    { id: 'actions', label: '', visible: true },
  ])
  const [draggedColumnIdx, setDraggedColumnIdx] = useState<number | null>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(e.target as Node)) setColumnsMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const canEditDelete = userProfile?.role === 'MasterAdmin' || userProfile?.role === 'Admin' || userProfile?.role === 'SiteAdmin'

  const lockPath = `CMG-cdms-DocControl/root/transmittals_in_${selectedProject?.projectId ?? 'none'}`
  const { acquireLock, releaseLock, forceReleaseLock, isLockedByOther, isLockedByMe, lockedByName } = useEditLock(lockPath)

  function openPanel() { forceReleaseLock(); setForm({ ...EMPTY_FORM }); setSaveError(null); setPanelOpen(true) }
  function closePanel() { setPanelOpen(false); releaseLock() }

  useEffect(() => {
    if (!selectedProject) return
    if (USE_MOCK) {
      import('@/data/mockData').then(({ mockTransmittals }) => {
        setAllData(mockTransmittals.filter((t) => t.projectId === selectedProject.projectId && t.type === 'in'))
      })
      return
    }
    let unsub: (() => void) | undefined
    let cancelled = false
    Promise.all([import('firebase/firestore'), import('@/services/firebase')]).then(
      ([{ collection, query, where, orderBy, onSnapshot }, { db }]) => {
        if (cancelled) return
        unsub = onSnapshot(
          query(
            collection(db, 'CMG-cdms-DocControl', 'root', 'transmittals'),
            where('projectId', '==', selectedProject.projectId),
            where('type', '==', 'in'),
            orderBy('date', 'desc')
          ),
          (snap) => setAllData(snap.docs.map((d) => ({ transmittalId: d.id, ...d.data() } as Transmittal))),
          (err) => console.error('[TransmittalIn] onSnapshot error:', err.code, err.message)
        )
      }
    )
    return () => { cancelled = true; unsub?.() }
  }, [selectedProject])

  if (!selectedProject) return <NoProjectSelected />

  async function handleSave() {
    if (!currentUser || !selectedProject) return
    if (!form.transmittalNo.trim() || !form.sender.trim() || !form.subject.trim()) {
      setSaveError('กรุณากรอก Transmittal No., Sender และ Subject')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const [{ collection, addDoc, Timestamp }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('@/services/firebase'),
      ])
      await addDoc(collection(db, 'CMG-cdms-DocControl', 'root', 'transmittals'), {
        projectId: selectedProject.projectId,
        type: 'in',
        transmittalNo: form.transmittalNo.trim(),
        sender: form.sender.trim(),
        recipient: form.recipient.trim(),
        subject: form.subject.trim(),
        purpose: form.purpose,
        status: form.status,
        requiresReply: form.purpose === 'For Approval' || form.purpose === 'For Action',
        date: Timestamp.fromDate(new Date(form.date)),
        fileUrls: form.fileUrls,
        createdBy: currentUser.uid,
        createdAt: Timestamp.now(),
      })
      closePanel()
    } catch (err) {
      console.error('Save transmittal failed:', err)
      setSaveError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  const data = allData
    .filter((t) =>
      search === '' ||
      t.transmittalNo.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.sender.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div className="flex flex-col h-full gap-1.5">
      {/* Compact single-row toolbar */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <div className="flex items-baseline gap-2 shrink-0">
          <h1 className="text-base font-bold text-gray-900">Transmittal In</h1>
          <span className="text-xs text-gray-400">{allData.length} items · <span className="font-medium text-gray-600">{selectedProject.name}</span></span>
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by no., subject, sender..."
            className="pl-8 h-7 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
          New Transmittal
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
                      No transmittals found.
                    </td>
                  </tr>
                ) : (
                  data.map((t) => (
                    <tr
                      key={t.transmittalId}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer select-none"
                      onDoubleClick={() => setDetailItem(t)}
                      title="Double-click to view details"
                    >
                      {columns.filter(c => c.visible).map(col => {
                        switch (col.id) {
                          case 'transmittalNo': return <td key={col.id} className="px-3 py-0.5 font-mono font-medium text-blue-700 whitespace-nowrap">{t.transmittalNo}</td>
                          case 'sender': return <td key={col.id} className="px-3 py-0.5 text-gray-700 max-w-[160px] truncate">{t.sender}</td>
                          case 'subject': return <td key={col.id} className="px-3 py-0.5 text-gray-700 max-w-[240px] truncate">{t.subject}</td>
                          case 'purpose': return <td key={col.id} className="px-3 py-0.5"><span className={`inline-flex px-1.5 py-px rounded font-medium ${PURPOSE_COLORS[t.purpose] ?? 'bg-gray-100 text-gray-600'}`}>{t.purpose}</span></td>
                          case 'date': return <td key={col.id} className="px-3 py-0.5 text-gray-500 whitespace-nowrap">{new Date(t.date.seconds * 1000).toLocaleDateString('en-GB')}</td>
                          case 'requiresReply': return <td key={col.id} className="px-3 py-0.5"><span className={`inline-flex px-1.5 py-px rounded font-medium ${t.requiresReply ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>{t.requiresReply ? 'Yes' : 'No'}</span></td>
                          case 'status': return <td key={col.id} className="px-3 py-0.5"><span className={`inline-flex px-1.5 py-px rounded font-medium ${STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-600'}`}>{t.status}</span></td>
                          case 'file': {
                            const urls: string[] = (t as Transmittal & { fileUrls?: string[]; fileUrl?: string }).fileUrls ?? ((t as Transmittal & { fileUrls?: string[]; fileUrl?: string }).fileUrl ? [(t as Transmittal & { fileUrls?: string[]; fileUrl?: string }).fileUrl!] : [])
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
                              <a href={`mailto:?subject=${encodeURIComponent(`[${t.transmittalNo}] ${t.subject}`)}&body=${encodeURIComponent(`Transmittal No.: ${t.transmittalNo}\nFrom: ${t.sender}\nTo: ${t.recipient ?? ''}\nSubject: ${t.subject}\nPurpose: ${t.purpose}\nStatus: ${t.status}\nDate: ${new Date(t.date.seconds * 1000).toLocaleDateString('en-GB')}`)}`} title="Send email" className="inline-flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Mail size={12} /></a>
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
      {detailItem && (
        <TransmittalDetailModal
          transmittal={detailItem as Transmittal & { fileUrls?: string[] }}
          transmittalType="in"
          canEditDelete={canEditDelete}
          projectId={selectedProject.projectId}
          onClose={() => setDetailItem(null)}
          onDeleted={() => setDetailItem(null)}
        />
      )}

      {/* New Transmittal slide-over panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={closePanel} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-base font-semibold text-gray-900">New Transmittal In</h2>
              <button onClick={closePanel} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <EditLockBanner lockedByName={lockedByName} isLockedByMe={isLockedByMe} />
              {saveError && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{saveError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-gray-700">Transmittal No. <span className="text-red-500">*</span></label>
                  <Input value={form.transmittalNo} onChange={(e) => setForm((f) => ({ ...f, transmittalNo: e.target.value }))}
                    onFocus={() => !isLockedByOther && acquireLock()}
                    placeholder="TR-IN-26-001" className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Sender <span className="text-red-500">*</span></label>
                  <Input value={form.sender} onChange={(e) => setForm((f) => ({ ...f, sender: e.target.value }))}
                    onFocus={() => !isLockedByOther && acquireLock()}
                    placeholder="Company / Person" className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Recipient</label>
                  <Input value={form.recipient} onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value }))}
                    placeholder="To" className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-gray-700">Subject <span className="text-red-500">*</span></label>
                  <Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    onFocus={() => !isLockedByOther && acquireLock()}
                    placeholder="Brief description of content" className="h-9 text-sm" disabled={saving} />
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
                    generatePath={() => `transmittals/${selectedProject.projectId}/${form.transmittalNo.trim() || 'new'}_in_${Date.now()}`}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex gap-3 shrink-0">
              <Button variant="outline" className="flex-1" onClick={closePanel} disabled={saving}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 size={15} className="mr-2 animate-spin" />Saving…</> : 'Save Transmittal'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
