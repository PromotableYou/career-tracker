import { useState, useEffect, useRef } from 'react'
import { Users, Briefcase, TrendingUp, Calendar, AlertCircle, CheckCircle, Clock, ExternalLink, Search, ChevronDown, StickyNote } from 'lucide-react'

function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

function ActivityBadge({ days }) {
  if (days === null) return <span className="text-xs text-[#7A8FA3]">Never</span>
  if (days === 0) return <span className="text-xs font-medium text-emerald-600">Today</span>
  if (days <= 3) return <span className="text-xs font-medium text-emerald-600">{days}d ago</span>
  if (days <= 7) return <span className="text-xs font-medium text-amber-500">{days}d ago</span>
  return <span className="text-xs font-medium text-[#FF5E5B]">{days}d ago</span>
}

export default function CoachDashboard({ coachKey }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('lastActive')
  const [notesOpen, setNotesOpen] = useState(null)
  const [notesDraft, setNotesDraft] = useState({})
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
      <div className="text-center">
        <p className="text-[#FF5E5B] font-semibold mb-2">Access denied</p>
        <p className="text-sm text-[#7A8FA3]">{error}</p>
      </div>
    </div>
  )

  const filtered = members
    .filter(m =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.targetRole || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'lastActive') return daysSince(a.lastActive) ?? 999 - (daysSince(b.lastActive) ?? 999)
      if (sort === 'apps') return b.totalApps - a.totalApps
      if (sort === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  const activeThisWeek = members.filter(m => daysSince(m.lastActive) !== null && daysSince(m.lastActive) <= 7).length
  const inactive = members.filter(m => daysSince(m.lastActive) === null || daysSince(m.lastActive) > 14).length
  const totalApps = members.reduce((s, m) => s + m.totalApps, 0)
  const totalInterviews = members.reduce((s, m) => s + m.interviews, 0)

  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      <header className="bg-white border-b border-[#D8E4EC] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg text-[#263746] font-semibold font-['Inter']">Coach Dashboard</span>
          <span className="text-sm text-[#7A8FA3]">{members.length} members</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total members', value: members.length, icon: Users, color: 'text-[#263746]', bg: 'bg-[#EEF3FA]' },
            { label: 'Active this week', value: activeThisWeek, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total applications', value: totalApps, icon: Briefcase, color: 'text-[#6D99F2]', bg: 'bg-[#EEF3FA]' },
            { label: 'Inactive 14+ days', value: inactive, icon: AlertCircle, color: 'text-[#FF5E5B]', bg: 'bg-red-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl p-5 border border-[#D8E4EC]">
              <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <div className="text-3xl font-bold text-[#263746] mb-1 font-['Inter']">{value}</div>
              <div className="text-xs font-semibold text-[#263746]">{label}</div>
            </div>
          ))}
        </div>

        {/* Search + sort */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA3]" />
            <input
              className="w-full bg-white border border-[#D8E4EC] rounded-lg pl-8 pr-3 py-2 text-sm text-[#263746] placeholder:text-[#7A8FA3] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40"
              placeholder="Search members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {[['lastActive','Last active'],['apps','Most apps'],['name','Name']].map(([val, label]) => (
              <button key={val} onClick={() => setSort(val)} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${sort === val ? 'bg-[#263746] text-white' : 'bg-white border border-[#D8E4EC] text-[#4A5C6B] hover:bg-[#F5F9FD]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Member table */}
        <div className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F8F5F2] border-b border-[#D8E4EC]">
                <tr>
                  {['Member','Target Role','Last Active','Apps','Interviews','Offers','Networking','Check-ins','Notes',''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#4A5C6B] px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const days = daysSince(m.lastActive)
                  const rowBg = days !== null && days > 14 ? 'bg-red-50/30' : ''
                  return (
                    <>
                    <tr key={m.id} className={`border-b border-[#EEF3FA] last:border-0 hover:bg-[#F5F9FD] ${rowBg}`}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-[#263746]">{m.name}</p>
                        <p className="text-xs text-[#7A8FA3]">{m.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#4A5C6B]">{m.targetRole || <span className="text-[#D8E4EC]">—</span>}</td>
                      <td className="px-4 py-3"><ActivityBadge days={days} /></td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#263746]">{m.totalApps}</td>
                      <td className="px-4 py-3 text-sm text-[#4A5C6B]">{m.interviews}</td>
                      <td className="px-4 py-3 text-sm text-[#4A5C6B]">{m.offers}</td>
                      <td className="px-4 py-3 text-sm text-[#4A5C6B]">{m.networking}</td>
                      <td className="px-4 py-3 text-sm text-[#4A5C6B]">{m.checkinsSubmitted}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setNotesOpen(notesOpen === m.id ? null : m.id)}
                          className={`flex items-center gap-1 text-xs cursor-pointer transition-colors ${notesDraft[m.id] ? 'text-[#D4AF37]' : 'text-[#D8E4EC] hover:text-[#7A8FA3]'}`}
                        >
                          <StickyNote size={14} />
                          {notesDraft[m.id] ? 'View' : 'Add'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://pycaptracker.netlify.app?uid=${m.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[#6D99F2] hover:underline cursor-pointer"
                        >
                          View <ExternalLink size={11} />
                        </a>
                      </td>
                    </tr>
                    {notesOpen === m.id && (
                      <tr key={`${m.id}-notes`} className="bg-amber-50/50 border-b border-[#EEF3FA]">
                        <td colSpan={10} className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <StickyNote size={14} className="text-[#D4AF37] mt-2 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-[#4A5C6B] mb-1">Coach notes — private, not visible to member</p>
                              <textarea
                                className="w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 bg-white placeholder:text-[#7A8FA3] resize-none"
                                rows={3}
                                value={notesDraft[m.id] || ''}
                                onChange={e => updateNotes(m.id, e.target.value)}
                                placeholder="Add private notes about this member..."
                              />
                              <p className="text-xs text-[#7A8FA3] mt-1">Saves automatically</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-[#7A8FA3] py-8">No members found</p>
          )}
        </div>
      </main>
    </div>
  )
}
