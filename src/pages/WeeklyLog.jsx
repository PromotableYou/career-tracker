import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Trash2, ChevronDown, CheckCircle2, Circle, Zap, Eraser } from 'lucide-react'

const SESSION_TYPES = [
  'General Q&A',
  'Confidence & Clarity',
  'Group Coaching',
  'Resumes & Interviews',
  '1:1 Coaching',
  'Other',
]

const ENERGY_LABELS = { 1: 'Very low', 2: 'Low', 3: 'OK', 4: 'Good', 5: 'Energised' }
const ENERGY_COLORS = {
  1: 'bg-red-50 text-[#FF5E5B] border-[#FF5E5B]',
  2: 'bg-amber-50 text-amber-600 border-amber-400',
  3: 'bg-[#FBD872]/20 text-amber-700 border-[#FBD872]',
  4: 'bg-emerald-50 text-emerald-600 border-emerald-400',
  5: 'bg-[#EEF3FA] text-[#6D99F2] border-[#6D99F2]',
}

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-2 py-1.5 text-xs text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"

function getMonday(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - ((day + 6) % 7))
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function weekLabel(weekOf) {
  if (!weekOf) return 'Unknown week'
  const mon = new Date(weekOf)
  const fri = new Date(weekOf)
  fri.setDate(mon.getDate() + 4)
  const fmt = d => `${d.getDate()}.${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}`
  return `${fmt(mon)} – ${fmt(fri)}`
}

function countAppsForWeek(applications, weekOf) {
  if (!weekOf || !applications?.length) return 0
  const start = new Date(weekOf)
  const end = new Date(weekOf)
  end.setDate(end.getDate() + 7)
  return applications.filter(a => {
    if (!a.submittedDate) return false
    const d = new Date(a.submittedDate)
    return d >= start && d < end
  }).length
}

function newLog() {
  return {
    id: Date.now(),
    weekOf: getMonday(),
    sessions: [],           // [{ id, type, takeaway, nextStep, done, commitments }]
    appsSubmitted: 0,
    networkingActions: 0,
    interviewsScheduled: '',
    wentWell: '',
    didntWork: '',
    feeling: '',
    focusNextWeek: '',
    energyLevel: '',
    submitted: false,
  }
}

function newSession(type) {
  return { id: Date.now(), type, takeaway: '', nextStep: '', done: false, commitments: [] }
}

export default function WeeklyLog({ navigate }) {
  const { data, update } = useData()
  const logs = data.weeklyLog || []
  const applications = data.applications || []
  const [expanded, setExpanded] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const sorted = [...logs].sort((a, b) => {
    if (a.weekOf && b.weekOf) return a.weekOf.localeCompare(b.weekOf)
    return a.id - b.id
  })

  function set(next) { update('weeklyLog', next) }
  function add() {
    const l = newLog()
    set([...logs, l])
    setExpanded(l.id)
  }
  function remove(id) { set(logs.filter(l => l.id !== id)) }
  function upd(id, field, value) { set(logs.map(l => l.id === id ? { ...l, [field]: value } : l)) }
  function toggle(id) { setExpanded(expanded === id ? null : id) }
  function clearAll() { set([]); setConfirmClear(false); setExpanded(null) }

  // Session helpers
  function toggleSession(logId, type) {
    set(logs.map(l => {
      if (l.id !== logId) return l
      const exists = (l.sessions || []).find(s => s.type === type)
      const sessions = exists
        ? (l.sessions || []).filter(s => s.type !== type)
        : [...(l.sessions || []), newSession(type)]
      return { ...l, sessions }
    }))
  }
  function updSession(logId, sessionId, field, value) {
    set(logs.map(l => l.id !== logId ? l : {
      ...l,
      sessions: (l.sessions || []).map(s => s.id === sessionId ? { ...s, [field]: value } : s)
    }))
  }
  function addCommitment(logId, sessionId) {
    set(logs.map(l => l.id !== logId ? l : {
      ...l,
      sessions: (l.sessions || []).map(s => s.id !== sessionId ? s : {
        ...s, commitments: [...(s.commitments || []), { id: Date.now(), text: '', done: false }]
      })
    }))
  }
  function updCommitment(logId, sessionId, cId, field, value) {
    set(logs.map(l => l.id !== logId ? l : {
      ...l,
      sessions: (l.sessions || []).map(s => s.id !== sessionId ? s : {
        ...s, commitments: (s.commitments || []).map(c => c.id === cId ? { ...c, [field]: value } : c)
      })
    }))
  }
  function removeCommitment(logId, sessionId, cId) {
    set(logs.map(l => l.id !== logId ? l : {
      ...l,
      sessions: (l.sessions || []).map(s => s.id !== sessionId ? s : {
        ...s, commitments: (s.commitments || []).filter(c => c.id !== cId)
      })
    }))
  }

  const weekNums = sorted.reduce((acc, l, i) => { acc[l.id] = i + 1; return acc }, {})
  const completed = logs.filter(l => l.submitted).length

  return (
    <div className="w-full">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Weekly Log</h2>
          <p className="text-sm text-[#7A8FA3]">One card per week. Log the sessions you attended, reflect on your search, and track your momentum.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {logs.length > 0 && !confirmClear && (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-colors border bg-white text-[#FF5E5B] border-[#FF5E5B]/30 hover:bg-red-50"
            >
              <Eraser size={13} /> Clear all
            </button>
          )}
          {confirmClear && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7A8FA3]">Remove all {logs.length} log{logs.length !== 1 ? 's' : ''}?</span>
              <button onClick={clearAll} className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#FF5E5B] text-white cursor-pointer hover:bg-red-600 transition-colors">Yes, clear</button>
              <button onClick={() => setConfirmClear(false)} className="text-xs font-semibold px-3 py-2 rounded-lg border border-[#D8E4EC] text-[#4A5C6B] bg-white cursor-pointer hover:bg-[#EEF3FA] transition-colors">Cancel</button>
            </div>
          )}
          <button onClick={add} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
            <Plus size={15} /> New week
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {logs.length > 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] px-5 py-4 mb-6">
          <div className="flex justify-between text-xs text-[#7A8FA3] mb-1.5">
            <span>Weeks submitted</span>
            <span>{completed} of {logs.length}</span>
          </div>
          <div className="w-full h-2 bg-[#D8E4EC] rounded-full overflow-hidden">
            <div className="h-full bg-[#6D99F2] rounded-full transition-all" style={{ width: `${logs.length > 0 ? (completed / logs.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Empty state */}
      {logs.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] p-10 text-center">
          <div className="text-4xl mb-3">📓</div>
          <p className="text-[#263746] font-semibold text-base mb-2">Start your weekly log</p>
          <p className="text-[#7A8FA3] text-sm max-w-md mx-auto leading-relaxed mb-5">
            Add a new log each week. Track the sessions you attended, your wins, what to work on next, and how you're feeling. One week at a time.
          </p>
          <button onClick={add} className="inline-flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-colors">
            <Plus size={16} /> Add your first week
          </button>
        </div>
      )}

      {/* Log cards */}
      <div className="space-y-3">
        {sorted.map(l => {
          const isExpanded = expanded === l.id
          const weekNum = weekNums[l.id]
          const trackerCount = l.weekOf ? countAppsForWeek(applications, l.weekOf) : null
          const showAutoFill = trackerCount !== null && trackerCount > 0 && trackerCount !== l.appsSubmitted

          return (
            <div key={l.id} className={`bg-white rounded-xl border overflow-hidden ${l.submitted ? 'border-[#6D99F2]/40' : 'border-[#D8E4EC]'}`}>

              {/* Card header */}
              <div
                className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${l.submitted ? 'bg-[#EEF3FA] hover:bg-[#E6EEF8]' : 'bg-[#F8F5F2] hover:bg-[#F0EDE9]'}`}
                onClick={() => toggle(l.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold text-[#6D99F2] font-['Inter'] flex-shrink-0 w-7">W{weekNum}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#263746]">{weekLabel(l.weekOf)}</p>
                    {!isExpanded && (
                      <p className="text-xs text-[#7A8FA3] truncate">
                        {(l.sessions || []).length > 0
                          ? (l.sessions || []).map(s => s.type).join(', ')
                          : 'No sessions logged'}
                        {l.appsSubmitted > 0 && ` · ${l.appsSubmitted} app${l.appsSubmitted !== 1 ? 's' : ''}`}
                      </p>
                    )}
                  </div>
                  {l.energyLevel && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 hidden sm:inline ${ENERGY_COLORS[l.energyLevel] || ''}`}>
                      {ENERGY_LABELS[l.energyLevel]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <button
                    onClick={e => { e.stopPropagation(); upd(l.id, 'submitted', !l.submitted) }}
                    className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    {l.submitted
                      ? <><CheckCircle2 size={15} className="text-[#6D99F2]" /><span className="text-[#6D99F2] hidden sm:inline">Done</span></>
                      : <><Circle size={15} className="text-[#D8E4EC]" /><span className="text-[#7A8FA3] hidden sm:inline">Mark done</span></>
                    }
                  </button>
                  <button onClick={e => { e.stopPropagation(); remove(l.id) }} className="text-[#D8E4EC] hover:text-[#FF5E5B] transition-colors cursor-pointer"><Trash2 size={14} /></button>
                  <ChevronDown size={16} className={`text-[#7A8FA3] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 py-5 space-y-6">

                  {/* Week date */}
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#4A5C6B] mb-1">Week starting (Monday)</label>
                      <input
                        className={inputCls}
                        type="date"
                        value={l.weekOf || ''}
                        onChange={e => upd(l.id, 'weekOf', e.target.value)}
                        style={{ width: 160 }}
                      />
                    </div>
                  </div>

                  {/* Sessions attended */}
                  <div>
                    <p className="text-xs font-bold text-[#263746] uppercase tracking-wide mb-3">Sessions attended this week</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {SESSION_TYPES.map(type => {
                        const selected = (l.sessions || []).some(s => s.type === type)
                        return (
                          <button
                            key={type}
                            onClick={() => toggleSession(l.id, type)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors border ${
                              selected
                                ? 'bg-[#263746] text-white border-[#263746]'
                                : 'bg-white text-[#4A5C6B] border-[#D8E4EC] hover:bg-[#EEF3FA]'
                            }`}
                          >
                            {selected ? '✓ ' : ''}{type}
                          </button>
                        )
                      })}
                    </div>

                    {/* Notes per selected session */}
                    {(l.sessions || []).length > 0 && (
                      <div className="space-y-4">
                        {(l.sessions || []).map(s => (
                          <div key={s.id} className="bg-[#F8F5F2] rounded-xl p-4 border border-[#EEF3FA]">
                            <p className="text-xs font-bold text-[#263746] mb-3">{s.type}</p>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Key takeaway</label>
                                <textarea className={inputCls} rows={2} value={s.takeaway} onChange={e => updSession(l.id, s.id, 'takeaway', e.target.value)} placeholder="What was the most important thing you learned or decided?" />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-xs font-medium text-[#4A5C6B]">Next best step</label>
                                  <button onClick={() => updSession(l.id, s.id, 'done', !s.done)} className="flex items-center gap-1 text-xs cursor-pointer">
                                    {s.done
                                      ? <><CheckCircle2 size={12} className="text-[#6D99F2]" /><span className="text-[#6D99F2]">Done</span></>
                                      : <><Circle size={12} className="text-[#D8E4EC]" /><span className="text-[#7A8FA3]">Not done</span></>
                                    }
                                  </button>
                                </div>
                                <input className={inputCls} value={s.nextStep} onChange={e => updSession(l.id, s.id, 'nextStep', e.target.value)} placeholder="The one action you'll take" />
                              </div>
                              {/* Commitments */}
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="block text-xs font-medium text-[#4A5C6B]">Commitments</label>
                                  <button onClick={() => addCommitment(l.id, s.id)} className="flex items-center gap-1 text-xs text-[#6D99F2] hover:text-[#263746] cursor-pointer font-medium transition-colors"><Plus size={11} /> Add</button>
                                </div>
                                {(s.commitments || []).length === 0
                                  ? <p className="text-xs text-[#7A8FA3] italic">Log what you committed to in this session.</p>
                                  : (
                                    <div className="space-y-1.5">
                                      {(s.commitments || []).map(c => (
                                        <div key={c.id} className="flex items-center gap-2">
                                          <input type="checkbox" checked={c.done} onChange={e => updCommitment(l.id, s.id, c.id, 'done', e.target.checked)} className="accent-[#263746]" />
                                          <input
                                            className={`flex-1 bg-transparent text-xs focus:outline-none border-b border-dashed border-[#D8E4EC] focus:border-[#6D99F2] placeholder:text-[#7A8FA3] ${c.done ? 'line-through text-[#7A8FA3]' : 'text-[#263746]'}`}
                                            value={c.text}
                                            onChange={e => updCommitment(l.id, s.id, c.id, 'text', e.target.value)}
                                            placeholder="e.g. Update LinkedIn headline by Friday"
                                          />
                                          <button onClick={() => removeCommitment(l.id, s.id, c.id)} className="text-[#D8E4EC] hover:text-[#FF5E5B] cursor-pointer transition-colors"><Trash2 size={11} /></button>
                                        </div>
                                      ))}
                                    </div>
                                  )
                                }
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Weekly reflection */}
                  <div>
                    <p className="text-xs font-bold text-[#263746] uppercase tracking-wide mb-3">Weekly reflection</p>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-[#4A5C6B]">Apps submitted</label>
                          {showAutoFill && (
                            <button
                              onClick={() => upd(l.id, 'appsSubmitted', trackerCount)}
                              className="flex items-center gap-1 text-[10px] font-semibold text-[#6D99F2] hover:text-[#263746] cursor-pointer transition-colors"
                            >
                              <Zap size={10} /> Fill ({trackerCount})
                            </button>
                          )}
                        </div>
                        <input className={inputCls} type="number" min="0" value={l.appsSubmitted} onChange={e => upd(l.id, 'appsSubmitted', +e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Networking actions</label>
                        <input className={inputCls} type="number" min="0" value={l.networkingActions} onChange={e => upd(l.id, 'networkingActions', +e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Interviews scheduled</label>
                        <input className={inputCls} value={l.interviewsScheduled} onChange={e => upd(l.id, 'interviewsScheduled', e.target.value)} placeholder="e.g. 1" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-[#4A5C6B] mb-1">What went well?</label>
                        <textarea className={inputCls} rows={2} value={l.wentWell} onChange={e => upd(l.id, 'wentWell', e.target.value)} placeholder="Wins this week" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#4A5C6B] mb-1">What didn't work?</label>
                        <textarea className={inputCls} rows={2} value={l.didntWork} onChange={e => upd(l.id, 'didntWork', e.target.value)} placeholder="What to do differently" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#4A5C6B] mb-1">How are you feeling?</label>
                        <textarea className={inputCls} rows={2} value={l.feeling} onChange={e => upd(l.id, 'feeling', e.target.value)} placeholder="Honest reflection" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Focus next week</label>
                        <textarea className={inputCls} rows={2} value={l.focusNextWeek} onChange={e => upd(l.id, 'focusNextWeek', e.target.value)} placeholder="Your priority" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4A5C6B] mb-2">Energy level</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => upd(l.id, 'energyLevel', l.energyLevel === n ? '' : n)}
                            className={`w-9 h-9 rounded-lg text-sm font-bold cursor-pointer transition-colors border ${l.energyLevel === n ? ENERGY_COLORS[n] : 'bg-[#F8F5F2] text-[#7A8FA3] border-[#D8E4EC] hover:bg-[#EEF3FA]'}`}
                          >
                            {n}
                          </button>
                        ))}
                        {l.energyLevel && <span className="text-xs text-[#7A8FA3] self-center ml-1">{ENERGY_LABELS[l.energyLevel]}</span>}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
