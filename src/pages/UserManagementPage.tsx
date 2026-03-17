import { useState, useRef, useEffect, useCallback } from 'react'
import { UserCog, Search, Check, Ban, Shield, FolderOpen, ChevronDown, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useUser } from '@/contexts/UserContext'
import { useProject } from '@/contexts/ProjectContext'
import type { User, UserRole, UserStatus } from '@/types'

const ROLE_COLORS: Record<string, string> = {
  MasterAdmin: 'bg-purple-100 text-purple-700',
  Admin:       'bg-blue-100 text-blue-700',
  Manager:     'bg-indigo-100 text-indigo-700',
  Engineer:    'bg-cyan-100 text-cyan-700',
  Viewer:      'bg-gray-100 text-gray-600',
}

const USER_STATUS_COLORS: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  pending:  'bg-orange-100 text-orange-700',
  disabled: 'bg-red-100 text-red-600',
}

const ALL_ROLES: UserRole[] = ['MasterAdmin', 'Admin', 'Manager', 'Engineer', 'Viewer']

async function updateUser(uid: string, data: Partial<User>) {
  const [{ doc, updateDoc }, { db }] = await Promise.all([
    import('firebase/firestore'),
    import('@/services/firebase'),
  ])
  await updateDoc(doc(db, 'CMG-cdms-DocControl', 'root', 'users', uid), data as Record<string, unknown>)
}

async function deleteUser(uid: string) {
  const [{ doc, deleteDoc }, { db }] = await Promise.all([
    import('firebase/firestore'),
    import('@/services/firebase'),
  ])
  await deleteDoc(doc(db, 'CMG-cdms-DocControl', 'root', 'users', uid))
}

function UserAvatar({ user }: { user: User }) {
  const initials = user.displayName?.charAt(0).toUpperCase() ?? '?'
  if (user.photoURL) {
    return (
      <img src={user.photoURL} alt={user.displayName}
        className="w-10 h-10 rounded-full object-cover shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
      {initials}
    </div>
  )
}

export default function UserManagementPage() {
  const { allUsers, pendingCount } = useUser()
  const { allProjects } = useProject()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'disabled'>('all')
  const [savingUser, setSavingUser] = useState<string | null>(null)
  const [deletingUid, setDeletingUid] = useState<string | null>(null)
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null)
  const [projectPopoverUid, setProjectPopoverUid] = useState<string | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setProjectPopoverUid(null)
        setPopoverPos(null)
      }
    }
    function handleScroll() {
      setProjectPopoverUid(null)
      setPopoverPos(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [])

  const openProjectPopover = useCallback((uid: string, btn: HTMLButtonElement) => {
    if (projectPopoverUid === uid) {
      setProjectPopoverUid(null)
      setPopoverPos(null)
      return
    }
    const rect = btn.getBoundingClientRect()
    setPopoverPos({ top: rect.bottom + 4, left: rect.left })
    setProjectPopoverUid(uid)
  }, [projectPopoverUid])

  async function handleApprove(u: User) {
    setSavingUser(u.uid)
    await updateUser(u.uid, { status: 'active', isActive: true })
    setSavingUser(null)
  }

  async function handleDisable(u: User) {
    setSavingUser(u.uid)
    await updateUser(u.uid, { status: 'disabled', isActive: false })
    setSavingUser(null)
  }

  async function handleRoleChange(u: User, role: UserRole) {
    setSavingUser(u.uid)
    await updateUser(u.uid, { role })
    setSavingUser(null)
  }

  async function handleDelete(uid: string) {
    setDeletingUid(uid)
    await deleteUser(uid)
    setDeletingUid(null)
    setConfirmDeleteUid(null)
  }

  async function handleProjectAssign(u: User, projectId: string, assigned: boolean) {
    const current = u.assignedProjectIds ?? []
    const next = assigned
      ? [...new Set([...current, projectId])]
      : current.filter((id) => id !== projectId)
    await updateUser(u.uid, { assignedProjectIds: next })
  }

  const filteredUsers = allUsers
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

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">
                {pendingCount} pending
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {allUsers.length} users total · manage roles, status, and project access
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {(['all', 'pending', 'active', 'disabled'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                  filter === f ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}>
                {f}
                {f === 'pending' && pendingCount > 0 && (
                  <span className="ml-1.5 bg-orange-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-52"
            />
          </div>
        </div>
      </div>

      {/* User Table Card */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <Shield size={40} className="text-gray-200" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Projects</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => {
                    const status = (u.status ?? 'active') as UserStatus
                    const isSaving = savingUser === u.uid
                    return (
                      <tr key={u.uid} className={`hover:bg-gray-50 transition-colors ${status === 'pending' ? 'bg-orange-50 hover:bg-orange-50' : ''}`}>
                        {/* User */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={u} />
                            <span className="font-medium text-gray-900 whitespace-nowrap">{u.displayName}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-3 text-gray-500 text-xs">{u.email}</td>

                        {/* Role */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                              {u.role}
                            </span>
                            <select
                              disabled={isSaving}
                              value={u.role}
                              onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                              className="h-8 text-xs border border-gray-200 rounded-md px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                            >
                              {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${USER_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {status}
                          </span>
                        </td>

                        {/* Project assignment */}
                        <td className="px-5 py-3">
                          {u.role === 'MasterAdmin' || u.role === 'Admin' ? (
                            <span className="text-xs text-gray-400 italic">All projects</span>
                          ) : (
                            <button
                              onClick={(e) => openProjectPopover(u.uid, e.currentTarget)}
                              className="flex items-center gap-1.5 h-8 px-2.5 text-xs border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
                            >
                              <FolderOpen size={12} className="text-gray-400" />
                              <span className="text-gray-700">
                                {(u.assignedProjectIds?.length ?? 0) === 0
                                  ? 'No projects'
                                  : `${u.assignedProjectIds!.length} project${u.assignedProjectIds!.length > 1 ? 's' : ''}`}
                              </span>
                              <ChevronDown size={11} className="text-gray-400" />
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {status === 'pending' && (
                              <button onClick={() => handleApprove(u)} disabled={isSaving}
                                className="flex items-center gap-1 h-8 px-3 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap">
                                <Check size={13} />Approve
                              </button>
                            )}
                            {status === 'active' && (
                              <button onClick={() => handleDisable(u)} disabled={isSaving}
                                className="flex items-center gap-1 h-8 px-3 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors whitespace-nowrap">
                                <Ban size={13} />Disable
                              </button>
                            )}
                            {status === 'disabled' && (
                              <button onClick={() => handleApprove(u)} disabled={isSaving}
                                className="flex items-center gap-1 h-8 px-3 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors whitespace-nowrap">
                                <Check size={13} />Re-enable
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmDeleteUid(u.uid)}
                              disabled={isSaving || deletingUid === u.uid}
                              title="Delete user"
                              className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 disabled:opacity-40 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>

                            {isSaving && (
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-2">
            <UserCog size={13} className="text-gray-300" />
            {allUsers.length} users total · {pendingCount} pending approval
          </div>
        </CardContent>
      </Card>

      {/* Confirm Delete Dialog */}
      {confirmDeleteUid && (() => {
        const target = allUsers.find((u) => u.uid === confirmDeleteUid)
        if (!target) return null
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDeleteUid(null)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Delete User</h3>
                  <p className="text-xs text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-5">
                Delete <span className="font-semibold">{target.displayName}</span>
                <span className="text-gray-400"> ({target.email})</span>?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmDeleteUid(null)}
                  disabled={deletingUid === confirmDeleteUid}
                  className="h-9 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteUid)}
                  disabled={deletingUid === confirmDeleteUid}
                  className="h-9 px-4 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {deletingUid === confirmDeleteUid ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Project popover — fixed to escape table overflow clipping */}
      {projectPopoverUid && popoverPos && (() => {
        const u = allUsers.find((x) => x.uid === projectPopoverUid)
        if (!u) return null
        return (
          <div
            ref={popoverRef}
            style={{ position: 'fixed', top: popoverPos.top, left: popoverPos.left, zIndex: 9999 }}
            className="w-60 rounded-lg border border-gray-200 bg-white shadow-xl py-1.5"
          >
            <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
              Accessible Projects
            </p>
            {allProjects.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No projects created yet</p>
            ) : (
              <ul className="max-h-52 overflow-y-auto">
                {allProjects.map((p) => {
                  const checked = (u.assignedProjectIds ?? []).includes(p.projectId)
                  return (
                    <li key={p.projectId}>
                      <label className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => handleProjectAssign(u, p.projectId, e.target.checked)}
                          className="w-4 h-4 rounded accent-blue-600 shrink-0"
                        />
                        <span className="text-sm text-gray-700 truncate">{p.name}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })()}
    </div>
  )
}
