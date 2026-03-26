import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { User, UserRole } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

interface UserContextValue {
  userProfile: User | null
  isMasterAdmin: boolean
  pendingCount: number
  allUsers: User[]
  loadingProfile: boolean
}

const UserContext = createContext<UserContextValue>({
  userProfile: null,
  isMasterAdmin: false,
  pendingCount: 0,
  allUsers: [],
  loadingProfile: true,
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null)
      setAllUsers([])
      setLoadingProfile(false)
      return
    }

    if (USE_MOCK) {
      import('@/data/mockData').then(({ mockUsers }) => {
        const profile = mockUsers.find((u) => u.uid === currentUser.uid) ?? null
        setUserProfile(profile ? { ...profile, photoURL: currentUser.photoURL ?? undefined, status: 'active' } : null)
        setAllUsers(mockUsers.map((u) => ({ ...u, status: 'active' as const })))
        setLoadingProfile(false)
      })
      return
    }

    let unsubProfile: (() => void) | undefined
    let unsubAll: (() => void) | undefined
    let cancelled = false

    Promise.all([import('firebase/firestore'), import('@/services/firebase')]).then(
      ([{ collection, doc, onSnapshot }, { db }]) => {
        if (cancelled) return

        // Listen to current user's profile
        unsubProfile = onSnapshot(
          doc(db, 'CMG-cdms-DocControl', 'root', 'users', currentUser.uid),
          (snap) => {
            if (snap.exists()) {
              setUserProfile({
                uid: snap.id,
                photoURL: currentUser.photoURL ?? undefined,
                ...snap.data(),
              } as User)
            } else {
              // Auto-create user doc on first login
              const newUser: Omit<User, 'uid'> = {
                email: currentUser.email ?? '',
                displayName: currentUser.displayName ?? currentUser.email ?? 'User',
                role: 'Viewer',
                isActive: false,
                photoURL: currentUser.photoURL ?? undefined,
                status: 'pending',
              }
              import('firebase/firestore').then(({ setDoc }) => {
                setDoc(snap.ref, newUser)
              })
            }
            setLoadingProfile(false)
          }
        )

        // Listen to all users (for MasterAdmin panel)
        unsubAll = onSnapshot(
          collection(db, 'CMG-cdms-DocControl', 'root', 'users'),
          (snap) => {
            setAllUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as User)))
          }
        )
      }
    )

    return () => {
      cancelled = true
      unsubProfile?.()
      unsubAll?.()
    }
  }, [currentUser])

  const isMasterAdmin = userProfile?.role === 'MasterAdmin'
  const pendingCount = allUsers.filter((u) => u.status === 'pending').length

  return (
    <UserContext.Provider value={{ userProfile, isMasterAdmin, pendingCount, allUsers, loadingProfile }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}

// Role-based access control
export const ROLE_MODULES: Record<UserRole, string[]> = {
  MasterAdmin: ['dashboard', 'transmittal-in', 'transmittal-out', 'documents', 'projects', 'settings', 'users'],
  Admin:       ['dashboard', 'transmittal-in', 'transmittal-out', 'documents', 'projects', 'settings'],
  SiteAdmin:   ['dashboard', 'transmittal-in', 'transmittal-out', 'documents', 'projects', 'settings'],
  Manager:     ['dashboard', 'transmittal-in', 'transmittal-out', 'documents', 'projects'],
  Engineer:    ['dashboard', 'transmittal-in', 'transmittal-out', 'documents'],
  Viewer:      ['dashboard', 'transmittal-in', 'transmittal-out', 'documents'],
}
