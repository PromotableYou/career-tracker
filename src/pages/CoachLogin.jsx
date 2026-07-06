import { useState } from 'react'
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react'
import pyLogo from '../assets/py-logo.png'

export default function CoachLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/coach-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: email.trim(), password }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Login failed')
        setLoading(false)
        return
      }

      localStorage.setItem('coach_auth', JSON.stringify({
        token: json.token,
        refreshToken: json.refreshToken,
        expiresAt: json.expiresAt,
        coach: json.coach,
      }))

      onLogin(json)
    } catch {
      setError('Network error — please try again')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F5F2] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={pyLogo} alt="Promotable You" className="h-10 w-auto mb-4" />
          <h1
            className="text-2xl text-[#263746] text-center"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 700 }}
          >
            Coach Portal
          </h1>
          <p className="text-sm text-[#7A8FA3] mt-1">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#D8E4EC] p-8 shadow-sm space-y-5">

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[#263746] mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA3]" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-[#D8E4EC] rounded-lg text-sm text-[#263746] placeholder:text-[#7A8FA3] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 focus:border-[#6D99F2]"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-[#263746] mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA3]" />
              <input
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 border border-[#D8E4EC] rounded-lg text-sm text-[#263746] placeholder:text-[#7A8FA3] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 focus:border-[#6D99F2]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8FA3] hover:text-[#263746] cursor-pointer"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-[#FF5E5B] bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#263746] hover:bg-[#1a2733] text-white font-semibold text-sm py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-[#7A8FA3] mt-6">
          Coach access only. Contact your administrator to set up your account.
        </p>
      </div>
    </div>
  )
}
