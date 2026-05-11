import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react'

const CHECKLIST_ITEMS = [
  { key: 'headline', label: 'Headline aligned with target role' },
  { key: 'about', label: 'About section includes hook' },
  { key: 'experience', label: 'Experience bullets are outcome-driven' },
  { key: 'skills', label: 'Skills match target role' },
  { key: 'recommendations', label: 'Recommendations requested' },
  { key: 'activity', label: 'Activity consistent' },
  { key: 'connections', label: 'Connections growing' },
  { key: 'endorsements', label: 'Endorsements up-to-date' },
  { key: 'photo', label: 'Profile photo professional' },
  { key: 'url', label: 'Custom URL optimised' },
]

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"
const labelCls = "block text-xs font-semibold text-[#4A5C6B] mb-1"

const RESPONSE_COLORS = {
  'Positive': 'bg-emerald-100 text-emerald-700',
  'No response': 'bg-gray-100 text-gray-600',
  'Not interested': 'bg-red-100 text-red-600',
  'Connected': 'bg-blue-100 text-blue-700',
}

function newOutreach() {
  return { id: Date.now(), person: '', company: '', role: '', dateConnected: '', message: '', response: '', followUp: '', notes: '' }
}

export default function LinkedIn() {
  const { data, updateNested, update } = useData()
  const checklist = data.linkedinChecklist || {}
  const outreach = data.linkedinOutreach || []
  const [expanded, setExpanded] = useState(null)

  const completed = CHECKLIST_ITEMS.filter(i => checklist[i.key]).length
  const pct = Math.round((completed / CHECKLIST_ITEMS.length) * 100)

  function toggleCheck(key) { updateNested('linkedinChecklist', key, !checklist[key]) }

  function setOutreach(next) { update('linkedinOutreach', next) }
  function addOutreach() {
    const o = newOutreach()
    setOutreach([...outreach, o])
    setExpanded(o.id)
  }
  function removeOutreach(id) { setOutreach(outreach.filter(o => o.id !== id)) }
  function updOutreach(id, field, value) { setOutreach(outreach.map(o => o.id === id ? { ...o, [field]: value } : o)) }
  function toggle(id) { setExpanded(expanded === id ? null : id) }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">LinkedIn</h2>
        <p className="text-sm text-[#5A7080] italic font-['Playfair_Display']">Profile checklist and outreach log.</p>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-xl border border-[#D8E4EC] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#263746] font-['Inter']">Profile Checklist</h3>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-[#D8E4EC] rounded-full overflow-hidden">
              <div className="h-full bg-[#6D99F2] rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-[#7A8FA3]">{completed}/{CHECKLIST_ITEMS.length}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CHECKLIST_ITEMS.map(({ key, label }) => (
            <button key={key} onClick={() => toggleCheck(key)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F5F9FD] transition-colors cursor-pointer text-left">
              {checklist[key]
                ? <CheckCircle2 size={18} className="text-[#6D99F2] flex-shrink-0" />
                : <Circle size={18} className="text-[#D8E4EC] flex-shrink-0" />
              }
              <span className={`text-sm ${checklist[key] ? 'line-through text-[#7A8FA3]' : 'text-[#4A5C6B]'}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Outreach log */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-[#263746] font-['Inter']">LinkedIn Outreach Log</h3>
        <button onClick={addOutreach} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
          <Plus size={16} /> Add outreach
        </button>
      </div>

      {outreach.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] p-12 text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-[#7A8FA3] text-sm">No outreach logged yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {outreach.map(o => (
          <div key={o.id} className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden">
            {/* Card header */}
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#F5F9FD] transition-colors"
              onClick={() => toggle(o.id)}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#EEF3FA] flex items-center justify-center text-sm font-bold text-[#6D99F2] flex-shrink-0">
                  {o.person ? o.person.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#263746] truncate">{o.person || 'New outreach'}</p>
                  <p className="text-xs text-[#7A8FA3] truncate">{[o.role, o.company].filter(Boolean).join(' · ') || 'No details yet'}</p>
                </div>
                {o.response && (
                  <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${RESPONSE_COLORS[o.response] || 'bg-gray-100 text-gray-600'}`}>
                    {o.response}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                {o.dateConnected && (
                  <span className="hidden md:block text-xs text-[#7A8FA3]">{new Date(o.dateConnected).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); removeOutreach(o.id) }}
                  className="text-[#D8E4EC] hover:text-[#FF5E5B] transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
                {expanded === o.id ? <ChevronUp size={16} className="text-[#7A8FA3]" /> : <ChevronDown size={16} className="text-[#7A8FA3]" />}
              </div>
            </div>

            {/* Expanded form */}
            {expanded === o.id && (
              <div className="px-5 pb-5 border-t border-[#EEF3FA]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className={labelCls}>Person</label>
                    <input className={inputCls} value={o.person} onChange={e => updOutreach(o.id,'person',e.target.value)} placeholder="Full name" />
                  </div>
                  <div>
                    <label className={labelCls}>Company</label>
                    <input className={inputCls} value={o.company} onChange={e => updOutreach(o.id,'company',e.target.value)} placeholder="Company" />
                  </div>
                  <div>
                    <label className={labelCls}>Their Role</label>
                    <input className={inputCls} value={o.role} onChange={e => updOutreach(o.id,'role',e.target.value)} placeholder="Job title" />
                  </div>
                  <div>
                    <label className={labelCls}>Date Connected</label>
                    <input className={inputCls} type="date" value={o.dateConnected} onChange={e => updOutreach(o.id,'dateConnected',e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Response</label>
                    <select className={inputCls} value={o.response} onChange={e => updOutreach(o.id,'response',e.target.value)}>
                      {['','Connected','Positive','No response','Not interested'].map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Follow-up Date</label>
                    <input className={inputCls} type="date" value={o.followUp} onChange={e => updOutreach(o.id,'followUp',e.target.value)} />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className={labelCls}>Message Sent</label>
                    <input className={inputCls} value={o.message} onChange={e => updOutreach(o.id,'message',e.target.value)} placeholder="Summary of your message" />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className={labelCls}>Notes</label>
                    <input className={inputCls} value={o.notes} onChange={e => updOutreach(o.id,'notes',e.target.value)} placeholder="Any other notes" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {outreach.length > 0 && (
        <div className="mt-4 flex justify-between items-center text-xs text-[#7A8FA3]">
          <span>{outreach.length} outreach{outreach.length !== 1 ? 'es' : ''}</span>
          <button onClick={addOutreach} className="text-[#6D99F2] hover:underline cursor-pointer">+ Add outreach</button>
        </div>
      )}
    </div>
  )
}
