import { createContext, useContext, useEffect, useState } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import { mockUsers, MOCK_UID } from '@/data/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

interface AuthContextValue {
  currentUser: FirebaseUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  loading: true,
})

/** Minimal FirebaseUser-shaped object for mock mode */
const MOCK_FIREBASE_USER = {
  uid: MOCK_UID.alice,
  email: mockUsers[0].email,
  displayName: mockUsers[0].displayName,
  emailVerified: true,
  isAnonymous: false,
  photoURL: null,
  providerData: [],
  metadata: {},
  tenantId: null,
  phoneNumber: null,
  providerId: 'mock',
  refreshToken: '',
  getIdToken: async () => 'mock-token',
  getIdTokenResult: async () => ({} as never),
  reload: async () => {},
  toJSON: () => ({}),
  delete: async () => {},
} as unknown as FirebaseUser

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(
    USE_MOCK ? MOCK_FIREBASE_USER : null
  )
  const [loading, setLoading] = useState(!USE_MOCK)

  useEffect(() => {
    if (USE_MOCK) return

    let cancelled = false
    Promise.all([
      import('firebase/auth'),
      import('@/services/firebase'),
    ]).then(([{ onAuthStateChanged }, { auth }]) => {
      if (cancelled) return
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user)
        setLoading(false)
      })
      return () => { cancelled = true; unsubscribe() }
    })
    return () => { cancelled = true }
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
