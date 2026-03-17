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
import type { Transmittal, TransmittalPurpose, TransmittalStatus } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const PURPOSES: TransmittalPurpose[] = ['For Approval', 'For Action', 'For Information', 'For Record']
const STATUSES: TransmittalStatus[] = ['Draft', 'Submitted', 'Under Review', 'Closed']

const EMPTY_FORM = {
  transmittalNo: '', sender: '', recipient: '', subject: '',
  purpose: 'For Information' as TransmittalPurpose,
  status: 'Submitted' as TransmittalStatus,
  date: new Date().toISOString().slice(0, 10),
  fileUrls: [] as string[],
}

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

export default function TransmittalOutPage() {
  const { selectedProject } = useProject()
  const { currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [allData, setAllData] = useState<Transmittal[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const lockPath = `CMG-cdms-DocControl/root/transmittals_out_${selectedProject?.projectId ?? 'none'}`
  const { acquireLock, releaseLock, forceReleaseLock, isLockedByOther, isLockedByMe, lockedByName } = useEditLock(lockPath)

  function openPanel() { forceReleaseLock(); setForm({ ...EMPTY_FORM }); setSaveError(null); setPanelOpen(true) }
  function closePanel() { setPanelOpen(false); releaseLock() }

  useEffect(() => {
    if (!selectedProject) return
    if (USE_MOCK) {
      import('@/data/mockData').then(({ mockTransmittals }) => {
        setAllData(mockTransmittals.filter((t) => t.projectId === selectedProject.projectId && t.type === 'out'))
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
            where('type', '==', 'out'),
            orderBy('date', 'desc')
          ),
          (snap) => setAllData(snap.docs.map((d) => ({ transmittalId: d.id, ...d.data() } as Transmittal))),
          (err) => console.error('[TransmittalOut] onSnapshot error:', err.code, err.message)
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
    setSaving(true); setSaveError(null)
    try {
      const [{ collection, addDoc, Timestamp }, { db }] = await Promise.all([
        import('firebase/firestore'), import('@/services/firebase'),
      ])
      await addDoc(collection(db, 'CMG-cdms-DocControl', 'root', 'transmittals'), {
        projectId: selectedProject.projectId, type: 'out',
        transmittalNo: form.transmittalNo.trim(), sender: form.sender.trim(),
        recipient: form.recipient.trim(), subject: form.subject.trim(),
        purpose: form.purpose, status: form.status,
        requiresReply: form.purpose === 'For Approval' || form.purpose === 'For Action',
        date: Timestamp.fromDate(new Date(form.date)),
        fileUrls: form.fileUrls,
        createdBy: currentUser.uid, createdAt: Timestamp.now(),
      })
      closePanel()
    } catch (err) {
      console.error('Save transmittal out failed:', err)
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
      t.recipient.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transmittal Out</h1>
          <p className="text-sm text-gray-500 mt-1">
            Outgoing transmittals · <span className="font-medium text-gray-700">{selectedProject.name}</span>
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={openPanel}>
          <Plus size={16} />
          New Transmittal
        </Button>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by no., subject, recipient..."
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
            {data.length} Transmittals
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Transmittal No.</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">To</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Purpose</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reply Req.</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">File</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-sm text-gray-400">
                      No transmittals found.
                    </td>
                  </tr>
                ) : (
                  data.map((t) => (
                    <tr key={t.transmittalId} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-5 py-3 font-mono text-xs font-medium text-blue-700">{t.transmittalNo}</td>
                      <td className="px-5 py-3 text-gray-700 max-w-[160px] truncate">{t.recipient}</td>
                      <td className="px-5 py-3 text-gray-700 max-w-xs truncate">{t.subject}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${PURPOSE_COLORS[t.purpose] ?? 'bg-gray-100 text-gray-600'}`}>
                          {t.purpose}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(t.date.seconds * 1000).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          t.requiresReply ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {t.requiresReply ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {(() => {
                          const urls: string[] = (t as Transmittal & { fileUrls?: string[]; fileUrl?: string }).fileUrls
                            ?? ((t as Transmittal & { fileUrls?: string[]; fileUrl?: string }).fileUrl ? [(t as Transmittal & { fileUrls?: string[]; fileUrl?: string }).fileUrl!] : [])
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
                          href={`mailto:?subject=${encodeURIComponent(`[${t.transmittalNo}] ${t.subject}`)}&body=${encodeURIComponent(`Transmittal No.: ${t.transmittalNo}\nFrom: ${t.sender}\nTo: ${t.recipient ?? ''}\nSubject: ${t.subject}\nPurpose: ${t.purpose}\nStatus: ${t.status}\nDate: ${new Date(t.date.seconds * 1000).toLocaleDateString('en-GB')}`)}`}
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

      {/* New Transmittal Out slide-over */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={closePanel} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-base font-semibold text-gray-900">New Transmittal Out</h2>
              <button onClick={closePanel} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <EditLockBanner lockedByName={lockedByName} isLockedByMe={isLockedByMe} />
              {saveError && <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{saveError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-gray-700">Transmittal No. <span className="text-red-500">*</span></label>
                  <Input value={form.transmittalNo} onChange={(e) => setForm((f) => ({ ...f, transmittalNo: e.target.value }))}
                    onFocus={() => !isLockedByOther && acquireLock()} placeholder="TR-OUT-26-001" className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Sender <span className="text-red-500">*</span></label>
                  <Input value={form.sender} onChange={(e) => setForm((f) => ({ ...f, sender: e.target.value }))}
                    onFocus={() => !isLockedByOther && acquireLock()} placeholder="Company / Person" className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Recipient</label>
                  <Input value={form.recipient} onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value }))}
                    placeholder="To" className="h-9 text-sm" disabled={saving} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-gray-700">Subject <span className="text-red-500">*</span></label>
                  <Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    onFocus={() => !isLockedByOther && acquireLock()} placeholder="Brief description" className="h-9 text-sm" disabled={saving} />
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
                    generatePath={() => `transmittals/${selectedProject.projectId}/${form.transmittalNo.trim() || 'new'}_out_${Date.now()}`}
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
