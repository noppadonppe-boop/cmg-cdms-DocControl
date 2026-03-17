/**
 * useEditLock – Firestore-backed optimistic edit lock
 *
 * Usage:
 *   const { lockStatus, acquireLock, releaseLock, isLockedByOther, lockedByName } = useEditLock(docPath)
 *
 * - acquireLock()  → writes { lockedBy, lockedByName, lockedAt } to Firestore
 * - releaseLock()  → clears the lock
 * - isLockedByOther → true if another user holds the lock
 * - lockedByName   → display name of the user who holds the lock
 *
 * Lock auto-expires after LOCK_TTL_MS of inactivity (heartbeat via acquireLock).
 */

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUser } from '@/contexts/UserContext'

export interface LockState {
  lockedBy: string | null
  lockedByName: string | null
  lockedAt: number | null
}

const LOCK_TTL_MS = 30_000 // 30 s
const HEARTBEAT_MS = 10_000 // ping every 10 s while editing

export function useEditLock(docPath: string) {
  const { currentUser } = useAuth()
  const { userProfile } = useUser()
  const [lock, setLock] = useState<LockState>({ lockedBy: null, lockedByName: null, lockedAt: null })
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)
  const lockDocPath = `${docPath}/__editLock__`

  // Listen to lock doc
  useEffect(() => {
    if (!docPath) return
    let cancelled = false

    Promise.all([import('firebase/firestore'), import('@/services/firebase')]).then(
      ([{ doc, onSnapshot }, { db }]) => {
        if (cancelled) return
        const parts = lockDocPath.split('/')
        const lockRef = doc(db, parts[0], ...parts.slice(1))
        unsubRef.current = onSnapshot(lockRef, (snap) => {
          if (!snap.exists()) {
            setLock({ lockedBy: null, lockedByName: null, lockedAt: null })
            return
          }
          const d = snap.data()
          const lockedAt = d.lockedAt as number
          // Treat as unlocked if TTL expired
          if (Date.now() - lockedAt > LOCK_TTL_MS) {
            setLock({ lockedBy: null, lockedByName: null, lockedAt: null })
          } else {
            setLock({ lockedBy: d.lockedBy, lockedByName: d.lockedByName, lockedAt })
          }
        })
      }
    )

    return () => {
      cancelled = true
      unsubRef.current?.()
    }
  }, [lockDocPath, docPath])

  async function acquireLock(): Promise<boolean> {
    if (!currentUser) return false

    try {
      const [{ doc, setDoc, getDoc }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('@/services/firebase'),
      ])
      const parts = lockDocPath.split('/')
      const lockRef = doc(db, parts[0], ...parts.slice(1))
      const snap = await getDoc(lockRef)

      if (snap.exists()) {
        const d = snap.data()
        const age = Date.now() - (d.lockedAt as number)
        const isExpired = age >= LOCK_TTL_MS
        const isOwnedByMe = d.lockedBy === currentUser.uid
        // Block only if: someone else holds it AND it has NOT expired
        if (!isOwnedByMe && !isExpired) {
          return false
        }
        // Otherwise: either it's mine, or it's stale — take it over
      }

      const displayName = userProfile?.displayName ?? currentUser.displayName ?? currentUser.email ?? 'Unknown'
      await setDoc(lockRef, {
        lockedBy: currentUser.uid,
        lockedByName: displayName,
        lockedAt: Date.now(),
      })

      // Start / reset heartbeat
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      heartbeatRef.current = setInterval(async () => {
        try {
          await setDoc(lockRef, { lockedBy: currentUser.uid, lockedByName: displayName, lockedAt: Date.now() })
        } catch {
          // ignore heartbeat failures silently
        }
      }, HEARTBEAT_MS)

      return true
    } catch {
      return false
    }
  }

  async function releaseLock() {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    if (!currentUser) return
    try {
      const [{ doc, deleteDoc }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('@/services/firebase'),
      ])
      const parts = lockDocPath.split('/')
      const lockRef = doc(db, parts[0], ...parts.slice(1))
      await deleteDoc(lockRef)
    } catch {
      // ignore
    }
  }

  /** Force-delete the lock doc regardless of owner (use when TTL check is not enough) */
  async function forceReleaseLock() {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    try {
      const [{ doc, deleteDoc }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('@/services/firebase'),
      ])
      const parts = lockDocPath.split('/')
      const lockRef = doc(db, parts[0], ...parts.slice(1))
      await deleteDoc(lockRef)
    } catch {
      // ignore
    }
  }

  // Auto-release on unmount
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      // Fire-and-forget release
      releaseLock()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isLockedByOther =
    lock.lockedBy !== null &&
    lock.lockedBy !== currentUser?.uid &&
    lock.lockedAt !== null &&
    Date.now() - lock.lockedAt < LOCK_TTL_MS

  const isLockedByMe = lock.lockedBy === currentUser?.uid

  return {
    lock,
    acquireLock,
    releaseLock,
    forceReleaseLock,
    isLockedByOther,
    isLockedByMe,
    lockedByName: lock.lockedByName,
  }
}
