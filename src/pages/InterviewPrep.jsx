import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Trash2, ChevronDown, CheckCircle2, Circle } from 'lucide-react'

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"
const textareaCls = `${inputCls} resize-none`

function newInterview() {
  return {
    id: Date.now(), role: '', company: '', date: '', stage: '', format: '', outcome: '',
    prepChecks: { competency: false, company: false, star: false, questions: false, outfit: false },
    starStories: ['','','','',''],
    companyInsights: ['','','','',''],
    talkingPoints: ['',''],
    questionsForThem: ['',''],
    wantRememberedFor: '', nervesSupport: '',
    debriefNotes: '', afterOutcome: '', feedbackReceived: '',
  }
}

const PREP_CHECKS = [
  { key: 'competency', label: 'Role competency reviewed' },
  { key: 'company', label: 'Company research done' },
  { key: 'star', label: '5 STAR stories ready' },
  { key: 'questions', label: '5 questions for them' },
  { key: 'outfit', label: 'Outfit & tech tested' },
]

export default function InterviewPrep() {
  const { data, update } = useData()
  const [expanded, setExpanded] = useState(null)
  const interviews = data.interviewPrep || []

  function setInterviews(next) { update('interviewPrep', next) }
  function add() { const n = newInterview(); setInterviews([...interviews, n]); setExpanded(n.id) }
  function remove(id) { setInterviews(interviews.filter(i => i.id !== id)); if (expanded === id) setExpanded(null) }
  function upd(id, field, value) { setInterviews(interviews.map(i => i.id === id ? { ...i, [field]: value } : i)) }
  function updCheck(id, key) {
    const iv = interviews.find(i => i.id === id)
    upd(id, 'prepChecks', { ...iv.prepChecks, [key]: !iv.prepChecks[key] })
  }
  function updList(id, field, idx, value) {
    const iv = interviews.find(i => i.id === id)
    const arr = [...iv[field]]; arr[idx] = value
    upd(id, field, arr)
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Interview Prep</h2>
          <p className="text-sm text-[#5A7080] italic font-['Playfair_Display']">Plan it before. Show up inside. Debrief after.</p>
        </div>
        <button onClick={add} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
          <Plus size={16} /> Add interview
        </button>
      </div>

      {interviews.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] p-12 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-[#7A8FA3] text-sm">No interviews yet. Add one to start your prep.</p>
        </div>
      )}

      <div className="space-y-3">
        {interviews.map(iv => {
          const checkCount = Object.values(iv.prepChecks).filter(Boolean).length
          return (
            <div key={iv.id} className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#F5F9FD]" onClick={() => setExpanded(expanded === iv.id ? null : iv.id)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#263746] truncate">{iv.company || 'Untitled company'}</p>
                  <p className="text-xs text-[#7A8FA3] truncate">{iv.role || 'No role'}{iv.date ? ` · ${iv.date}` : ''}{iv.stage ? ` · ${iv.stage}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex gap-1">
                    {PREP_CHECKS.map(({ key }) => (
                      iv.prepChecks[key]
                        ? <div key={key} className="w-2 h-2 rounded-full bg-[#6D99F2]" />
                        : <div key={key} className="w-2 h-2 rounded-full bg-[#D8E4EC]" />
                    ))}
                  </div>
                  <span className="text-xs text-[#7A8FA3]">{checkCount}/5</span>
                </div>
                <button onClick={e => { e.stopPropagation(); remove(iv.id) }} className="text-[#FF5E5B] hover:text-red-700 cursor-pointer"><Trash2 size={14} /></button>
                <ChevronDown size={16} className={`text-[#7A8FA3] transition-transform ${expanded === iv.id ? 'rotate-180' : ''}`} />
              </div>

              {expanded === iv.id && (
                <div className="border-t border-[#EEF3FA] px-5 py-5 space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Role</label><input className={`${inputCls} text-xs`} value={iv.role} onChange={e => upd(iv.id,'role',e.target.value)} placeholder="Job role" /></div>
                    <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Company</label><input className={`${inputCls} text-xs`} value={iv.company} onChange={e => upd(iv.id,'company',e.target.value)} placeholder="Company" /></div>
                    <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Date</label><input className={`${inputCls} text-xs`} type="date" value={iv.date} onChange={e => upd(iv.id,'date',e.target.value)} /></div>
                    <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Stage</label><input className={`${inputCls} text-xs`} value={iv.stage} onChange={e => upd(iv.id,'stage',e.target.value)} placeholder="e.g. First round" /></div>
                    <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Format</label><input className={`${inputCls} text-xs`} value={iv.format} onChange={e => upd(iv.id,'format',e.target.value)} placeholder="e.g. Video call" /></div>
                    <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Outcome</label><input className={`${inputCls} text-xs`} value={iv.outcome} onChange={e => upd(iv.id,'outcome',e.target.value)} placeholder="e.g. Progressed" /></div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide mb-3">BEFORE</p>
                    <div className="flex flex-wrap gap-3">
                      {PREP_CHECKS.map(({ key, label }) => (
                        <button key={key} onClick={() => updCheck(iv.id, key)} className="flex items-center gap-2 cursor-pointer">
                          {iv.prepChecks[key]
                            ? <CheckCircle2 size={16} className="text-[#6D99F2]" />
                            : <Circle size={16} className="text-[#D8E4EC]" />
                          }
                          <span className={`text-xs ${iv.prepChecks[key] ? 'text-[#263746] font-medium' : 'text-[#4A5C6B]'}`}>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide mb-3">Top 5 STAR / SAO Stories</p>
                    <div className="space-y-2">
                      {iv.starStories.map((s, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-xs text-[#7A8FA3] mt-2 w-4 flex-shrink-0">{i+1}.</span>
                          <textarea className={`${textareaCls} text-xs`} rows={2} value={s} onChange={e => updList(iv.id,'starStories',i,e.target.value)} placeholder="Situation / Task / Action / Result" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide mb-3">Top 5 Company Insights</p>
                    <div className="space-y-2">
                      {iv.companyInsights.map((s, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-xs text-[#7A8FA3] mt-2 w-4 flex-shrink-0">{i+1}.</span>
                          <input className={`${inputCls} text-xs`} value={s} onChange={e => updList(iv.id,'companyInsights',i,e.target.value)} placeholder="Key insight about the company" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide mb-3">Key Talking Points</p>
                      <div className="space-y-2">
                        {iv.talkingPoints.map((s, i) => (
                          <input key={i} className={`${inputCls} text-xs`} value={s} onChange={e => updList(iv.id,'talkingPoints',i,e.target.value)} placeholder={`Talking point ${i+1}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide mb-3">Questions to Ask Them</p>
                      <div className="space-y-2">
                        {iv.questionsForThem.map((s, i) => (
                          <input key={i} className={`${inputCls} text-xs`} value={s} onChange={e => updList(iv.id,'questionsForThem',i,e.target.value)} placeholder={`Question ${i+1}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide mb-3">DURING</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs text-[#4A5C6B] mb-1">What do you want them to remember you for?</label><input className={`${inputCls} text-xs`} value={iv.wantRememberedFor} onChange={e => upd(iv.id,'wantRememberedFor',e.target.value)} /></div>
                      <div><label className="block text-xs text-[#4A5C6B] mb-1">Nerves support needed</label><input className={`${inputCls} text-xs`} value={iv.nervesSupport} onChange={e => upd(iv.id,'nervesSupport',e.target.value)} placeholder="e.g. Breathe, slow down" /></div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide mb-3">AFTER</p>
                    <div className="space-y-4">
                      <div><label className="block text-xs text-[#4A5C6B] mb-1">Debrief notes</label><textarea className={`${textareaCls} text-xs`} rows={3} value={iv.debriefNotes} onChange={e => upd(iv.id,'debriefNotes',e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs text-[#4A5C6B] mb-1">Outcome</label><input className={`${inputCls} text-xs`} value={iv.afterOutcome} onChange={e => upd(iv.id,'afterOutcome',e.target.value)} /></div>
                        <div><label className="block text-xs text-[#4A5C6B] mb-1">Feedback received</label><input className={`${inputCls} text-xs`} value={iv.feedbackReceived} onChange={e => upd(iv.id,'feedbackReceived',e.target.value)} /></div>
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
