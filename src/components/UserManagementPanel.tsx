import { useState } from 'react'
import { X, Check, Ban, UserCog, Search, Shield } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import type { User, UserRole, UserStatus } from '@/types'

const ROLE_COLORS: Record<UserRole, string> = {
  MasterAdmin: 'bg-purple-100 text-purple-700',
  Admin:       'bg-blue-100 text-blue-700',
  SiteAdmin:   'bg-sky-100 text-sky-700',
  Manager:     'bg-indigo-100 text-indigo-700',
  Engineer:    'bg-cyan-100 text-cyan-700',
  Viewer:      'bg-gray-100 text-gray-600',
}

const STATUS_COLORS: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  pending:  'bg-orange-100 text-orange-700',
  disabled: 'bg-red-100 text-red-600',
}

const ALL_ROLES: UserRole[] = ['MasterAdmin', 'Admin', 'SiteAdmin', 'Manager', 'Engineer', 'Viewer']

interface Props {
  open: boolean
  onClose: () => void
}

function Avatar({ user }: { user: User }) {
  const initials = user.displayName?.charAt(0).toUpperCase() ?? '?'
  if (user.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName}
        className="w-9 h-9 rounded-full object-cover shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
      {initials}
    </div>
  )
}

async function updateUser(uid: string, data: Partial<User>) {
  const [{ doc, updateDoc }, { db }] = await Promise.all([
    import('firebase/firestore'),
    import('@/services/firebase'),
  ])
  await updateDoc(doc(db, 'CMG-cdms-DocControl', 'root', 'users', uid), data as Record<string, unknown>)
}

export default function UserManagementPanel({ open, onClose }: Props) {
  const { allUsers, pendingCount } = useUser()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'disabled'>('all')
  const [saving, setSaving] = useState<string | null>(null)

  const filtered = allUsers
    .filter((u) => filter === 'all' || (u.status ?? 'active') === filter)
    .filter((u) =>
      search === '' ||
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if ((a.status ?? 'active') === 'pending' && (b.status ?? 'active') !== 'pending') return -1
      if ((b.status ?? 'active') === 'pending' && (a.status ?? 'active') !== 'pending') return 1
      return a.displayName.localeCompare(b.displayName)
    })

  async function handleApprove(u: User) {
    setSaving(u.uid)
    await updateUser(u.uid, { status: 'active', isActive: true })
    setSaving(null)
  }

  async function handleDisable(u: User) {
    setSaving(u.uid)
    await updateUser(u.uid, { status: 'disabled', isActive: false })
    setSaving(null)
  }

  async function handleRoleChange(u: User, role: UserRole) {
    setSaving(u.uid)
    await updateUser(u.uid, { role })
    setSaving(null)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <UserCog size={20} className="text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">User Management</h2>
            {pendingCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">
                {pendingCount} pending
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-gray-100 flex flex-col gap-2 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'pending', 'active', 'disabled'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f}
                {f === 'pending' && pendingCount > 0 && (
                  <span className="ml-1 bg-orange-500 text-white rounded-full px-1 text-[10px]">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
              <Shield size={32} className="text-gray-200" />
              <p>No users found</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((u) => {
                const status = (u.status ?? 'active') as UserStatus
                const isSaving = saving === u.uid
                return (
                  <li key={u.uid} className={`px-5 py-4 flex items-start gap-3 ${status === 'pending' ? 'bg-orange-50' : ''}`}>
                    <Avatar user={u} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 truncate">{u.displayName}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>

                      {/* Role selector */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <select
                          disabled={isSaving}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                          className="h-7 text-xs border border-gray-200 rounded-md px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>

                        {status === 'pending' && (
                          <button
                            onClick={() => handleApprove(u)}
                            disabled={isSaving}
                            className="flex items-center gap-1 h-7 px-2.5 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <Check size={12} />
                            Approve
                          </button>
                        )}

                        {status === 'active' && (
                          <button
                            onClick={() => handleDisable(u)}
                            disabled={isSaving}
                            className="flex items-center gap-1 h-7 px-2.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            <Ban size={12} />
                            Disable
                          </button>
                        )}

                        {status === 'disabled' && (
                          <button
                            onClick={() => handleApprove(u)}
                            disabled={isSaving}
                            className="flex items-center gap-1 h-7 px-2.5 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors"
                          >
                            <Check size={12} />
                            Re-enable
                          </button>
                        )}

                        {isSaving && (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 shrink-0">
          {allUsers.length} users total · {pendingCount} pending approval
        </div>
      </div>
    </>
  )
}
