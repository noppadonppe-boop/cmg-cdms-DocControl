import { useState } from 'react'
import { Building2, Loader2, Eye, EyeOff, Clock } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.5-3.3-11.2-7.9l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.4-2.4 4.4-4.4 5.8l6.2 5.2C36.9 39.7 44 34.7 44 24c0-1.3-.1-2.7-.4-3.9z"/>
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<'pending' | 'disabled' | null>(null)

  async function checkUserStatus(uid: string): Promise<'active' | 'pending' | 'disabled' | 'unknown'> {
    try {
      const [{ doc, getDoc }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('@/services/firebase'),
      ])
      const snap = await getDoc(doc(db, 'CMG-cdms-DocControl', 'root', 'users', uid))
      if (!snap.exists()) return 'pending'
      return (snap.data().status ?? 'active') as 'active' | 'pending' | 'disabled'
    } catch {
      return 'unknown'
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStatusError(null)
    setLoading(true)
    try {
      const [{ signInWithEmailAndPassword, signOut }, { auth }] = await Promise.all([
        import('firebase/auth'),
        import('@/services/firebase'),
      ])
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const status = await checkUserStatus(cred.user.uid)
      if (status === 'pending') {
        await signOut(auth)
        setStatusError('pending')
        return
      }
      if (status === 'disabled') {
        await signOut(auth)
        setStatusError('disabled')
        return
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      console.error('[Login Error]', code, err)
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Invalid email or password.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.')
      } else if (code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in methods.')
      } else {
        setError(`Login failed: ${code ?? 'unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    setStatusError(null)
    setGoogleLoading(true)
    try {
      const [{ GoogleAuthProvider, signInWithPopup, signOut }, { auth }] = await Promise.all([
        import('firebase/auth'),
        import('@/services/firebase'),
      ])
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const cred = await signInWithPopup(auth, provider)
      const status = await checkUserStatus(cred.user.uid)
      if (status === 'pending') {
        await signOut(auth)
        setStatusError('pending')
        return
      }
      if (status === 'disabled') {
        await signOut(auth)
        setStatusError('disabled')
        return
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      console.error('[Google Login Error]', code, err)
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User dismissed — not an error
      } else if (code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in methods.')
      } else if (code === 'auth/popup-blocked') {
        setError('Popup was blocked by the browser. Please allow popups for this site.')
      } else {
        setError(`Google sign-in failed: ${code ?? 'unknown error'}`)
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-3">
            <Building2 size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CDMS</h1>
          <p className="text-sm text-gray-500 mt-1">Construction Document Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Sign in</h2>
          <p className="text-sm text-gray-400 mb-5">Enter your credentials to continue</p>

          {statusError === 'pending' && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-start gap-2.5">
                <Clock size={16} className="text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">Account Pending Approval</p>
                  <p className="text-xs text-orange-600 mt-0.5">Your account is awaiting administrator approval. You will be notified once access is granted.</p>
                </div>
              </div>
            </div>
          )}
          {statusError === 'disabled' && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm font-semibold text-red-700">Account Disabled</p>
              <p className="text-xs text-red-600 mt-0.5">Your account has been disabled. Please contact an administrator.</p>
            </div>
          )}
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full h-10 flex items-center justify-center gap-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 mb-4"
          >
            {googleLoading ? (
              <Loader2 size={16} className="animate-spin text-gray-400" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="you@example.com"
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  className="w-full h-10 px-3 pr-10 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-400 text-center">
            Demo: alice@cmg-engineering.com / Alice@1234
          </p>
        </div>
      </div>
    </div>
  )
}
