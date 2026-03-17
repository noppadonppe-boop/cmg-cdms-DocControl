import { useEffect, useState } from 'react'
import { FileText, ArrowDownToLine, ArrowUpFromLine, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProject } from '@/contexts/ProjectContext'
import NoProjectSelected from '@/components/NoProjectSelected'
import type { Transmittal, Document } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const STATUS_COLORS: Record<string, string> = {
  'Under Review': 'bg-yellow-100 text-yellow-800',
  'Submitted': 'bg-blue-100 text-blue-800',
  'Closed': 'bg-green-100 text-green-800',
  'Draft': 'bg-gray-100 text-gray-600',
}

export default function DashboardPage() {
  const { selectedProject } = useProject()
  const [transmittals, setTransmittals] = useState<Transmittal[]>([])
  const [documents, setDocuments] = useState<Document[]>([])

  useEffect(() => {
    if (!selectedProject) return

    if (USE_MOCK) {
      import('@/data/mockData').then(({ mockTransmittals, mockDocuments }) => {
        setTransmittals(mockTransmittals.filter((t) => t.projectId === selectedProject.projectId))
        setDocuments(mockDocuments.filter((d) => d.projectId === selectedProject.projectId))
      })
      return
    }

    let unsub1: (() => void) | undefined
    let unsub2: (() => void) | undefined
    let cancelled = false

    Promise.all([import('firebase/firestore'), import('@/services/firebase')]).then(
      ([{ collection, query, where, orderBy, onSnapshot }, { db }]) => {
        if (cancelled) return
        const pid = selectedProject.projectId
        const base = (col: string) => collection(db, 'CMG-cdms-DocControl', 'root', col)

        unsub1 = onSnapshot(
          query(base('transmittals'), where('projectId', '==', pid), orderBy('date', 'desc')),
          (snap) => setTransmittals(snap.docs.map((d) => ({ transmittalId: d.id, ...d.data() } as Transmittal)))
        )
        unsub2 = onSnapshot(
          query(base('documents'), where('projectId', '==', pid)),
          (snap) => setDocuments(snap.docs.map((d) => ({ documentId: d.id, ...d.data() } as Document)))
        )
      }
    )
    return () => { cancelled = true; unsub1?.(); unsub2?.() }
  }, [selectedProject])

  if (!selectedProject) return <NoProjectSelected />

  const transmittalsIn = transmittals.filter((t) => t.type === 'in')
  const transmittalsOut = transmittals.filter((t) => t.type === 'out')
  const pendingReview = documents.filter((d) => d.status === 'Under Review')
  const recentTransmittals = [...transmittals].sort((a, b) => b.date.seconds - a.date.seconds).slice(0, 5)

  const STATS = [
    { label: 'Total Documents', value: String(documents.filter((d) => d.isLatest).length), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Transmittals In', value: String(transmittalsIn.length), icon: ArrowDownToLine, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Transmittals Out', value: String(transmittalsOut.length), icon: ArrowUpFromLine, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Pending Review', value: String(pendingReview.length), icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview for <span className="font-medium text-gray-700">{selectedProject.name}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border border-gray-200 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${bg}`}>
                <Icon size={22} className={color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transmittals */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">Recent Transmittals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">No.</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransmittals.map((t) => (
                  <tr key={t.transmittalId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-blue-700 font-medium">{t.transmittalNo}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        t.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {t.type === 'in' ? 'In' : 'Out'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700 max-w-xs truncate">{t.subject}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(t.date.seconds * 1000).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
