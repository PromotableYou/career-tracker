import { useState } from 'react'
import pyLogo from '../assets/py-logo.png'

export default function NoAccess() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/lookup?email=${encodeURIComponent(email.trim().toLowerCase())}`)
      if (res.ok) {
        const { token } = await res.json()
        localStorage.setItem('py-tracker-uid', token)
        window.location.href = '/'
      } else if (res.status === 404) {
        setError("We couldn't find your email. Check the spelling, or contact your coach to get access.")
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F5F2] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <img src={pyLogo} alt="Promotable You" className="h-10 w-auto mx-auto mb-6" />
          <h1
            className="text-3xl text-[#263746] mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 700 }}
          >
            Application Accelerator
          </h1>
          <p className="text-sm text-[#7A8FA3]" style={{ fontFamily: "'Inter', sans-serif" }}>
            by Promotable You
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#D8E4EC] p-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#263746] mb-1">Access your tracker</h2>
          <p className="text-sm text-[#7A8FA3] mb-6">
            Enter the email address you joined the program with.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="your@email.com"
              required
              autoFocus
              className="w-full border border-[#D8E4EC] rounded-lg px-4 py-3 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 placeholder:text-[#7A8FA3]"
            />
            {error && (
              <p className="text-xs text-[#FF5E5B] leading-relaxed">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-[#263746] hover:bg-[#1a2832] text-white py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Looking you up…' : 'Access my tracker →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#7A8FA3] mt-6">
          Not a CAP member yet?{' '}
          <a href="https://promotableyou.com" className="text-[#6D99F2] hover:underline">
            Learn more
          </a>
        </p>

      </div>
    </div>
  )
}
