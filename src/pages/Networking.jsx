import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Trash2, ChevronDown, ChevronUp, MapPin } from 'lucide-react'

const TYPE_OPTIONS = ['','Peer','Mentor','Recruiter','Hiring Manager','Alumni','Former colleague','Industry contact','LinkedIn connection','Other']
const DEPTH_OPTIONS = ['','Weak tie','Acquaintance','Established','Strong']
const NETWORK_AREAS = ['','Target company','Target industry','Target role','General career','Alumni network','Other']
const WHERE_MET_OPTIONS = ['','LinkedIn','In-person event','Conference','Mutual introduction','Alumni network','Workplace','Online community','Other']
const STATUS_OPTIONS = ['Active','Inactive']

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"
const labelCls = "block text-xs font-semibold text-[#4A5C6B] mb-1"

function newContact() {
  return {
    id: Date.now(), person: '', role: '', contact: '',
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

export default function Networking() {
  const { data, update } = useData()
  const contacts = data.networking || []
  const [expanded, setExpanded] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')

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

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Networking</h2>
          <p className="text-sm text-[#5A7080] italic font-['Playfair_Display']">Your network map. Who you know, how you know them, relationship depth.</p>
          <p className="text-xs text-[#A8BCC8] mt-1.5">No required fields — use as much or as little as works for you. The more detail you add, the better your results.</p>
        </div>
        <button onClick={add} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
          <Plus size={16} /> Add contact
        </button>
      </div>

      {/* Status filter */}
      {contacts.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          {['All', 'Active', 'Inactive'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${statusFilter === f ? 'bg-[#263746] text-white' : 'bg-white border border-[#D8E4EC] text-[#4A5C6B] hover:bg-[#EEF3FA]'}`}
            >{f}</button>
          ))}
          <span className="text-xs text-[#7A8FA3] ml-2">
            {contacts.filter(c => statusFilter === 'All' || (c.status || 'Active') === statusFilter).length} contact{contacts.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {contacts.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] p-12 text-center">
          <div className="text-4xl mb-3">🤝</div>
          <p className="text-[#7A8FA3] text-sm">No contacts yet. Start building your network map.</p>
        </div>
      )}

      <div className="space-y-3">
        {contacts.filter(c => statusFilter === 'All' || (c.status || 'Active') === statusFilter).map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden">
            {/* Card header */}
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#F5F9FD] transition-colors"
              onClick={() => toggle(c.id)}
            >
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
                    {[c.role, c.area].filter(Boolean).join(' · ') || 'No details yet'}
                    {c.location && <span className="flex items-center gap-0.5 ml-1"><MapPin size={9} />{c.location}</span>}
                  </p>
                </div>
                {c.depth && (
                  <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${DEPTH_COLORS[c.depth] || 'bg-gray-100 text-gray-600'}`}>
                    {c.depth}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                {c.lastContact && (
                  <span className="hidden md:block text-xs text-[#7A8FA3]">Last: {new Date(c.lastContact).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); remove(c.id) }}
                  className="text-[#D8E4EC] hover:text-[#FF5E5B] transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
                {expanded === c.id ? <ChevronUp size={16} className="text-[#7A8FA3]" /> : <ChevronDown size={16} className="text-[#7A8FA3]" />}
              </div>
            </div>

            {/* Expanded form */}
            {expanded === c.id && (
              <div className="px-5 pb-5 border-t border-[#EEF3FA]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className={labelCls}>Name</label>
                    <input className={inputCls} value={c.person} onChange={e => upd(c.id,'person',e.target.value)} placeholder="Full name" />
                  </div>
                  <div>
                    <label className={labelCls}>Their Role</label>
                    <input className={inputCls} value={c.role} onChange={e => upd(c.id,'role',e.target.value)} placeholder="Job title / company" />
                  </div>
                  <div>
                    <label className={labelCls}>Contact Details</label>
                    <input className={inputCls} value={c.contact} onChange={e => upd(c.id,'contact',e.target.value)} placeholder="LinkedIn / email" />
                  </div>
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
                  <div>
                    <label className={labelCls}>Introduced By</label>
                    <input className={inputCls} value={c.introducedBy || ''} onChange={e => upd(c.id,'introducedBy',e.target.value)} placeholder="Who made the introduction?" />
                  </div>
                  <div>
                    <label className={labelCls}>Location</label>
                    <input className={inputCls} value={c.location || ''} onChange={e => upd(c.id,'location',e.target.value)} placeholder="e.g. Sydney, Remote, Melbourne" />
                  </div>
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
                  <div>
                    <label className={labelCls}>Last Contact</label>
                    <input className={inputCls} type="date" value={c.lastContact} onChange={e => upd(c.id,'lastContact',e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Leverage Area</label>
                    <input className={inputCls} value={c.leverage} onChange={e => upd(c.id,'leverage',e.target.value)} placeholder="How they can help" />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className={labelCls}>Strategy / Next Step</label>
                    <input className={inputCls} value={c.strategy} onChange={e => upd(c.id,'strategy',e.target.value)} placeholder="What's your next move with this person?" />
                  </div>
                </div>

                {/* Touchpoint history */}
                <div className="mt-4 pt-4 border-t border-[#EEF3FA]">
                  <div className="flex items-center justify-between mb-3">
                    <label className={labelCls}>Contact History</label>
                    <button
                      onClick={() => addTouchpoint(c.id)}
                      className="flex items-center gap-1 text-xs text-[#6D99F2] hover:text-[#263746] cursor-pointer font-medium transition-colors"
                    >
                      <Plus size={12} /> Log touchpoint
                    </button>
                  </div>
                  {(c.touchpoints || []).length === 0 ? (
                    <p className="text-xs text-[#7A8FA3] italic">No touchpoints logged yet. Use this to track every meaningful interaction.</p>
                  ) : (
                    <div className="space-y-2">
                      {[...(c.touchpoints || [])].sort((a, b) => b.date.localeCompare(a.date)).map(tp => (
                        <div key={tp.id} className="flex gap-3 items-center bg-[#F8F5F2] rounded-lg px-3 py-2">
                          <input
                            className="border border-[#D8E4EC] rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#6D99F2]/40 flex-shrink-0"
                            type="date"
                            value={tp.date}
                            onChange={e => updateTouchpoint(c.id, tp.id, 'date', e.target.value)}
                          />
                          <input
                            className="flex-1 bg-transparent text-xs text-[#263746] focus:outline-none border-b border-dashed border-[#D8E4EC] focus:border-[#6D99F2] placeholder:text-[#7A8FA3]"
                            value={tp.note}
                            onChange={e => updateTouchpoint(c.id, tp.id, 'note', e.target.value)}
                            placeholder="What happened? Next steps?"
                          />
                          <button
                            onClick={() => removeTouchpoint(c.id, tp.id)}
                            className="text-[#D8E4EC] hover:text-[#FF5E5B] transition-colors cursor-pointer flex-shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {contacts.length > 0 && (
        <div className="mt-4 flex justify-between items-center text-xs text-[#7A8FA3]">
          <span>{contacts.filter(c => statusFilter === 'All' || (c.status || 'Active') === statusFilter).length} of {contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
          <button onClick={add} className="text-[#6D99F2] hover:underline cursor-pointer">+ Add contact</button>
        </div>
      )}
    </div>
  )
}
