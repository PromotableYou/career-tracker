import { useState, useEffect, useRef } from 'react'
import { Users, Briefcase, CheckCircle, AlertCircle, ExternalLink, Search, StickyNote, TrendingUp, Clock, Award, ChevronDown, ChevronUp } from 'lucide-react'

function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

function getRisk(days, stage) {
  if (!days && days !== 0) return 'none'
  if (days < 7) return 'green'
  if (days < 14) return 'amber'
  return 'red'
}

function RiskBadge({ days }) {
  if (days === null) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EEF3FA] text-[#7A8FA3]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#7A8FA3]" />
      No data
    </span>
  )
  if (days === 0) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Today
    </span>
  )
  if (days < 7) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      {days}d ago
    </span>
  )
  if (days < 14) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      {days}d ago
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#FF5E5B]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E5B]" />
      {days}d ago
    </span>
  )
}

function SectionHeader({ title, subtitle, gold }) {
  return (
    <div className={`px-5 py-3 rounded-t-xl border-b border-[#D8E4EC] ${gold ? 'bg-[#D4AF37]' : 'bg-[#263746]'}`}>
      <h2 className={`font-bold text-sm tracking-wide font-['Inter'] ${gold ? 'text-[#263746]' : 'text-white'}`}>{title}</h2>
      {subtitle && <p className={`text-xs mt-0.5 ${gold ? 'text-[#263746]/70' : 'text-white/60'}`}>{subtitle}</p>}
    </div>
  )
}

export default function CoachDashboard({ coachKey }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('lastActive')
  const [coachFilter, setCoachFilter] = useState(() => localStorage.getItem('coach-dashboard-filter') || '')
  const [notesOpen, setNotesOpen] = useState(null)
  const [notesDraft, setNotesDraft] = useState({})
  const [expandedMember, setExpandedMember] = useState(null)
  const saveTimers = useRef({})

  useEffect(() => {
    fetch(`/api/admin?key=${coachKey}`)
      .then(res => res.ok ? res.json() : res.json().then(j => { throw new Error(j.error) }))
      .then(json => {
        setMembers(json.members)
        const drafts = {}
        json.members.forEach(m => { drafts[m.id] = m.coachNotes || '' })
        setNotesDraft(drafts)
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [coachKey])

  function updateNotes(memberId, value) {
    setNotesDraft(prev => ({ ...prev, [memberId]: value }))
    if (saveTimers.current[memberId]) clearTimeout(saveTimers.current[memberId])
    saveTimers.current[memberId] = setTimeout(() => {
      fetch(`/api/admin?key=${coachKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, notes: value }),
      })
    }, 800)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#263746] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[#7A8FA3]">Loading member data...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
      <div className="bg-white rounded-xl border border-[#D8E4EC] p-10 text-center max-w-sm">
        <AlertCircle size={32} className="text-[#FF5E5B] mx-auto mb-3" />
        <p className="text-[#263746] font-semibold mb-1">Access Denied</p>
        <p className="text-sm text-[#7A8FA3]">{error}</p>
      </div>
    </div>
  )

  const coaches = [...new Set(members.map(m => m.coach).filter(Boolean))].sort()

  function setCoach(val) {
    setCoachFilter(val)
    localStorage.setItem('coach-dashboard-filter', val)
  }

  const filtered = members
    .filter(m =>
      (!coachFilter || m.coach === coachFilter) &&
      (!search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        (m.targetRole || '').toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sort === 'lastActive') return (daysSince(a.lastActive) ?? 999) - (daysSince(b.lastActive) ?? 999)
      if (sort === 'apps') return b.totalApps - a.totalApps
      if (sort === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  const activeThisWeek = members.filter(m => daysSince(m.lastActive) !== null && daysSince(m.lastActive) <= 7).length
  const atRisk = members.filter(m => daysSince(m.lastActive) === null || daysSince(m.lastActive) >= 14)
  const amber = members.filter(m => daysSince(m.lastActive) !== null && daysSince(m.lastActive) >= 7 && daysSince(m.lastActive) < 14)
  const totalApps = members.reduce((s, m) => s + m.totalApps, 0)
  const totalOffers = members.reduce((s, m) => s + m.offers, 0)

  const needsAttention = members.filter(m => {
    const d = daysSince(m.lastActive)
    return d === null || d >= 7
  }).sort((a, b) => (daysSince(b.lastActive) ?? 999) - (daysSince(a.lastActive) ?? 999))

  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      {/* Header */}
      <header className="bg-[#263746] sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center">
              <Users size={16} className="text-[#263746]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm font-['Inter'] leading-tight">CAP Program</p>
              <p className="text-white/50 text-xs">Coach Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/50 bg-white/10 px-3 py-1 rounded-full">{members.length} members enrolled</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Members', value: members.length, icon: Users, bg: 'bg-[#263746]', text: 'text-white', sub: 'Enrolled in CAP' },
            { label: 'Active This Week', value: activeThisWeek, icon: CheckCircle, bg: 'bg-emerald-600', text: 'text-white', sub: 'Engaged in last 7 days' },
            { label: 'Total Applications', value: totalApps, icon: Briefcase, bg: 'bg-[#6D99F2]', text: 'text-white', sub: 'Submitted across cohort' },
            { label: 'Needs Attention', value: needsAttention.length, icon: AlertCircle, bg: 'bg-[#FF5E5B]', text: 'text-white', sub: '7+ days since last activity' },
          ].map(({ label, value, icon: Icon, bg, text, sub }) => (
            <div key={label} className={`${bg} rounded-xl p-5 shadow-sm`}>
              <div className="flex items-start justify-between mb-3">
                <Icon size={20} className={`${text} opacity-80`} />
              </div>
              <div className={`text-4xl font-bold ${text} mb-1 font-['Inter']`}>{value}</div>
              <div className={`text-xs font-bold ${text} opacity-90 mb-0.5`}>{label}</div>
              <div className={`text-xs ${text} opacity-50`}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <div className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden shadow-sm">
            <SectionHeader title="⚠ Members Needing Attention" subtitle="7+ days since last engagement — consider reaching out" gold />
            <div className="divide-y divide-[#EEF3FA]">
              {needsAttention.map(m => {
                const days = daysSince(m.lastActive)
                const isRed = days === null || days >= 14
                return (
                  <div key={m.id} className={`px-5 py-4 flex items-center justify-between gap-4 ${isRed ? 'bg-red-50/40' : 'bg-amber-50/40'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isRed ? 'bg-red-100 text-[#FF5E5B]' : 'bg-amber-100 text-amber-700'}`}>
                        {m.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#263746] truncate">{m.name}</p>
                        <p className="text-xs text-[#7A8FA3] truncate">{m.targetRole || m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <RiskBadge days={days} />
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-[#7A8FA3]">Apps</p>
                        <p className="text-sm font-bold text-[#263746]">{m.totalApps}</p>
                      </div>
                      <a
                        href={`https://pycaptracker.netlify.app?uid=${m.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[#6D99F2] hover:underline"
                      >
                        View <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[#D8E4EC] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-[#D4AF37]" />
              <span className="text-xs font-bold text-[#263746] uppercase tracking-wide">Offers Received</span>
            </div>
            <p className="text-3xl font-bold text-[#263746] font-['Inter']">{totalOffers}</p>
            <p className="text-xs text-[#7A8FA3] mt-1">Across all members</p>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E4EC] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-amber-500" />
              <span className="text-xs font-bold text-[#263746] uppercase tracking-wide">Amber Zone</span>
            </div>
            <p className="text-3xl font-bold text-[#263746] font-['Inter']">{amber.length}</p>
            <p className="text-xs text-[#7A8FA3] mt-1">7–13 days inactive</p>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E4EC] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Award size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-[#263746] uppercase tracking-wide">Check-ins Done</span>
            </div>
            <p className="text-3xl font-bold text-[#263746] font-['Inter']">{members.reduce((s, m) => s + m.checkinsSubmitted, 0)}</p>
            <p className="text-xs text-[#7A8FA3] mt-1">Weekly check-ins submitted</p>
          </div>
        </div>

        {/* All Members */}
        <div className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden shadow-sm">
          <SectionHeader title="All Members" subtitle="Full cohort overview" />

          {/* Search + Sort */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#EEF3FA] flex-wrap bg-[#F8F5F2]">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA3]" />
              <input
                className="w-full bg-white border border-[#D8E4EC] rounded-lg pl-8 pr-3 py-2 text-sm text-[#263746] placeholder:text-[#7A8FA3] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                placeholder="Search by name, email or role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {coaches.length > 0 && (
              <select
                className="bg-white border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 cursor-pointer"
                value={coachFilter}
                onChange={e => setCoach(e.target.value)}
              >
                <option value="">All coaches</option>
                {coaches.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <div className="flex gap-2">
              {[['lastActive', 'Last Active'], ['apps', 'Most Apps'], ['name', 'A–Z']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setSort(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${sort === val ? 'bg-[#263746] text-white' : 'bg-white border border-[#D8E4EC] text-[#4A5C6B] hover:bg-[#EEF3FA]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Member Rows */}
          <div className="divide-y divide-[#EEF3FA]">
            {filtered.map(m => {
              const days = daysSince(m.lastActive)
              const risk = getRisk(days)
              const isExpanded = expandedMember === m.id
              const rowBg = risk === 'red' ? 'bg-red-50/20' : risk === 'amber' ? 'bg-amber-50/20' : ''

              return (
                <div key={m.id} className={rowBg}>
                  {/* Main Row */}
                  <div
                    className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-[#F5F9FD] transition-colors"
                    onClick={() => setExpandedMember(isExpanded ? null : m.id)}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#EEF3FA] flex items-center justify-center text-sm font-bold text-[#263746] flex-shrink-0">
                      {m.name.charAt(0)}
                    </div>

                    {/* Name + role */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#263746] truncate">{m.name}</p>
                      <p className="text-xs text-[#7A8FA3] truncate">
                        {m.targetRole || m.email}
                        {m.coach && !coachFilter && <span className="ml-2 text-[#D4AF37] font-medium">· {m.coach}</span>}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-center flex-shrink-0">
                      {[
                        { label: 'Apps', value: m.totalApps },
                        { label: 'Interviews', value: m.interviews },
                        { label: 'Offers', value: m.offers },
                        { label: 'Networking', value: m.networking },
                        { label: 'Check-ins', value: m.checkinsSubmitted },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-[#7A8FA3]">{label}</p>
                          <p className="text-sm font-bold text-[#263746]">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Risk badge */}
                    <div className="flex-shrink-0">
                      <RiskBadge days={days} />
                    </div>

                    {/* Expand chevron */}
                    <div className="flex-shrink-0 text-[#7A8FA3]">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Expanded Panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 bg-[#F8F5F2] border-t border-[#EEF3FA]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">

                        {/* Stats Grid */}
                        <div>
                          <p className="text-xs font-bold text-[#263746] uppercase tracking-wide mb-3">Activity Breakdown</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: 'Applications', value: m.totalApps, color: 'bg-[#EEF3FA] text-[#6D99F2]' },
                              { label: 'Interviews', value: m.interviews, color: 'bg-emerald-50 text-emerald-700' },
                              { label: 'Offers', value: m.offers, color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
                              { label: 'Networking', value: m.networking, color: 'bg-[#EEF3FA] text-[#4A5C6B]' },
                              { label: 'Check-ins', value: m.checkinsSubmitted, color: 'bg-emerald-50 text-emerald-700' },
                            ].map(({ label, value, color }) => (
                              <div key={label} className={`${color} rounded-lg p-3 text-center`}>
                                <p className="text-lg font-bold">{value}</p>
                                <p className="text-xs opacity-80">{label}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <a
                              href={`https://pycaptracker.netlify.app?uid=${m.token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#263746] hover:bg-[#1a2733] px-3 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                              Open Full Tracker <ExternalLink size={11} />
                            </a>
                          </div>
                        </div>

                        {/* Coach Notes */}
                        <div>
                          <p className="text-xs font-bold text-[#263746] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <StickyNote size={13} className="text-[#D4AF37]" />
                            Private Coach Notes
                          </p>
                          <textarea
                            className="w-full border border-[#D8E4EC] rounded-lg px-3 py-2.5 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 bg-white placeholder:text-[#7A8FA3] resize-none"
                            rows={4}
                            value={notesDraft[m.id] || ''}
                            onChange={e => updateNotes(m.id, e.target.value)}
                            placeholder="Add private notes about this member — not visible to them..."
                          />
                          <p className="text-xs text-[#7A8FA3] mt-1">Confidential · Saves automatically</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-sm text-[#7A8FA3] py-10">No members found</p>
          )}
        </div>

      </main>
    </div>
  )
}
