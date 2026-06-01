import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Trash2, ChevronDown, CheckCircle2, Circle, Star, Copy } from 'lucide-react'

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

const Q_CATEGORIES = ['Behavioural', 'Situational', 'Competency', 'Culture fit', 'Career story', 'Technical', 'Other']

const STARTER_QUESTIONS = [
  { category: 'Career story', text: 'Tell me about yourself.' },
  { category: 'Behavioural', text: 'Tell me about a time you dealt with conflict at work.' },
  { category: 'Behavioural', text: 'Describe a time you failed and what you learned from it.' },
  { category: 'Situational', text: 'How do you prioritise when you have multiple competing deadlines?' },
  { category: 'Culture fit', text: 'Why do you want to work here?' },
  { category: 'Career story', text: 'Where do you see yourself in 5 years?' },
  { category: 'Competency', text: 'What are your greatest strengths?' },
  { category: 'Competency', text: 'What is your biggest weakness?' },
]

function newQuestion(text = '', category = '') {
  return { id: Date.now() + Math.random(), text, category, answer: '', confidence: 0, expanded: false }
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n)} className="cursor-pointer">
          <Star size={14} className={n <= value ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-[#D8E4EC]'} />
        </button>
      ))}
    </div>
  )
}

const PREP_CHECKS = [
  { key: 'competency', label: 'Role competency reviewed' },
  { key: 'company', label: 'Company research done' },
  { key: 'star', label: '5 STAR stories ready' },
  { key: 'questions', label: '5 questions for them' },
  { key: 'outfit', label: 'Outfit & tech tested' },
]

function InterviewTemplateCard({ title, body }) {
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

export default function InterviewPrep() {
  const { data, update } = useData()
  const [expanded, setExpanded] = useState(null)
  const [qExpanded, setQExpanded] = useState(null)
  const [filterCat, setFilterCat] = useState('')
  const [showEmailTemplates, setShowEmailTemplates] = useState(false)
  const interviews = data.interviewPrep || []
  const questions = data.questionBank || []

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

  // Question bank
  function setQuestions(next) { update('questionBank', next) }
  function addQuestion() {
    const q = newQuestion()
    setQuestions([...questions, q])
    setQExpanded(q.id)
  }
  function addStarters() {
    const existing = new Set(questions.map(q => q.text))
    const toAdd = STARTER_QUESTIONS.filter(q => !existing.has(q.text)).map(q => newQuestion(q.text, q.category))
    setQuestions([...questions, ...toAdd])
  }
  function removeQuestion(id) { setQuestions(questions.filter(q => q.id !== id)) }
  function updQuestion(id, field, value) { setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q)) }

  const filteredQuestions = filterCat ? questions.filter(q => q.category === filterCat) : questions
  const avgConfidence = questions.filter(q => q.confidence > 0).length
    ? (questions.filter(q => q.confidence > 0).reduce((s, q) => s + q.confidence, 0) / questions.filter(q => q.confidence > 0).length).toFixed(1)
    : null

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Interview Prep</h2>
          <p className="text-sm text-[#7A8FA3]">Plan it before. Show up inside. Debrief after.</p>
        </div>
        <button onClick={add} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
          <Plus size={16} /> Add interview
        </button>
      </div>

      {interviews.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] p-10 text-center mb-4">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-[#263746] font-semibold text-base mb-2">Prep like a pro</p>
          <p className="text-[#7A8FA3] text-sm max-w-md mx-auto leading-relaxed">Add your upcoming interview and work through your STAR stories, company research, and talking points. Walk in prepared and walk out confident.</p>
          <button onClick={add} className="mt-5 inline-flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-colors">
            <Plus size={16} /> Add your first interview
          </button>
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

      {/* Question Bank */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-semibold text-[#263746] font-['Inter']">Question Bank</h3>
            <p className="text-sm text-[#7A8FA3]">Build your answer library. Rate your confidence on each one.</p>
          </div>
          <div className="flex gap-2">
            {questions.length === 0 && (
              <button onClick={addStarters} className="flex items-center gap-2 border border-[#D8E4EC] text-[#4A5C6B] hover:bg-[#F5F9FD] text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
                Load starter questions
              </button>
            )}
            <button onClick={addQuestion} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
              <Plus size={16} /> Add question
            </button>
          </div>
        </div>

        {/* Stats + filter */}
        {questions.length > 0 && (
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <span className="text-xs text-[#7A8FA3]">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
            {avgConfidence && <span className="text-xs text-[#7A8FA3]">Avg confidence: <span className="font-semibold text-[#263746]">{avgConfidence}/5</span></span>}
            <div className="flex gap-1.5 flex-wrap ml-auto">
              <button onClick={() => setFilterCat('')} className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${!filterCat ? 'bg-[#263746] text-white' : 'bg-[#EEF3FA] text-[#4A5C6B] hover:bg-[#D8E4EC]'}`}>All</button>
              {Q_CATEGORIES.map(cat => (
                questions.some(q => q.category === cat) && (
                  <button key={cat} onClick={() => setFilterCat(cat === filterCat ? '' : cat)} className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${filterCat === cat ? 'bg-[#263746] text-white' : 'bg-[#EEF3FA] text-[#4A5C6B] hover:bg-[#D8E4EC]'}`}>{cat}</button>
                )
              ))}
            </div>
          </div>
        )}

        {questions.length === 0 && (
          <div className="bg-white rounded-xl border border-[#D8E4EC] p-10 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-[#263746] font-semibold text-base mb-2">Build your answer library</p>
            <p className="text-[#7A8FA3] text-sm max-w-md mx-auto leading-relaxed mb-5">Practise makes permanent. Load the starter questions or add your own, write your STAR answers, and rate your confidence until every answer is solid.</p>
            <button onClick={addStarters} className="inline-flex items-center gap-2 border border-[#D8E4EC] text-[#4A5C6B] hover:bg-[#F5F9FD] text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-colors">
              Load starter questions
            </button>
          </div>
        )}

        <div className="space-y-2">
          {filteredQuestions.map(q => {
            const confColor = q.confidence >= 4 ? 'text-emerald-600' : q.confidence >= 2 ? 'text-amber-500' : 'text-[#FF5E5B]'
            return (
              <div key={q.id} className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-[#F5F9FD]"
                  onClick={() => setQExpanded(qExpanded === q.id ? null : q.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#263746] truncate">{q.text || 'New question'}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {q.category && <span className="hidden sm:block text-xs bg-[#EEF3FA] text-[#4A5C6B] px-2 py-0.5 rounded-full">{q.category}</span>}
                    {q.confidence > 0 && (
                      <span className={`text-xs font-semibold ${confColor}`}>{q.confidence}/5</span>
                    )}
                    {q.answer && <div className="w-2 h-2 rounded-full bg-[#6D99F2]" title="Answer saved" />}
                    <button onClick={e => { e.stopPropagation(); removeQuestion(q.id) }} className="text-[#D8E4EC] hover:text-[#FF5E5B] transition-colors cursor-pointer"><Trash2 size={14} /></button>
                    <ChevronDown size={15} className={`text-[#7A8FA3] transition-transform ${qExpanded === q.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {qExpanded === q.id && (
                  <div className="border-t border-[#EEF3FA] px-5 py-4 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#4A5C6B] mb-1">Question</label>
                        <input className={inputCls} value={q.text} onChange={e => updQuestion(q.id,'text',e.target.value)} placeholder="Enter the interview question" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#4A5C6B] mb-1">Category</label>
                        <select className={inputCls} value={q.category} onChange={e => updQuestion(q.id,'category',e.target.value)}>
                          <option value="">Select category</option>
                          {Q_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4A5C6B] mb-1">Your Answer</label>
                      <textarea className={`${textareaCls}`} rows={4} value={q.answer} onChange={e => updQuestion(q.id,'answer',e.target.value)} placeholder="Write your prepared answer here — use STAR format for behavioural questions" />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-[#4A5C6B]">Confidence</span>
                      <StarRating value={q.confidence} onChange={v => updQuestion(q.id,'confidence',v)} />
                      {q.confidence > 0 && <span className="text-xs text-[#7A8FA3]">{['','Not ready','Getting there','Fairly confident','Confident','Nailed it'][q.confidence]}</span>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Email Templates */}
      <div className="mt-10">
        <button
          onClick={() => setShowEmailTemplates(t => !t)}
          className="flex items-center gap-2 text-sm font-semibold text-[#263746] mb-4 cursor-pointer"
        >
          <span>✉️ Email Templates</span>
          <ChevronDown size={15} className={`text-[#7A8FA3] transition-transform ${showEmailTemplates ? 'rotate-180' : ''}`} />
        </button>
        {showEmailTemplates && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: 'Thank you — after interview',
                body: `Hi [Name],\n\nThank you so much for taking the time to meet with me today. I really enjoyed learning more about the [Role] position and the work [Company] is doing with [specific thing].\n\nOur conversation reinforced my excitement about this opportunity — particularly around [specific aspect of the role]. I believe my experience in [relevant skill/experience] positions me well to contribute.\n\nI look forward to the next steps and don't hesitate to reach out if you need anything further from me.\n\nWarm regards,\n[Your Name]`,
              },
              {
                title: 'Follow-up — no response after interview',
                body: `Hi [Name],\n\nI hope you're well. I wanted to follow up on my interview for the [Role] position on [date].\n\nI remain very interested in the opportunity and would love to know if there are any updates on the timeline or next steps.\n\nThank you again for your time.\n\nBest,\n[Your Name]`,
              },
              {
                title: 'Withdrawing from process',
                body: `Hi [Name],\n\nThank you for the opportunity to interview for the [Role] position. After careful consideration, I have decided to withdraw my application at this stage.\n\nThis was not an easy decision — the role and team were genuinely appealing. However, [brief reason if appropriate, e.g. "I have accepted another opportunity" or "the timing isn't right"].\n\nI hope our paths cross again in the future and I wish you and the team all the best.\n\nKind regards,\n[Your Name]`,
              },
              {
                title: 'Asking for feedback after rejection',
                body: `Hi [Name],\n\nThank you for letting me know the outcome of the [Role] process. While I'm disappointed, I appreciate you taking the time to inform me.\n\nIf possible, I'd be grateful for any feedback on my application or interviews. Understanding where I could improve would be really valuable as I continue my search.\n\nThank you again for your time and consideration.\n\nBest,\n[Your Name]`,
              },
            ].map(({ title, body }) => (
              <InterviewTemplateCard key={title} title={title} body={body} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
