import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, Circle, Star, Copy } from 'lucide-react'

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"
const textareaCls = `${inputCls} resize-none`

const STAR_CATEGORIES = [
  { key: 'leadership', label: 'Leadership', icon: '👑', prompt: 'A time you led a team, project, or initiative — what was the situation, what did you do, and what was the outcome?' },
  { key: 'stakeholder', label: 'Stakeholder Management', icon: '🤝', prompt: 'A time you managed competing priorities or built strong relationships with key stakeholders.' },
  { key: 'conflict', label: 'Overcame Conflict', icon: '⚡', prompt: 'A time you navigated disagreement or tension — how did you handle it and what was the result?' },
  { key: 'projectDelivery', label: 'Project Delivery', icon: '🎯', prompt: 'A complex project you delivered — what were the challenges and how did you get it across the line?' },
  { key: 'innovation', label: 'Innovation', icon: '💡', prompt: 'A time you came up with a new idea, improved a process, or found a better way of doing something.' },
  { key: 'careerStory', label: 'Tell Me About Yourself', icon: '🙋', prompt: "Your career story arc — where you've been, what you bring, and where you're headed. Keep it to 90 seconds." },
]

const NERVES_STRATEGIES = [
  { key: 'breathing', label: 'Deep breathing' },
  { key: 'powerPose', label: 'Power pose' },
  { key: 'warmUp', label: 'Warm-up conversation' },
  { key: 'music', label: 'Pump-up music' },
  { key: 'mantra', label: 'Positive mantra' },
  { key: 'walk', label: 'Go for a walk first' },
  { key: 'reviewNotes', label: 'Review notes beforehand' },
  { key: 'eat', label: 'Eat something first' },
]

const PREP_CHECKS = [
  { key: 'company', label: 'Company research done' },
  { key: 'starReady', label: 'STAR stories ready' },
  { key: 'questions', label: '5 questions for them' },
  { key: 'outfit', label: 'Outfit & tech tested' },
  { key: 'route', label: 'Route/link confirmed' },
]

const AFTER_CHECKS = [
  { key: 'thankYou', label: 'Sent thank you email' },
  { key: 'linkedin', label: 'Connected on LinkedIn' },
  { key: 'followedUp', label: 'Followed up (if no response)' },
]

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

const DEFAULT_FOUNDATION = {
  starStories: {},
  generalTalkingPoints: '',
  icebreakers: '',
  nervesStrategies: {},
  nervesNotes: '',
}

function newInterview() {
  return {
    id: Date.now(),
    company: '', role: '', date: '', stage: '', format: '',
    wantRememberedFor: '',
    prepChecks: { company: false, starReady: false, questions: false, outfit: false, route: false },
    companyInsights: ['', '', ''],
    talkingPoints: ['', ''],
    questionsForThem: ['', '', ''],
    afterChecks: { thankYou: false, linkedin: false, followedUp: false },
    progressing: '',
    feedbackReceived: '',
    debriefNotes: '',
  }
}

function newQuestion(text = '', category = '') {
  return { id: Date.now() + Math.random(), text, category, answer: '', confidence: 0 }
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

function TemplateCard({ title, body }) {
  const [copied, setCopied] = useState(false)
  function copy() { navigator.clipboard.writeText(body); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div className="bg-white border border-[#E4EDF5] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-[#263746]">{title}</p>
        <button onClick={copy} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-[#EEF3FA] text-[#6D99F2] hover:bg-[#263746] hover:text-white'}`}>
          <Copy size={11} />{copied ? 'Copied!' : 'Copy'}
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
  const [practiceMode, setPracticeMode] = useState(false)
  const [practiceIdx, setPracticeIdx] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [foundationOpen, setFoundationOpen] = useState(true)

  const interviews = data.interviewPrep || []
  const questions = data.questionBank || []
  const foundation = { ...DEFAULT_FOUNDATION, ...(data.interviewFoundation || {}) }

  // Foundation
  function updFoundation(field, value) { update('interviewFoundation', { ...foundation, [field]: value }) }
  function updStarStory(key, value) { updFoundation('starStories', { ...foundation.starStories, [key]: value }) }
  function toggleNerves(key) { updFoundation('nervesStrategies', { ...foundation.nervesStrategies, [key]: !foundation.nervesStrategies[key] }) }

  // Interview log
  function setInterviews(next) { update('interviewPrep', next) }
  function addInterview() { const n = newInterview(); setInterviews([...interviews, n]); setExpanded(n.id) }
  function removeInterview(id) { setInterviews(interviews.filter(i => i.id !== id)); if (expanded === id) setExpanded(null) }
  function upd(id, field, value) { setInterviews(interviews.map(i => i.id === id ? { ...i, [field]: value } : i)) }
  function updCheck(id, checkField, key) {
    const iv = interviews.find(i => i.id === id)
    upd(id, checkField, { ...(iv[checkField] || {}), [key]: !(iv[checkField] || {})[key] })
  }
  function updList(id, field, idx, value) {
    const iv = interviews.find(i => i.id === id)
    const arr = [...iv[field]]; arr[idx] = value
    upd(id, field, arr)
  }

  // Question bank
  function setQuestions(next) { update('questionBank', next) }
  function addQuestion() { const q = newQuestion(); setQuestions([...questions, q]); setQExpanded(q.id) }
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
  const practiceQuestions = filteredQuestions.filter(q => q.text)
  const practiceQ = practiceQuestions[practiceIdx] || null

  function startPractice() { setPracticeIdx(0); setShowAnswer(false); setPracticeMode(true) }
  function nextPractice() { setShowAnswer(false); setPracticeIdx(i => Math.min(i + 1, practiceQuestions.length - 1)) }
  function prevPractice() { setShowAnswer(false); setPracticeIdx(i => Math.max(i - 1, 0)) }

  return (
    <div className="w-full">

      {/* ── PRACTICE MODE OVERLAY ── */}
      {practiceMode && practiceQ && (
        <div className="fixed inset-0 bg-[#1a2b38]/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl">
            <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-[#EEF3FA]">
              <div>
                <p className="text-xs font-bold text-[#A8BCC8] uppercase tracking-widest mb-0.5">Practice mode</p>
                <p className="text-sm font-semibold text-[#263746]">{practiceIdx + 1} of {practiceQuestions.length}</p>
              </div>
              <button onClick={() => setPracticeMode(false)} className="text-[#7A8FA3] hover:text-[#263746] cursor-pointer text-xs font-semibold bg-[#F0F5FA] px-3 py-1.5 rounded-lg transition-colors">Exit practice</button>
            </div>
            <div className="h-1 bg-[#F0F5FA]">
              <div className="h-full bg-[#6D99F2] transition-all" style={{ width: `${((practiceIdx + 1) / practiceQuestions.length) * 100}%` }} />
            </div>
            <div className="px-7 py-6">
              {practiceQ.category && <span className="inline-block text-xs bg-[#EEF3FA] text-[#4A5C6B] px-2.5 py-1 rounded-full font-medium mb-4">{practiceQ.category}</span>}
              <p className="text-xl font-bold text-[#1a2b38] leading-snug mb-6">{practiceQ.text}</p>
              {!showAnswer ? (
                <button onClick={() => setShowAnswer(true)} className="w-full py-3.5 rounded-xl border-2 border-dashed border-[#D8E4EC] text-sm text-[#7A8FA3] hover:border-[#6D99F2] hover:text-[#6D99F2] cursor-pointer transition-colors font-medium">
                  Show my prepared answer →
                </button>
              ) : (
                <div className="bg-[#F8FBFD] rounded-xl border border-[#EEF3FA] p-4 mb-4">
                  {practiceQ.answer
                    ? <p className="text-sm text-[#263746] leading-relaxed whitespace-pre-wrap">{practiceQ.answer}</p>
                    : <p className="text-sm text-[#B8CAD8] italic">No answer saved yet — add one in the Question Bank.</p>}
                </div>
              )}
              {showAnswer && (
                <div className="flex items-center gap-3 mb-6 mt-4">
                  <span className="text-xs font-semibold text-[#4A5C6B]">How'd that feel?</span>
                  <StarRating value={practiceQ.confidence} onChange={v => updQuestion(practiceQ.id, 'confidence', v)} />
                  {practiceQ.confidence > 0 && <span className="text-xs text-[#7A8FA3]">{['','Not ready','Getting there','Fairly confident','Confident','Nailed it'][practiceQ.confidence]}</span>}
                </div>
              )}
            </div>
            <div className="flex gap-3 px-7 pb-6">
              <button onClick={prevPractice} disabled={practiceIdx === 0} className="flex-1 py-2.5 rounded-xl border border-[#D8E4EC] text-sm font-semibold text-[#4A5C6B] hover:bg-[#F5F9FD] cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed">← Previous</button>
              {practiceIdx < practiceQuestions.length - 1
                ? <button onClick={nextPractice} className="flex-1 py-2.5 rounded-xl bg-[#263746] hover:bg-[#1a2832] text-sm font-semibold text-white cursor-pointer transition-colors">Next →</button>
                : <button onClick={() => setPracticeMode(false)} className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold text-white cursor-pointer transition-colors">Finish 🎉</button>
              }
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Interview Prep</h2>
        <p className="text-sm text-[#7A8FA3]">Build your foundation once. Use it every time.</p>
      </div>

      {/* ── SECTION 1: INTERVIEW FOUNDATION ── */}
      <div className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden mb-6">
        <button
          onClick={() => setFoundationOpen(o => !o)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F5F9FD] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🏗️</span>
            <div className="text-left">
              <p className="text-sm font-bold text-[#263746]">Your Interview Foundation</p>
              <p className="text-xs text-[#7A8FA3]">STAR stories, icebreakers, nerves toolkit — built once, used across every interview</p>
            </div>
          </div>
          {foundationOpen ? <ChevronUp size={16} className="text-[#7A8FA3]" /> : <ChevronDown size={16} className="text-[#7A8FA3]" />}
        </button>

        {foundationOpen && (
          <div className="border-t border-[#EEF3FA] px-6 py-6 space-y-8">

            {/* STAR / SAO Stories */}
            <div>
              <p className="text-xs font-bold text-[#4A5C6B] uppercase tracking-wide mb-1">STAR / SAO Story Bank</p>
              <p className="text-xs text-[#7A8FA3] mb-4">One strong story per competency. These are the experiences you bring to every interview — no matter the company or role.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {STAR_CATEGORIES.map(({ key, label, icon, prompt }) => (
                  <div key={key} className="bg-[#F8FBFD] rounded-xl border border-[#EEF3FA] p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{icon}</span>
                      <p className="text-sm font-semibold text-[#263746]">{label}</p>
                    </div>
                    <p className="text-xs text-[#7A8FA3] mb-2 italic leading-relaxed">{prompt}</p>
                    <textarea
                      className={`${textareaCls} text-xs`}
                      rows={4}
                      value={foundation.starStories[key] || ''}
                      onChange={e => updStarStory(key, e.target.value)}
                      placeholder="Situation / Task → Action → Result"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Icebreakers + Talking Points */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-[#4A5C6B] uppercase tracking-wide mb-1">Icebreakers</p>
                <p className="text-xs text-[#7A8FA3] mb-3">Things you like to open with — to warm up the room and come across as human.</p>
                <textarea
                  className={`${textareaCls} text-xs`}
                  rows={5}
                  value={foundation.icebreakers || ''}
                  onChange={e => updFoundation('icebreakers', e.target.value)}
                  placeholder="e.g. Comment on something specific about their work, mention a mutual connection, ask about a recent company milestone..."
                />
              </div>
              <div>
                <p className="text-xs font-bold text-[#4A5C6B] uppercase tracking-wide mb-1">General Key Talking Points</p>
                <p className="text-xs text-[#7A8FA3] mb-3">Your core themes — the things you want every interviewer to leave knowing about you.</p>
                <textarea
                  className={`${textareaCls} text-xs`}
                  rows={5}
                  value={foundation.generalTalkingPoints || ''}
                  onChange={e => updFoundation('generalTalkingPoints', e.target.value)}
                  placeholder="e.g. I'm a connector of people and ideas. I make complex things simple. I've always worked in fast-moving environments..."
                />
              </div>
            </div>

            {/* Nerves Toolkit */}
            <div>
              <p className="text-xs font-bold text-[#4A5C6B] uppercase tracking-wide mb-1">If You're Nervous, These Things Help</p>
              <p className="text-xs text-[#7A8FA3] mb-3">Tick what works for you — then add anything else in your own words.</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {NERVES_STRATEGIES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleNerves(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border ${
                      foundation.nervesStrategies[key]
                        ? 'bg-[#263746] text-white border-[#263746]'
                        : 'bg-white text-[#4A5C6B] border-[#D8E4EC] hover:border-[#6D99F2] hover:text-[#6D99F2]'
                    }`}
                  >
                    {foundation.nervesStrategies[key] && <CheckCircle2 size={11} className="flex-shrink-0" />}
                    {label}
                  </button>
                ))}
              </div>
              <textarea
                className={`${textareaCls} text-xs`}
                rows={2}
                value={foundation.nervesNotes || ''}
                onChange={e => updFoundation('nervesNotes', e.target.value)}
                placeholder="Anything else that helps... e.g. listen to a specific song, call a friend first, write out your wins the night before"
              />
            </div>

          </div>
        )}
      </div>

      {/* ── SECTION 2: INTERVIEW LOG ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-[#263746] font-['Inter']">Interview Log</h3>
          <p className="text-xs text-[#7A8FA3]">One entry per interview — prep before, follow up after.</p>
        </div>
        <button onClick={addInterview} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
          <Plus size={16} /> Add interview
        </button>
      </div>

      {interviews.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] p-10 text-center mb-6">
          <div className="text-4xl mb-3">🎤</div>
          <p className="text-[#263746] font-semibold text-base mb-2">Got an interview coming up?</p>
          <p className="text-[#7A8FA3] text-sm max-w-md mx-auto leading-relaxed">Add it here. Do your company research, prep your talking points — then come back after to log the follow-up and outcome.</p>
          <button onClick={addInterview} className="mt-5 inline-flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-colors">
            <Plus size={16} /> Add your first interview
          </button>
        </div>
      )}

      <div className="space-y-3 mb-10">
        {interviews.map(iv => {
          const prepCount = Object.values(iv.prepChecks || {}).filter(Boolean).length
          const afterCount = Object.values(iv.afterChecks || {}).filter(Boolean).length
          const isExp = expanded === iv.id
          return (
            <div key={iv.id} className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#F5F9FD]" onClick={() => setExpanded(isExp ? null : iv.id)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#263746] truncate">{iv.company || 'Untitled company'}</p>
                  <p className="text-xs text-[#7A8FA3] truncate">{iv.role || 'No role'}{iv.date ? ` · ${iv.date}` : ''}{iv.stage ? ` · ${iv.stage}` : ''}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-[#7A8FA3]">{prepCount}/{PREP_CHECKS.length} prep</span>
                  {afterCount > 0 && <span className="text-xs text-emerald-600 font-medium">{afterCount}/{AFTER_CHECKS.length} after</span>}
                  {iv.progressing && <span className="hidden sm:block text-xs px-2 py-0.5 rounded-full font-medium bg-[#EEF3FA] text-[#4A5C6B]">{iv.progressing}</span>}
                </div>
                <button onClick={e => { e.stopPropagation(); removeInterview(iv.id) }} className="text-[#D8E4EC] hover:text-[#FF5E5B] transition-colors cursor-pointer"><Trash2 size={14} /></button>
                <ChevronDown size={16} className={`text-[#7A8FA3] transition-transform flex-shrink-0 ${isExp ? 'rotate-180' : ''}`} />
              </div>

              {isExp && (
                <div className="border-t border-[#EEF3FA] px-5 py-5 space-y-5">

                  {/* Details */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Role</label><input className={`${inputCls} text-xs`} value={iv.role} onChange={e => upd(iv.id,'role',e.target.value)} placeholder="Job role" /></div>
                    <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Company</label><input className={`${inputCls} text-xs`} value={iv.company} onChange={e => upd(iv.id,'company',e.target.value)} placeholder="Company" /></div>
                    <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Date</label><input className={`${inputCls} text-xs`} type="date" value={iv.date} onChange={e => upd(iv.id,'date',e.target.value)} /></div>
                    <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Stage</label><input className={`${inputCls} text-xs`} value={iv.stage} onChange={e => upd(iv.id,'stage',e.target.value)} placeholder="e.g. First round" /></div>
                    <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Format</label><input className={`${inputCls} text-xs`} value={iv.format} onChange={e => upd(iv.id,'format',e.target.value)} placeholder="e.g. Video call" /></div>
                    <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">What do you want them to remember you for?</label><input className={`${inputCls} text-xs`} value={iv.wantRememberedFor || ''} onChange={e => upd(iv.id,'wantRememberedFor',e.target.value)} placeholder="e.g. Calm, strategic, people-first" /></div>
                  </div>

                  {/* BEFORE */}
                  <div className="bg-[#F8FBFD] rounded-xl border border-[#EEF3FA] p-4 space-y-4">
                    <p className="text-xs font-bold text-[#4A5C6B] uppercase tracking-wide">Before the interview</p>

                    <div>
                      <p className="text-xs font-medium text-[#4A5C6B] mb-2">Prep checklist</p>
                      <div className="flex flex-wrap gap-x-5 gap-y-2">
                        {PREP_CHECKS.map(({ key, label }) => (
                          <button key={key} onClick={() => updCheck(iv.id, 'prepChecks', key)} className="flex items-center gap-2 cursor-pointer">
                            {(iv.prepChecks || {})[key] ? <CheckCircle2 size={15} className="text-[#6D99F2]" /> : <Circle size={15} className="text-[#D8E4EC]" />}
                            <span className={`text-xs ${(iv.prepChecks || {})[key] ? 'text-[#263746] font-medium' : 'text-[#4A5C6B]'}`}>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-[#4A5C6B] mb-2">Company insights & talking points for this role</p>
                      <div className="space-y-2">
                        {iv.companyInsights.map((s, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-[#7A8FA3] w-4 flex-shrink-0">{i+1}.</span>
                            <input className={`${inputCls} text-xs`} value={s} onChange={e => updList(iv.id,'companyInsights',i,e.target.value)} placeholder="Key insight about this company, their challenges, their culture..." />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-[#4A5C6B] mb-2">Talking points for this interview</p>
                        <div className="space-y-2">
                          {iv.talkingPoints.map((s, i) => (
                            <input key={i} className={`${inputCls} text-xs`} value={s} onChange={e => updList(iv.id,'talkingPoints',i,e.target.value)} placeholder={`Talking point ${i+1}`} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#4A5C6B] mb-2">Questions to ask them</p>
                        <div className="space-y-2">
                          {iv.questionsForThem.map((s, i) => (
                            <input key={i} className={`${inputCls} text-xs`} value={s} onChange={e => updList(iv.id,'questionsForThem',i,e.target.value)} placeholder={`Question ${i+1}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AFTER */}
                  <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 space-y-4">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">After the interview</p>

                    <div>
                      <p className="text-xs font-medium text-[#4A5C6B] mb-2">Follow-up checklist</p>
                      <div className="flex flex-wrap gap-x-5 gap-y-2">
                        {AFTER_CHECKS.map(({ key, label }) => (
                          <button key={key} onClick={() => updCheck(iv.id, 'afterChecks', key)} className="flex items-center gap-2 cursor-pointer">
                            {(iv.afterChecks || {})[key] ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Circle size={15} className="text-[#D8E4EC]" />}
                            <span className={`text-xs ${(iv.afterChecks || {})[key] ? 'text-emerald-700 font-medium' : 'text-[#4A5C6B]'}`}>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Is it progressing?</label>
                        <select className={`${inputCls} text-xs`} value={iv.progressing || ''} onChange={e => upd(iv.id,'progressing',e.target.value)}>
                          <option value="">Not yet known</option>
                          <option value="Yes — next stage">Yes — next stage</option>
                          <option value="Waiting to hear">Waiting to hear</option>
                          <option value="Offer received">Offer received</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Feedback received</label>
                        <input className={`${inputCls} text-xs`} value={iv.feedbackReceived || ''} onChange={e => upd(iv.id,'feedbackReceived',e.target.value)} placeholder="What did they say?" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Debrief notes</label>
                      <textarea className={`${textareaCls} text-xs`} rows={3} value={iv.debriefNotes || ''} onChange={e => upd(iv.id,'debriefNotes',e.target.value)} placeholder="How did it go? What went well? What would you do differently next time?" />
                    </div>
                  </div>

                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── SECTION 3: QUESTION BANK ── */}
      <div>
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
            {practiceQuestions.length >= 2 && (
              <button onClick={startPractice} className="flex items-center gap-2 border border-[#6D99F2] text-[#6D99F2] hover:bg-[#EEF3FA] text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
                ▶ Practice
              </button>
            )}
            <button onClick={addQuestion} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
              <Plus size={16} /> Add question
            </button>
          </div>
        </div>

        {questions.length > 0 && (
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <span className="text-xs text-[#7A8FA3]">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
            {avgConfidence && <span className="text-xs text-[#7A8FA3]">Avg confidence: <span className="font-semibold text-[#263746]">{avgConfidence}/5</span></span>}
            <div className="flex gap-1.5 flex-wrap ml-auto">
              <button onClick={() => setFilterCat('')} className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${!filterCat ? 'bg-[#263746] text-white' : 'bg-[#EEF3FA] text-[#4A5C6B] hover:bg-[#D8E4EC]'}`}>All</button>
              {Q_CATEGORIES.map(cat => questions.some(q => q.category === cat) && (
                <button key={cat} onClick={() => setFilterCat(cat === filterCat ? '' : cat)} className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${filterCat === cat ? 'bg-[#263746] text-white' : 'bg-[#EEF3FA] text-[#4A5C6B] hover:bg-[#D8E4EC]'}`}>{cat}</button>
              ))}
            </div>
          </div>
        )}

        {questions.length === 0 && (
          <div className="bg-white rounded-xl border border-[#D8E4EC] p-10 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-[#263746] font-semibold text-base mb-2">Build your answer library</p>
            <p className="text-[#7A8FA3] text-sm max-w-md mx-auto leading-relaxed mb-5">Practise makes permanent. Load the starter questions or add your own, write your answers, and rate your confidence until every answer is solid.</p>
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
                <div className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-[#F5F9FD]" onClick={() => setQExpanded(qExpanded === q.id ? null : q.id)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#263746] truncate">{q.text || 'New question'}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {q.category && <span className="hidden sm:block text-xs bg-[#EEF3FA] text-[#4A5C6B] px-2 py-0.5 rounded-full">{q.category}</span>}
                    {q.confidence > 0 && <span className={`text-xs font-semibold ${confColor}`}>{q.confidence}/5</span>}
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
                      <textarea className={textareaCls} rows={4} value={q.answer} onChange={e => updQuestion(q.id,'answer',e.target.value)} placeholder="Write your prepared answer — use STAR format for behavioural questions" />
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

      {/* ── SECTION 4: EMAIL TEMPLATES ── */}
      <div className="mt-10">
        <button onClick={() => setShowEmailTemplates(t => !t)} className="flex items-center gap-2 text-sm font-semibold text-[#263746] mb-4 cursor-pointer">
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
                body: `Hi [Name],\n\nThank you for the opportunity to interview for the [Role] position. After careful consideration, I have decided to withdraw my application at this stage.\n\nThis was not an easy decision — the role and team were genuinely appealing. However, [brief reason if appropriate].\n\nI hope our paths cross again in the future.\n\nKind regards,\n[Your Name]`,
              },
              {
                title: 'Asking for feedback after rejection',
                body: `Hi [Name],\n\nThank you for letting me know the outcome of the [Role] process. While I'm disappointed, I appreciate you taking the time to inform me.\n\nIf possible, I'd be grateful for any feedback on my application or interviews. Understanding where I could improve would be really valuable as I continue my search.\n\nThank you again for your time and consideration.\n\nBest,\n[Your Name]`,
              },
            ].map(t => <TemplateCard key={t.title} {...t} />)}
          </div>
        )}
      </div>

    </div>
  )
}
