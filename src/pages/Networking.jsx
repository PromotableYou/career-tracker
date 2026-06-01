import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Trash2, ChevronDown, ChevronUp, MapPin, Copy, Search } from 'lucide-react'

const TYPE_OPTIONS = ['','Peer','Mentor','Recruiter','Hiring Manager','Alumni','Former colleague','Industry contact','LinkedIn connection','Other']
const DEPTH_OPTIONS = ['','Weak tie','Acquaintance','Established','Strong']
const NETWORK_AREAS = ['','Target company','Target industry','Target role','General career','Alumni network','Other']
const WHERE_MET_OPTIONS = ['','LinkedIn','In-person event','Conference','Mutual introduction','Alumni network','Workplace','Online community','Other']
const STATUS_OPTIONS = ['Active','Inactive']

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"
const labelCls = "block text-xs font-semibold text-[#4A5C6B] mb-1"

function newContact() {
  return {
    id: Date.now(), person: '', role: '', company: '', contact: '',
    area: '', type: '', depth: '', leverage: '', strategy: '',
    lastContact: '', touchpoints: [],
    introducedBy: '', whereMet: '', location: '', status: 'Active'
  }
}

const DEPTH_COLORS = {
  'Weak tie': 'bg-gray-100 text-gray-600',
  'Acquaintance': 'bg-yellow-100 text-yellow-700',
  'Established': 'bg-blue-100 text-blue-700',
  'Strong': 'bg-emerald-100 text-emerald-700',
}

function TemplateCard({ title, body }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="bg-white border border-[#E4EDF5] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-[#263746]">{title}</p>
        <button
          onClick={copy}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-[#EEF3FA] text-[#6D99F2] hover:bg-[#263746] hover:text-white'}`}
        >
          <Copy size={11} />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-[#7A8FA3] leading-relaxed whitespace-pre-line">{body}</p>
    </div>
  )
}

export default function Networking() {
  const { data, update } = useData()
  const contacts = data.networking || []
  const [expanded, setExpanded] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [showTemplates, setShowTemplates] = useState(false)
  const [search, setSearch] = useState('')
  const [groupByCompany, setGroupByCompany] = useState(false)

  function set(next) { update('networking', next) }
  function add() {
    const c = newContact()
    set([...contacts, c])
    setExpanded(c.id)
  }
  function remove(id) { set(contacts.filter(c => c.id !== id)) }
  function upd(id, field, value) { set(contacts.map(c => c.id === id ? { ...c, [field]: value } : c)) }
  function toggle(id) { setExpanded(expanded === id ? null : id) }
  function addTouchpoint(contactId) {
    const today = new Date().toISOString().slice(0, 10)
    const tp = { id: Date.now(), date: today, note: '' }
    set(contacts.map(c => {
      if (c.id !== contactId) return c
      const touchpoints = [...(c.touchpoints || []), tp]
      const lastContact = c.lastContact && c.lastContact >= today ? c.lastContact : today
      return { ...c, touchpoints, lastContact }
    }))
  }
  function updateTouchpoint(contactId, tpId, field, value) {
    set(contacts.map(c => c.id !== contactId ? c : {
      ...c, touchpoints: (c.touchpoints || []).map(tp => tp.id === tpId ? { ...tp, [field]: value } : tp)
    }))
  }
  function removeTouchpoint(contactId, tpId) {
    set(contacts.map(c => c.id !== contactId ? c : {
      ...c, touchpoints: (c.touchpoints || []).filter(tp => tp.id !== tpId)
    }))
  }

  function renderContact(c) {
    return (
      <div key={c.id} className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#F5F9FD] transition-colors" onClick={() => toggle(c.id)}>
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#EEF3FA] flex items-center justify-center text-sm font-bold text-[#6D99F2] flex-shrink-0">
              {c.person ? c.person.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#263746] truncate">{c.person || 'New contact'}</p>
                {(c.status || 'Active') === 'Inactive' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium flex-shrink-0">Inactive</span>
                )}
              </div>
              <p className="text-xs text-[#7A8FA3] truncate flex items-center gap-1">
                {[c.role, c.company, c.area].filter(Boolean).join(' · ') || 'No details yet'}
                {c.location && <span className="flex items-center gap-0.5 ml-1"><MapPin size={9} />{c.location}</span>}
              </p>
            </div>
            {c.depth && (
              <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${DEPTH_COLORS[c.depth] || 'bg-gray-100 text-gray-600'}`}>{c.depth}</span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
            {c.lastContact && (
              <span className="hidden md:block text-xs text-[#7A8FA3]">Last: {new Date(c.lastContact).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
            )}
            <button onClick={e => { e.stopPropagation(); remove(c.id) }} className="text-[#D8E4EC] hover:text-[#FF5E5B] transition-colors cursor-pointer"><Trash2 size={15} /></button>
            {expanded === c.id ? <ChevronUp size={16} className="text-[#7A8FA3]" /> : <ChevronDown size={16} className="text-[#7A8FA3]" />}
          </div>
        </div>

        {expanded === c.id && (
          <div className="px-5 pb-5 border-t border-[#EEF3FA]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div><label className={labelCls}>Name</label><input className={inputCls} value={c.person} onChange={e => upd(c.id,'person',e.target.value)} placeholder="Full name" /></div>
              <div><label className={labelCls}>Their Role</label><input className={inputCls} value={c.role} onChange={e => upd(c.id,'role',e.target.value)} placeholder="Job title" /></div>
              <div><label className={labelCls}>Company</label><input className={inputCls} value={c.company || ''} onChange={e => upd(c.id,'company',e.target.value)} placeholder="Where they work" /></div>
              <div><label className={labelCls}>Contact Details</label><input className={inputCls} value={c.contact} onChange={e => upd(c.id,'contact',e.target.value)} placeholder="LinkedIn / email" /></div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={c.status || 'Active'} onChange={e => upd(c.id,'status',e.target.value)}>
                  {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Where We Met</label>
                <select className={inputCls} value={c.whereMet || ''} onChange={e => upd(c.id,'whereMet',e.target.value)}>
                  {WHERE_MET_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Introduced By</label><input className={inputCls} value={c.introducedBy || ''} onChange={e => upd(c.id,'introducedBy',e.target.value)} placeholder="Who made the introduction?" /></div>
              <div><label className={labelCls}>Location</label><input className={inputCls} value={c.location || ''} onChange={e => upd(c.id,'location',e.target.value)} placeholder="e.g. Sydney, Remote, Melbourne" /></div>
              <div>
                <label className={labelCls}>Network Area</label>
                <select className={inputCls} value={c.area} onChange={e => upd(c.id,'area',e.target.value)}>
                  {NETWORK_AREAS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Contact Type</label>
                <select className={inputCls} value={c.type} onChange={e => upd(c.id,'type',e.target.value)}>
                  {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Relationship Depth</label>
                <select className={inputCls} value={c.depth} onChange={e => upd(c.id,'depth',e.target.value)}>
                  {DEPTH_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Last Contact</label><input className={inputCls} type="date" value={c.lastContact} onChange={e => upd(c.id,'lastContact',e.target.value)} /></div>
              <div><label className={labelCls}>Leverage Area</label><input className={inputCls} value={c.leverage} onChange={e => upd(c.id,'leverage',e.target.value)} placeholder="How they can help" /></div>
              <div className="sm:col-span-2 lg:col-span-3"><label className={labelCls}>Strategy / Next Step</label><input className={inputCls} value={c.strategy} onChange={e => upd(c.id,'strategy',e.target.value)} placeholder="What's your next move with this person?" /></div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#EEF3FA]">
              <div className="flex items-center justify-between mb-3">
                <label className={labelCls}>Contact History</label>
                <button onClick={() => addTouchpoint(c.id)} className="flex items-center gap-1 text-xs text-[#6D99F2] hover:text-[#263746] cursor-pointer font-medium transition-colors"><Plus size={12} /> Log touchpoint</button>
              </div>
              {(c.touchpoints || []).length === 0 ? (
                <p className="text-xs text-[#7A8FA3] italic">No touchpoints logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {[...(c.touchpoints || [])].sort((a, b) => b.date.localeCompare(a.date)).map(tp => (
                    <div key={tp.id} className="flex gap-3 items-center bg-[#F8F5F2] rounded-lg px-3 py-2">
                      <input className="border border-[#D8E4EC] rounded px-2 py-1 text-xs bg-white focus:outline-none flex-shrink-0" type="date" value={tp.date} onChange={e => updateTouchpoint(c.id, tp.id, 'date', e.target.value)} />
                      <input className="flex-1 bg-transparent text-xs text-[#263746] focus:outline-none border-b border-dashed border-[#D8E4EC] focus:border-[#6D99F2] placeholder:text-[#7A8FA3]" value={tp.note} onChange={e => updateTouchpoint(c.id, tp.id, 'note', e.target.value)} placeholder="What happened? Next steps?" />
                      <button onClick={() => removeTouchpoint(c.id, tp.id)} className="text-[#D8E4EC] hover:text-[#FF5E5B] transition-colors cursor-pointer flex-shrink-0"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Networking</h2>
          <p className="text-sm text-[#7A8FA3]">Your network map. Who you know, how you know them, relationship depth.</p>
        </div>
        <button onClick={add} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
          <Plus size={16} /> Add contact
        </button>
      </div>

      {/* Filter bar */}
      {contacts.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA3]" />
            <input
              className="w-full border border-[#D8E4EC] rounded-lg pl-8 pr-3 py-2 text-xs text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"
              placeholder="Search by name, role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5">
            {['All', 'Active', 'Inactive'].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${statusFilter === f ? 'bg-[#263746] text-white' : 'bg-white border border-[#D8E4EC] text-[#4A5C6B] hover:bg-[#EEF3FA]'}`}
              >{f}</button>
            ))}
          </div>
          <button
            onClick={() => setGroupByCompany(g => !g)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border ${groupByCompany ? 'bg-[#263746] text-white border-[#263746]' : 'bg-white border-[#D8E4EC] text-[#4A5C6B] hover:bg-[#EEF3FA]'}`}
          >Group by company</button>
        </div>
      )}

      {contacts.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] p-10 text-center mb-6">
          <div className="text-4xl mb-3">🤝</div>
          <p className="text-[#263746] font-semibold text-base mb-2">Start your network map</p>
          <p className="text-[#7A8FA3] text-sm max-w-md mx-auto leading-relaxed">Add hiring managers, recruiters, alumni, colleagues, and anyone who can open doors. Even a weak tie can lead to your next role.</p>
          <button onClick={add} className="mt-5 inline-flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-colors">
            <Plus size={16} /> Add your first contact
          </button>
        </div>
      )}

      {(() => {
        const filtered = contacts.filter(c => {
          const matchStatus = statusFilter === 'All' || (c.status || 'Active') === statusFilter
          if (!matchStatus) return false
          if (!search.trim()) return true
          const q = search.toLowerCase()
          return (c.person || '').toLowerCase().includes(q) || (c.role || '').toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q) || (c.area || '').toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q)
        })

        if (groupByCompany) {
          const groups = {}
          filtered.forEach(c => { const key = c.company || '(No company)'; if (!groups[key]) groups[key] = []; groups[key].push(c) })
          const sortedGroups = Object.entries(groups).sort((a, b) => {
            if (a[0] === '(No company)') return 1
            if (b[0] === '(No company)') return -1
            return a[0].localeCompare(b[0])
          })
          return (
            <div className="space-y-6">
              {sortedGroups.map(([company, members]) => (
                <div key={company}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#263746] bg-[#EEF3FA] px-3 py-1 rounded-full">{company}</span>
                    <span className="text-xs text-[#7A8FA3]">{members.length} contact{members.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2 pl-2 border-l-2 border-[#EEF3FA]">
                    {members.map(c => renderContact(c))}
                  </div>
                </div>
              ))}
            </div>
          )
        }

        return (
      <div className="space-y-3">
        {filtered.map(c => renderContact(c))}
      </div>
        )
      })()}


      {contacts.length > 0 && (
        <div className="mt-4 flex justify-between items-center text-xs text-[#7A8FA3]">
          <span>{contacts.filter(c => {
            const ms = statusFilter === 'All' || (c.status || 'Active') === statusFilter
            if (!ms) return false
            if (!search.trim()) return true
            const q = search.toLowerCase()
            return (c.person||'').toLowerCase().includes(q)||(c.role||'').toLowerCase().includes(q)||(c.company||'').toLowerCase().includes(q)
          }).length} of {contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
          <button onClick={add} className="text-[#6D99F2] hover:underline cursor-pointer">+ Add contact</button>
        </div>
      )}

      {/* Message Templates */}
      <div className="mt-8">
        <button
          onClick={() => setShowTemplates(t => !t)}
          className="flex items-center gap-2 text-sm font-semibold text-[#263746] mb-4 cursor-pointer"
        >
          <span>💬 Message Templates</span>
          <ChevronDown size={15} className={`text-[#7A8FA3] transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
        </button>
        {showTemplates && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: 'Cold connection request',
                body: `Hi [Name],\n\nI came across your profile while researching [Company/Industry]. I'm currently exploring opportunities in [Target Role] and would love to connect with someone who has experience in [their area].\n\nWould you be open to a brief virtual coffee or a quick message exchange?\n\nThanks,\n[Your Name]`,
              },
              {
                title: 'Connection via mutual contact',
                body: `Hi [Name],\n\n[Mutual Contact] suggested I reach out — they spoke highly of your work at [Company].\n\nI'm actively exploring opportunities in [Target Role] and would value your perspective. Would you be open to a 15-minute conversation?\n\nBest,\n[Your Name]`,
              },
              {
                title: 'Follow-up after connecting',
                body: `Hi [Name],\n\nThank you for connecting! I really appreciated the chance to [mention what you discussed or why you connected].\n\nAs I mentioned, I'm looking for opportunities in [Target Role]. If you hear of anything or know someone I should speak with, I'd really appreciate an introduction.\n\nThanks again,\n[Your Name]`,
              },
              {
                title: 'Informational interview request',
                body: `Hi [Name],\n\nI'm currently in job search mode for [Target Role] roles and have been following your work at [Company] with great interest.\n\nWould you be open to a 20-minute virtual coffee? I'd love to hear about your experience and get your advice on breaking into [field/company/industry].\n\nNo obligation at all — I'd just really value your perspective.\n\nThanks,\n[Your Name]`,
              },
              {
                title: 'Thank you after a call',
                body: `Hi [Name],\n\nThank you so much for taking the time to speak with me today. The conversation was genuinely helpful — especially your thoughts on [specific topic they mentioned].\n\nI'll take your advice about [specific advice] and will be in touch if any opportunities come up that feel like a fit.\n\nReally grateful for your generosity with your time.\n\n[Your Name]`,
              },
              {
                title: 'Checking in (no response)',
                body: `Hi [Name],\n\nI just wanted to follow up on my message from [timeframe]. I know you're busy, so no pressure at all — I just wanted to make sure it didn't get lost in the shuffle.\n\nWould love to connect if you have a moment.\n\nThanks,\n[Your Name]`,
              },
            ].map(({ title, body }) => (
              <TemplateCard key={title} title={title} body={body} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
