import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  FolderOpen,
  Settings,
  ChevronDown,
  Bell,
  Menu,
  X,
  Building2,
  Layers,
  UserCog,
  Users,
} from 'lucide-react'
import { useProject } from '@/contexts/ProjectContext'
import { useAuth } from '@/contexts/AuthContext'
import { useUser, ROLE_MODULES } from '@/contexts/UserContext'

const NAV_MAIN = [
  { to: '/dashboard',      label: 'Dashboard',         icon: LayoutDashboard, module: 'dashboard' },
  { to: '/transmittal-in', label: 'Transmittal In',    icon: ArrowDownToLine, module: 'transmittal-in' },
  { to: '/transmittal-out',label: 'Transmittal Out',   icon: ArrowUpFromLine, module: 'transmittal-out' },
  { to: '/documents',      label: 'Document Register', icon: FolderOpen,      module: 'documents' },
]

const NAV_ADMIN = [
  { to: '/projects',  label: 'Projects',  icon: Layers,    module: 'projects' },
  { to: '/settings',  label: 'Settings',  icon: Settings,  module: 'settings' },
  { to: '/users',     label: 'Users',     icon: Users,     module: 'users' },
]

const ROLE_COLORS: Record<string, string> = {
  MasterAdmin: 'text-purple-400',
  Admin:       'text-blue-400',
  Manager:     'text-indigo-400',
  Engineer:    'text-cyan-400',
  Viewer:      'text-slate-400',
}

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const projectDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const { availableProjects, selectedProject, changeSelectedProject, loadingProjects } = useProject()
  const { currentUser } = useAuth()
  const { userProfile, isMasterAdmin, pendingCount } = useUser()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName = userProfile?.displayName ?? currentUser?.displayName ?? currentUser?.email ?? 'User'
  const photoURL = currentUser?.photoURL ?? userProfile?.photoURL ?? null
  const userRole = userProfile?.role ?? 'Viewer'
  const allowedModules = ROLE_MODULES[userRole] ?? ROLE_MODULES['Viewer']
  const initials = displayName.charAt(0).toUpperCase()

  async function handleSignOut() {
    const [{ signOut }, { auth }] = await Promise.all([
      import('firebase/auth'),
      import('@/services/firebase'),
    ])
    await signOut(auth)
  }

  async function handleUpdateProfile() {
    setUpdatingProfile(true)
    try {
      const [{ updateProfile }, { auth }] = await Promise.all([
        import('firebase/auth'),
        import('@/services/firebase'),
      ])
      if (!auth.currentUser) return
      const newName = prompt('Display name:', auth.currentUser.displayName ?? '')
      if (newName !== null && newName.trim()) {
        await updateProfile(auth.currentUser, { displayName: newName.trim() })
        // Also update Firestore user doc
        const [{ doc, updateDoc }, { db }] = await Promise.all([
          import('firebase/firestore'),
          import('@/services/firebase'),
        ])
        await updateDoc(doc(db, 'CMG-cdms-DocControl', 'root', 'users', auth.currentUser.uid), {
          displayName: newName.trim(),
        })
      }
    } finally {
      setUpdatingProfile(false)
      setUserDropdownOpen(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`
          flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 shrink-0
          ${sidebarOpen ? 'w-60' : 'w-16'}
        `}
      >
        {/* ── Sidebar Top: Logo ── */}
        <div className="flex items-center gap-3 h-16 px-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shrink-0">
            <Building2 size={18} />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-white text-sm tracking-wide truncate">CDMS</span>
          )}
        </div>

        {/* ── Sidebar User Profile Card ── */}
        {sidebarOpen ? (
          <div className="mx-3 mt-3 mb-1 p-3 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
            <div className="flex items-center gap-2.5">
              {photoURL ? (
                <img src={photoURL} alt={displayName} className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight">{displayName}</p>
                <p className={`text-xs font-medium truncate mt-0.5 ${ROLE_COLORS[userRole] ?? 'text-slate-400'}`}>
                  {userRole}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mt-3 mb-1 shrink-0">
            {photoURL ? (
              <img src={photoURL} alt={displayName} className="w-8 h-8 rounded-full object-cover" title={displayName} />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold" title={displayName}>
                {initials}
              </div>
            )}
          </div>
        )}

        {/* ── Nav Links ── */}
        <nav className="flex-1 py-2 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {NAV_MAIN.filter((n) => allowedModules.includes(n.module)).map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
                  }
                  title={!sidebarOpen ? label : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {sidebarOpen && <span className="truncate">{label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Administration section */}
          {NAV_ADMIN.some((n) => allowedModules.includes(n.module)) && (
            <div className="mt-4 px-2">
              {sidebarOpen && (
                <p className="px-3 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Administration
                </p>
              )}
              {!sidebarOpen && <div className="border-t border-slate-700 my-2" />}
              <ul className="space-y-1">
                {NAV_ADMIN.filter((n) => allowedModules.includes(n.module)).map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
                      }
                      title={!sidebarOpen ? label : undefined}
                    >
                      <div className="relative shrink-0">
                        <Icon size={18} />
                        {to === '/users' && isMasterAdmin && pendingCount > 0 && !sidebarOpen && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {pendingCount > 9 ? '9+' : pendingCount}
                          </span>
                        )}
                      </div>
                      {sidebarOpen && (
                        <>
                          <span className="truncate flex-1">{label}</span>
                          {to === '/users' && isMasterAdmin && pendingCount > 0 && (
                            <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white">
                              {pendingCount}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="px-4 py-2.5 border-t border-slate-700 shrink-0">
            <p className="text-xs text-slate-500">v1.0.0 · CDMS</p>
          </div>
        )}
      </aside>

      {/* ── Main Column ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* ── Top Navbar ── */}
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 shrink-0 shadow-sm">
          {/* Left: toggle + project selector */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Project Selector */}
            <div className="relative" ref={projectDropdownRef}>
              <button
                onClick={() => setProjectDropdownOpen((o) => !o)}
                className="flex items-center gap-2 h-9 px-3 text-sm font-medium max-w-[240px] rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                <Building2 size={15} className="text-blue-600 shrink-0" />
                {loadingProjects ? (
                  <span className="truncate text-gray-400">Loading…</span>
                ) : selectedProject ? (
                  <span className="truncate">{selectedProject.name}</span>
                ) : (
                  <span className="truncate text-gray-400">No projects</span>
                )}
                <ChevronDown size={14} className="text-gray-400 shrink-0 ml-1" />
              </button>

              {projectDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-lg z-50 py-1">
                  <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Switch Project</p>
                  <div className="h-px bg-gray-100 mx-2 mb-1" />
                  {availableProjects.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400 text-center">No projects available</div>
                  ) : (
                    availableProjects.map((p) => (
                      <button
                        key={p.projectId}
                        onClick={() => { changeSelectedProject(p.projectId); setProjectDropdownOpen(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                          selectedProject?.projectId === p.projectId ? 'text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <Building2 size={13} className="shrink-0 text-gray-400" />
                        <span className="truncate flex-1">{p.name}</span>
                        {selectedProject?.projectId === p.projectId && (
                          <span className="text-xs text-blue-500">Active</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Notifications + User */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>

            {/* User Avatar Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen((o) => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors bg-transparent cursor-pointer"
              >
                {photoURL ? (
                  <img src={photoURL} alt={displayName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initials}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-800 leading-none truncate max-w-[120px]">{displayName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{userRole}</p>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-gray-200 bg-white shadow-lg z-50 py-1">
                  {/* Profile preview */}
                  <div className="px-3 py-2.5 flex items-center gap-2.5 border-b border-gray-100">
                    {photoURL ? (
                      <img src={photoURL} alt={displayName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{currentUser?.email ?? ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={updatingProfile}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <UserCog size={14} className="text-gray-400" />
                    Update Profile
                  </button>
                  <div className="h-px bg-gray-100 mx-2 my-1" />
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

    </div>
  )
}
