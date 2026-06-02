import { useData } from '../context/DataContext'
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'

const SESSION_TYPES = ['General Q&A','Confidence & Clarity','Group Coaching','Resumes & Interviews','1:1 Coaching','Other']
const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-2 py-1.5 text-xs text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"

function newSession() {
  return { id: Date.now(), date: '', type: '', breakoutRoom: '', takeaway: '', nextStep: '', done: false, commitments: [] }
}

export default function Coaching() {
  const { data, update } = useData()
  const sessions = data.coaching || []

  function set(next) { update('coaching', next) }
  function add() { set([...sessions, newSession()]) }
  function remove(id) { set(sessions.filter(s => s.id !== id)) }
  function upd(id, field, value) { set(sessions.map(s => s.id === id ? { ...s, [field]: value } : s)) }
  function addCommitment(id) { set(sessions.map(s => s.id === id ? { ...s, commitments: [...(s.commitments || []), { id: Date.now(), text: '', done: false }] } : s)) }
  function updCommitment(id, cId, field, value) { set(sessions.map(s => s.id === id ? { ...s, commitments: (s.commitments || []).map(c => c.id === cId ? { ...c, [field]: value } : c) } : s)) }
  function removeCommitment(id, cId) { set(sessions.map(s => s.id === id ? { ...s, commitments: (s.commitments || []).filter(c => c.id !== cId) } : s)) }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Coaching Sessions</h2>
          <p className="text-sm text-[#7A8FA3]">Log every session. Key takeaway, next step, tick it off when done.</p>
        </div>
        <button onClick={add} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
          <Plus size={16} /> Log session
        </button>
      </div>

      {sessions.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] p-10 text-center">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-[#263746] font-semibold text-base mb-2">Log every coaching session</p>
          <p className="text-[#7A8FA3] text-sm max-w-md mx-auto leading-relaxed mb-5">Add your session within 24 hours while it's still fresh. One key takeaway and one next step is all you need — don't let the insight slip away.</p>
          <button onClick={add} className="inline-flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-colors">
            <Plus size={16} /> Log your first session
          </button>
        </div>
      )}

      <div className="space-y-3">
        {sessions.map(s => (
          <div key={s.id} className={`bg-white rounded-xl border overflow-hidden ${s.done ? 'border-[#6D99F2]/40' : 'border-[#D8E4EC]'}`}>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => upd(s.id,'done',!s.done)} className="cursor-pointer flex-shrink-0 mt-0.5">
                    {s.done ? <CheckCircle2 size={20} className="text-[#6D99F2]" /> : <Circle size={20} className="text-[#D8E4EC]" />}
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-[#263746]">{s.type || 'Session'}</p>
                    <p className="text-xs text-[#7A8FA3]">{s.date || 'No date set'}</p>
                  </div>
                </div>
                <button onClick={() => remove(s.id)} className="text-[#FF5E5B] hover:text-red-700 cursor-pointer"><Trash2 size={14} /></button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Date</label><input className={inputCls} type="date" value={s.date} onChange={e => upd(s.id,'date',e.target.value)} /></div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Session Type</label>
                  <select className={inputCls} value={s.type} onChange={e => upd(s.id,'type',e.target.value)}>
                    <option value="">Select type...</option>
                    {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Breakout Room</label>
                  <input className={inputCls} value={s.breakoutRoom || ''} onChange={e => upd(s.id,'breakoutRoom',e.target.value)} placeholder="Which breakout room did you attend?" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Key Takeaway</label>
                  <textarea className={inputCls} rows={2} value={s.takeaway} onChange={e => upd(s.id,'takeaway',e.target.value)} placeholder="What was the most important thing you learned or decided?" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Next Best Step</label>
                  <div className="flex items-center gap-3">
                    <input className={`${inputCls} flex-1`} value={s.nextStep} onChange={e => upd(s.id,'nextStep',e.target.value)} placeholder="The one action you'll take before your next session" />
                    <button onClick={() => upd(s.id,'done',!s.done)} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer flex-shrink-0">
                      {s.done
                        ? <span className="text-[#6D99F2] flex items-center gap-1"><CheckCircle2 size={14} /> Done</span>
                        : <span className="text-[#7A8FA3] flex items-center gap-1"><Circle size={14} /> Not done</span>
                      }
                    </button>
                  </div>
                </div>

                {/* Commitments / Action Items */}
                <div className="col-span-2 border-t border-[#EEF3FA] pt-4 mt-1">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide">Commitments</label>
                    <button onClick={() => addCommitment(s.id)} className="flex items-center gap-1 text-xs text-[#6D99F2] hover:text-[#263746] cursor-pointer font-medium transition-colors">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                  {(s.commitments || []).length === 0 ? (
                    <p className="text-xs text-[#7A8FA3] italic">What did you commit to? Log it here so you stay accountable.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {(s.commitments || []).map(c => (
                        <div key={c.id} className="flex items-center gap-2 py-1">
                          <input type="checkbox" checked={c.done} onChange={e => updCommitment(s.id, c.id, 'done', e.target.checked)} className="accent-[#263746]" />
                          <input
                            className={`flex-1 bg-transparent text-xs focus:outline-none border-b border-dashed border-[#D8E4EC] focus:border-[#6D99F2] placeholder:text-[#7A8FA3] ${c.done ? 'line-through text-[#7A8FA3]' : 'text-[#263746]'}`}
                            value={c.text}
                            onChange={e => updCommitment(s.id, c.id, 'text', e.target.value)}
                            placeholder="e.g. Update LinkedIn headline by Friday"
                          />
                          <button onClick={() => removeCommitment(s.id, c.id)} className="text-[#D8E4EC] hover:text-[#FF5E5B] cursor-pointer transition-colors"><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
