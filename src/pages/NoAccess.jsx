import { useState } from 'react'
import pyLogo from '../assets/py-logo.png'

export default function NoAccess() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleResend(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/resend-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setSent(true)
      else setError('Something went wrong. Please try again.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F5F2] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={pyLogo} alt="Promotable You" className="h-10 w-auto" />
        </div>

        <div className="bg-white rounded-2xl border border-[#D8E4EC] p-8 text-center shadow-sm">
          {sent ? (
            <>
              <div className="text-4xl mb-4">📬</div>
              <h1 className="text-xl font-bold text-[#263746] mb-2 font-['Inter']">Check your inbox</h1>
              <p className="text-sm text-[#5A7080]">
                If your email is registered, your personal tracker link is on its way. Bookmark it when it arrives!
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#263746] mb-2 font-['Inter']">Application Accelerator</h1>
              <p className="text-sm text-[#5A7080] italic font-['Playfair_Display'] mb-6">
                Your personal career tracking tool
              </p>
              <p className="text-sm text-[#4A5C6B] mb-6">
                Your tracker link is sent to you when you join the Career Accelerator Program. Enter your email below and we'll resend it.
              </p>
              <form onSubmit={handleResend} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full border border-[#D8E4EC] rounded-lg px-4 py-3 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 placeholder:text-[#7A8FA3]"
                />
                {error && <p className="text-xs text-[#FF5E5B]">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#263746] hover:bg-[#1a2832] text-white py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Resend my link'}
                </button>
              </form>
            </>
          )}
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
