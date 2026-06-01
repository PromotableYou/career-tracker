import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Trash2, ChevronDown, ExternalLink, Info, LayoutGrid, List } from 'lucide-react'
import FileUpload from '../components/FileUpload'

const STATUS_OPTIONS = ['Not Started', 'Researching', 'Applied', 'Awaiting Response', 'Interview Scheduled', 'Offer Received', 'Rejected', 'Withdrawn']
const OUTCOME_OPTIONS = ['', 'Progressing', 'Rejected', 'Offer', 'Withdrawn', 'Awaiting']
const OUTREACH_TYPES = ['Call', 'Email', 'LinkedIn message', 'Received response']
const WORK_TYPES = ['', 'Remote', 'Hybrid', 'On-site']
const WORK_TYPE_COLORS = {
  'Remote': 'bg-emerald-50 text-emerald-700',
  'Hybrid': 'bg-blue-50 text-blue-700',
  'On-site': 'bg-amber-50 text-amber-700',
}
const STATUS_COLORS = {
  'Not Started': 'bg-[#F5F9FD] text-[#7A8FA3]',
  'Researching': 'bg-[#EEF3FA] text-[#6D99F2]',
  'Applied': 'bg-[#263746]/10 text-[#263746]',
  'Awaiting Response': 'bg-amber-50 text-amber-700',
  'Interview Scheduled': 'bg-[#FBD872]/20 text-amber-800',
  'Offer Received': 'bg-emerald-50 text-emerald-700',
  'Rejected': 'bg-red-50 text-[#FF5E5B]',
  'Withdrawn': 'bg-[#F5F9FD] text-[#7A8FA3]',
}
const BP_CATEGORIES = [
  { key: 'company', label: 'The Company' },
  { key: 'culture', label: 'The Culture' },
  { key: 'team', label: 'The Team' },
  { key: 'manager', label: 'Your Manager' },
  { key: 'tasks', label: 'Your Tasks' },
  { key: 'values', label: 'What you Value' },
  { key: 'environment', label: 'The Environment' },
  { key: 'salary', label: 'Salary / Benefits' },
]
const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-2 py-1.5 text-xs text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"

function getAlignmentMeta(ratings) {
  const total = BP_CATEGORIES.reduce((sum, c) => sum + (parseInt(ratings?.[c.key]) || 0), 0)
  const max = BP_CATEGORIES.length * 5
  const pct = total / max
  const color = pct >= 0.7 ? 'emerald' : pct >= 0.4 ? 'amber' : 'red'
  return { total, max, pct, color }
}

function AlignmentPill({ ratings }) {
  const { total, max, pct, color } = getAlignmentMeta(ratings)
  if (total === 0) return null
  const fillColor = color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-400' : 'bg-[#FF5E5B]'
  const textColor = color === 'emerald' ? 'text-emerald-600' : color === 'amber' ? 'text-amber-600' : 'text-[#FF5E5B]'
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <div className="w-16 h-2.5 bg-[#EEF3FA] rounded-full overflow-hidden border border-[#D8E4EC]">
        <div className={`h-full rounded-full transition-all duration-300 ${fillColor}`} style={{ width: `${pct * 100}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${textColor}`}>{total}/{max}</span>
    </div>
  )
}

function newApp() {
  return {
    id: Date.now(), status: 'Not Started', jobRole: '', company: '', jobUrl: '', alignment: '', why: '',
    blueprintRatings: {}, selectedResume: '',
    connectedHM: false, connectionMsg: false, hmContact: '', hmRole: '',
    notes: '', resumeLink: '', coverLetterLink: '', closeDate: '', submittedDate: '',
    followUpDate: '', followUpDone: false,
    outcome: '', interviewDate: '', interviewStage: '', prepDone: false,
    interviewOutcome: '', feedback: '', additionalNotes: '',
    outreachLog: [], jobDescription: '', location: '', workType: '', todos: [],
    salaryAdvertised: '', salaryTarget: '', salaryHighest: '', salaryLowest: '', salaryNonFinancial: '',
    offerDate: '', offerAmount: '', offerDeadline: '', offerDecision: '', offerNotes: '',
  }
}

// ── ExpandedForm is defined OUTSIDE RoleTracker so it never gets recreated on re-render ──
function ExpandedForm({
  app, blueprint, resumeOptions,
  updateApp, updateRating,
  addOutreach, updateOutreach, removeOutreach,
  addTodo, updateTodo, removeTodo, quickAddTodo,
}) {
  const today = new Date().toISOString().slice(0, 10)
  const followUpOverdue = app.followUpDate && app.followUpDate < today && !app.followUpDone

  return (
    <div className="px-5 py-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Status</label>
          <select className={inputCls} value={app.status} onChange={e => updateApp(app.id, 'status', e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Job Role</label>
          <input className={inputCls} value={app.jobRole} onChange={e => updateApp(app.id, 'jobRole', e.target.value)} placeholder="e.g. Senior Product Manager" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Company</label>
          <input className={inputCls} value={app.company} onChange={e => updateApp(app.id, 'company', e.target.value)} placeholder="Company name" />
        </div>
        <div className="col-span-2 lg:col-span-3">
          <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Job Listing URL</label>
          <div className="flex gap-1.5">
            <input className={`${inputCls} flex-1`} type="url" value={app.jobUrl || ''} onChange={e => updateApp(app.id, 'jobUrl', e.target.value)} placeholder="Paste the link to the job posting" />
            {app.jobUrl && <a href={app.jobUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-white bg-[#6D99F2] hover:bg-[#263746] px-3 rounded-lg transition-colors flex-shrink-0"><ExternalLink size={12} /> View</a>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Close Date</label>
          <input className={inputCls} type="date" value={app.closeDate} onChange={e => updateApp(app.id, 'closeDate', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Submitted Date</label>
          <input className={inputCls} type="date" value={app.submittedDate} onChange={e => updateApp(app.id, 'submittedDate', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Follow-up Date</label>
          <input className={`${inputCls} ${followUpOverdue ? 'border-red-400 text-red-600' : ''}`} type="date" value={app.followUpDate || ''} onChange={e => updateApp(app.id, 'followUpDate', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Resume Used</label>
          <select className={inputCls} value={app.selectedResume || ''} onChange={e => updateApp(app.id, 'selectedResume', e.target.value)}>
            {resumeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Work Type</label>
          <select className={inputCls} value={app.workType || ''} onChange={e => updateApp(app.id, 'workType', e.target.value)}>
            {WORK_TYPES.map(o => <option key={o} value={o}>{o || 'Select work type'}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Location / City</label>
          <input className={inputCls} value={app.location || ''} onChange={e => updateApp(app.id, 'location', e.target.value)} placeholder="e.g. Sydney, Melbourne, Brisbane" />
        </div>
        <div className="col-span-2 lg:col-span-3">
          <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Why this role?</label>
          <textarea className={inputCls} rows={2} value={app.why} onChange={e => updateApp(app.id, 'why', e.target.value)} placeholder="Your motivation for applying" />
        </div>
      </div>

      {/* Blueprint Alignment */}
      <div className="mt-4 pt-4 border-t border-[#EEF3FA]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide">Blueprint Alignment</p>
            <p className="text-[10px] text-[#7A8FA3] mt-0.5">Rate how well this role matches your Career Blueprint (1 = poor, 5 = perfect)</p>
          </div>
          {(() => {
            const { total, max, pct, color } = getAlignmentMeta(app.blueprintRatings)
            if (total === 0) return null
            const textColor = color === 'emerald' ? 'text-emerald-600' : color === 'amber' ? 'text-amber-600' : 'text-[#FF5E5B]'
            const verdict = pct >= 0.7 ? 'Strong fit' : pct >= 0.4 ? 'Partial fit' : 'Weak fit'
            return (
              <div className="text-right">
                <p className={`text-sm font-bold ${textColor}`}>{total}/{max}</p>
                <p className={`text-[10px] font-medium ${textColor}`}>{verdict}</p>
              </div>
            )
          })()}
        </div>
        {(() => {
          const { pct, color, total } = getAlignmentMeta(app.blueprintRatings)
          const fillColor = color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-400' : 'bg-[#FF5E5B]'
          return total > 0 ? (
            <div className="w-full h-3 bg-[#EEF3FA] rounded-full overflow-hidden mb-4 border border-[#D8E4EC]">
              <div className={`h-full rounded-full transition-all duration-300 ${fillColor}`} style={{ width: `${pct * 100}%` }} />
            </div>
          ) : null
        })()}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {BP_CATEGORIES.map(({ key, label }) => (
            <div key={key} className="relative group">
              <label className="flex items-center gap-1 text-[10px] font-medium text-[#4A5C6B] mb-1 cursor-default">
                {label}
                <Info size={10} className="text-[#7A8FA3] flex-shrink-0" />
              </label>
              <div className="absolute bottom-full left-0 mb-1.5 z-20 w-56 bg-[#263746] text-white text-[11px] rounded-lg px-3 py-2.5 hidden group-hover:block shadow-xl pointer-events-none">
                {blueprint[key] ? blueprint[key] : <span className="italic text-white/50">Not filled in yet — go to My Profile to add this.</span>}
                <div className="absolute top-full left-4 border-4 border-transparent border-t-[#263746]" />
              </div>
              <select className={inputCls} value={app.blueprintRatings?.[key] ?? ''} onChange={e => updateRating(app.id, key, e.target.value)}>
                <option value="">--</option>
                <option value="1">1 - Poor</option>
                <option value="2">2 - Low</option>
                <option value="3">3 - Okay</option>
                <option value="4">4 - Good</option>
                <option value="5">5 - Perfect</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* HM / Recruiter */}
      <div className="mt-4 pt-4 border-t border-[#EEF3FA]">
        <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide mb-3">HM / Recruiter</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id={`hm-${app.id}`} checked={app.connectedHM} onChange={e => updateApp(app.id, 'connectedHM', e.target.checked)} className="accent-[#263746]" />
            <label htmlFor={`hm-${app.id}`} className="text-xs text-[#4A5C6B]">Connected with HM/Recruiter</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id={`msg-${app.id}`} checked={app.connectionMsg} onChange={e => updateApp(app.id, 'connectionMsg', e.target.checked)} className="accent-[#263746]" />
            <label htmlFor={`msg-${app.id}`} className="text-xs text-[#4A5C6B]">Connection message sent</label>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A5C6B] mb-1">HM/Recruiter Contact</label>
            <input className={inputCls} value={app.hmContact} onChange={e => updateApp(app.id, 'hmContact', e.target.value)} placeholder="Email or LinkedIn" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A5C6B] mb-1">HM/Recruiter Role/Title</label>
            <input className={inputCls} value={app.hmRole} onChange={e => updateApp(app.id, 'hmRole', e.target.value)} placeholder="e.g. Hiring Manager" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Conversation Notes</label>
            <textarea className={inputCls} rows={2} value={app.notes} onChange={e => updateApp(app.id, 'notes', e.target.value)} placeholder="Notes from your conversation" />
          </div>
        </div>
      </div>

      {/* Job Description */}
      <div className="mt-4 pt-4 border-t border-[#EEF3FA]">
        <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide mb-3">Job Description</p>
        <textarea className={inputCls} rows={6} value={app.jobDescription || ''} onChange={e => updateApp(app.id, 'jobDescription', e.target.value)} placeholder="Paste the full job description here — useful for tailoring your resume and prep..." />
      </div>

      {/* Documents */}
      <div className="mt-4 pt-4 border-t border-[#EEF3FA]">
        <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide mb-3">Documents</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <FileUpload label="Resume" value={app.resumeFile} onChange={file => updateApp(app.id, 'resumeFile', file)} />
            <div className="flex items-center gap-2"><div className="h-px flex-1 bg-[#D8E4EC]" /><span className="text-[10px] text-[#7A8FA3]">or link</span><div className="h-px flex-1 bg-[#D8E4EC]" /></div>
            <div className="flex gap-1.5">
              <input className={`${inputCls} flex-1`} type="url" value={app.resumeLink} onChange={e => updateApp(app.id, 'resumeLink', e.target.value)} placeholder="Paste Drive link" />
              {app.resumeLink && <a href={app.resumeLink} target="_blank" rel="noreferrer" className="text-[#6D99F2] hover:text-[#263746]"><ExternalLink size={16} /></a>}
            </div>
          </div>
          <div className="space-y-2">
            <FileUpload label="Cover Letter" value={app.coverLetterFile} onChange={file => updateApp(app.id, 'coverLetterFile', file)} />
            <div className="flex items-center gap-2"><div className="h-px flex-1 bg-[#D8E4EC]" /><span className="text-[10px] text-[#7A8FA3]">or link</span><div className="h-px flex-1 bg-[#D8E4EC]" /></div>
            <div className="flex gap-1.5">
              <input className={`${inputCls} flex-1`} type="url" value={app.coverLetterLink} onChange={e => updateApp(app.id, 'coverLetterLink', e.target.value)} placeholder="Paste Drive link" />
              {app.coverLetterLink && <a href={app.coverLetterLink} target="_blank" rel="noreferrer" className="text-[#6D99F2] hover:text-[#263746]"><ExternalLink size={16} /></a>}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {(app.status === 'Rejected' || app.status === 'Interview Scheduled' || app.status === 'Offer Received' || app.feedback) && (
        <div className="mt-4 pt-4 border-t border-[#EEF3FA]">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">Feedback Received</p>
            <textarea
              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-amber-300/40 bg-white placeholder:text-[#7A8FA3] resize-none"
              rows={3}
              value={app.feedback}
              onChange={e => updateApp(app.id, 'feedback', e.target.value)}
              placeholder="What feedback did you receive? What would you do differently?"
            />
          </div>
        </div>
      )}

      {/* Interview & Outcome */}
      <div className="mt-4 pt-4 border-t border-[#EEF3FA]">
        <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide mb-3">Interview & Outcome</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Interview Date</label>
            <input className={inputCls} type="date" value={app.interviewDate} onChange={e => updateApp(app.id, 'interviewDate', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Interview Stage</label>
            <input className={inputCls} value={app.interviewStage} onChange={e => updateApp(app.id, 'interviewStage', e.target.value)} placeholder="e.g. First round" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Outcome</label>
            <select className={inputCls} value={app.outcome} onChange={e => updateApp(app.id, 'outcome', e.target.value)}>
              {OUTCOME_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id={`prep-${app.id}`} checked={app.prepDone} onChange={e => updateApp(app.id, 'prepDone', e.target.checked)} className="accent-[#263746]" />
            <label htmlFor={`prep-${app.id}`} className="text-xs text-[#4A5C6B]">Interview prep completed</label>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Interview Outcome</label>
            <input className={inputCls} value={app.interviewOutcome} onChange={e => updateApp(app.id, 'interviewOutcome', e.target.value)} placeholder="e.g. Progressed to next round" />
          </div>
          <div className="col-span-2 lg:col-span-3">
            <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Additional Notes</label>
            <textarea className={inputCls} rows={2} value={app.additionalNotes} onChange={e => updateApp(app.id, 'additionalNotes', e.target.value)} placeholder="Anything else" />
          </div>
        </div>
      </div>

      {/* Outreach Log */}
      <div className="mt-4 pt-4 border-t border-[#EEF3FA]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide">Outreach Log</p>
          <button onClick={() => addOutreach(app.id)} className="flex items-center gap-1 text-xs text-[#6D99F2] hover:text-[#263746] cursor-pointer font-medium transition-colors">
            <Plus size={12} /> Log interaction
          </button>
        </div>
        {(app.outreachLog || []).length === 0 ? (
          <p className="text-xs text-[#7A8FA3] italic">No outreach logged yet. Track every call, email and message here.</p>
        ) : (
          <div className="space-y-2">
            {[...(app.outreachLog || [])].sort((a, b) => b.date.localeCompare(a.date)).map(o => (
              <div key={o.id} className="grid grid-cols-[auto_auto_1fr_auto] gap-2 items-center bg-[#F8F5F2] rounded-lg px-3 py-2">
                <input className="border border-[#D8E4EC] rounded px-2 py-1 text-xs bg-white focus:outline-none w-28 flex-shrink-0" type="date" value={o.date} onChange={e => updateOutreach(app.id, o.id, 'date', e.target.value)} />
                <select className="border border-[#D8E4EC] rounded px-2 py-1 text-xs bg-white focus:outline-none flex-shrink-0" value={o.type} onChange={e => updateOutreach(app.id, o.id, 'type', e.target.value)}>
                  {OUTREACH_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <input className="bg-transparent text-xs text-[#263746] focus:outline-none border-b border-dashed border-[#D8E4EC] focus:border-[#6D99F2] placeholder:text-[#7A8FA3] min-w-0" value={o.notes} onChange={e => updateOutreach(app.id, o.id, 'notes', e.target.value)} placeholder="What happened? Any response?" />
                <button onClick={() => removeOutreach(app.id, o.id)} className="text-[#D8E4EC] hover:text-[#FF5E5B] transition-colors cursor-pointer flex-shrink-0"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* To-Do */}
      <div className="mt-4 pt-4 border-t border-[#EEF3FA]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide">To-Do</p>
          <button onClick={() => addTodo(app.id)} className="flex items-center gap-1 text-xs text-[#6D99F2] hover:text-[#263746] cursor-pointer font-medium transition-colors">
            <Plus size={12} /> Add task
          </button>
        </div>
        {(app.todos || []).map(t => (
          <div key={t.id} className="flex items-center gap-2 py-1.5">
            <input type="checkbox" checked={t.done} onChange={e => updateTodo(app.id, t.id, 'done', e.target.checked)} className="accent-[#263746]" />
            <input
              className={`flex-1 bg-transparent text-xs focus:outline-none border-b border-dashed border-[#D8E4EC] focus:border-[#6D99F2] ${t.done ? 'line-through text-[#7A8FA3]' : 'text-[#263746]'}`}
              value={t.text}
              onChange={e => updateTodo(app.id, t.id, 'text', e.target.value)}
              placeholder="e.g. Send thank-you email"
            />
            <button onClick={() => removeTodo(app.id, t.id)} className="text-[#D8E4EC] hover:text-[#FF5E5B] cursor-pointer transition-colors"><Trash2 size={13} /></button>
          </div>
        ))}
        {(app.todos || []).length === 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {['Tailor resume', 'Write cover letter', 'Research company', 'Connect on LinkedIn', 'Send thank-you email', 'Prepare for interview'].map(t => (
              <button key={t} onClick={() => quickAddTodo(app.id, t)} className="text-xs px-2.5 py-1 rounded-full bg-[#EEF3FA] text-[#4A5C6B] hover:bg-[#263746] hover:text-white cursor-pointer transition-colors">
                + {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Salary & Offer */}
      <div className="mt-4 pt-4 border-t border-[#EEF3FA]">
        <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide mb-3">Salary & Offer</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Advertised Salary</label>
            <input className={inputCls} value={app.salaryAdvertised || ''} onChange={e => updateApp(app.id, 'salaryAdvertised', e.target.value)} placeholder="e.g. $90,000" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Your Target Salary</label>
            <input className={inputCls} value={app.salaryTarget || ''} onChange={e => updateApp(app.id, 'salaryTarget', e.target.value)} placeholder="e.g. $105,000" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Highest $ You'd Accept</label>
            <input className={inputCls} value={app.salaryHighest || ''} onChange={e => updateApp(app.id, 'salaryHighest', e.target.value)} placeholder="e.g. $110,000" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Lowest $ You'd Accept</label>
            <input className={inputCls} value={app.salaryLowest || ''} onChange={e => updateApp(app.id, 'salaryLowest', e.target.value)} placeholder="e.g. $85,000" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Non-Financial Value</label>
            <input className={inputCls} value={app.salaryNonFinancial || ''} onChange={e => updateApp(app.id, 'salaryNonFinancial', e.target.value)} placeholder="e.g. Flexible WFH, extra leave, career progression" />
          </div>
        </div>
        {(app.status === 'Offer Received' || app.offerAmount || app.offerDate) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-3">Offer Details</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-emerald-700 mb-1">Offer Date</label>
                <input className="w-full border border-emerald-200 rounded-lg px-2 py-1.5 text-xs bg-white text-[#263746] focus:outline-none" type="date" value={app.offerDate || ''} onChange={e => updateApp(app.id, 'offerDate', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-700 mb-1">Offered Amount</label>
                <input className="w-full border border-emerald-200 rounded-lg px-2 py-1.5 text-xs bg-white text-[#263746] focus:outline-none" value={app.offerAmount || ''} onChange={e => updateApp(app.id, 'offerAmount', e.target.value)} placeholder="e.g. $95,000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-700 mb-1">Deadline to Decide</label>
                <input className="w-full border border-emerald-200 rounded-lg px-2 py-1.5 text-xs bg-white text-[#263746] focus:outline-none" type="date" value={app.offerDeadline || ''} onChange={e => updateApp(app.id, 'offerDeadline', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-700 mb-1">Decision</label>
                <select className="w-full border border-emerald-200 rounded-lg px-2 py-1.5 text-xs bg-white text-[#263746] focus:outline-none" value={app.offerDecision || ''} onChange={e => updateApp(app.id, 'offerDecision', e.target.value)}>
                  <option value="">Not decided</option>
                  <option value="Accept">Accept</option>
                  <option value="Negotiate">Negotiate</option>
                  <option value="Decline">Decline</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-emerald-700 mb-1">Negotiation Notes</label>
                <input className="w-full border border-emerald-200 rounded-lg px-2 py-1.5 text-xs bg-white text-[#263746] focus:outline-none placeholder:text-[#7A8FA3]" value={app.offerNotes || ''} onChange={e => updateApp(app.id, 'offerNotes', e.target.value)} placeholder="Negotiation strategy, counter offer, notes..." />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RoleTracker() {
  const { data, update } = useData()
  const [expanded, setExpanded] = useState(null)
  const [viewMode, setViewMode] = useState('cards')
  const apps = data.applications || []
  const resumeVersions = data.resumeVersions || []
  const blueprint = data.blueprint || {}

  const resumeOptions = [
    { value: '', label: 'Select resume used' },
    { value: 'master', label: 'Master Resume' },
    ...resumeVersions.filter(v => v.roleName).map(v => ({ value: v.id.toString(), label: v.roleName })),
  ]

  function setApps(next) { update('applications', next) }
  function addApp() {
    const next = [...apps, newApp()]
    setApps(next)
    setExpanded(next[next.length - 1].id)
  }
  function removeApp(id) { setApps(apps.filter(a => a.id !== id)); if (expanded === id) setExpanded(null) }
  function updateApp(id, field, value) {
    setApps(apps.map(a => {
      if (a.id !== id) return a
      const updated = { ...a, [field]: value }
      if (field === 'status' && value === 'Applied' && !a.submittedDate) {
        updated.submittedDate = new Date().toISOString().slice(0, 10)
      }
      return updated
    }))
  }
  function updateRating(id, catKey, value) {
    setApps(apps.map(a => a.id === id ? { ...a, blueprintRatings: { ...a.blueprintRatings, [catKey]: value } } : a))
  }
  function addOutreach(appId) {
    const entry = { id: Date.now(), type: 'Email', date: new Date().toISOString().slice(0, 10), contact: '', notes: '' }
    setApps(apps.map(a => a.id === appId ? { ...a, outreachLog: [...(a.outreachLog || []), entry] } : a))
  }
  function updateOutreach(appId, oId, field, value) {
    setApps(apps.map(a => a.id !== appId ? a : { ...a, outreachLog: (a.outreachLog || []).map(o => o.id === oId ? { ...o, [field]: value } : o) }))
  }
  function removeOutreach(appId, oId) {
    setApps(apps.map(a => a.id !== appId ? a : { ...a, outreachLog: (a.outreachLog || []).filter(o => o.id !== oId) }))
  }
  function addTodo(appId) {
    setApps(apps.map(a => a.id === appId ? { ...a, todos: [...(a.todos || []), { id: Date.now(), text: '', done: false }] } : a))
  }
  function updateTodo(appId, tId, field, value) {
    setApps(apps.map(a => a.id !== appId ? a : { ...a, todos: (a.todos || []).map(t => t.id === tId ? { ...t, [field]: value } : t) }))
  }
  function removeTodo(appId, tId) {
    setApps(apps.map(a => a.id !== appId ? a : { ...a, todos: (a.todos || []).filter(t => t.id !== tId) }))
  }
  function quickAddTodo(appId, text) {
    setApps(apps.map(a => a.id === appId ? { ...a, todos: [...(a.todos || []), { id: Date.now(), text, done: false }] } : a))
  }

  const pipelineCounts = {
    'Researching': apps.filter(a => a.status === 'Researching').length,
    'Applied': apps.filter(a => a.status === 'Applied').length,
    'Interview': apps.filter(a => a.status === 'Interview Scheduled').length,
    'Offer': apps.filter(a => a.status === 'Offer Received').length,
  }

  const formProps = { blueprint, resumeOptions, updateApp, updateRating, addOutreach, updateOutreach, removeOutreach, addTodo, updateTodo, removeTodo, quickAddTodo }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Role Tracker</h2>
          <p className="text-sm text-[#5A7080] italic font-['Playfair_Display']">Every application. Log it, track it, close it.</p>
          <p className="text-xs text-[#A8BCC8] mt-1.5">No required fields — use as much or as little as works for you. The more detail you add, the better your results.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('cards')} className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg cursor-pointer transition-colors ${viewMode === 'cards' ? 'bg-[#263746] text-white' : 'bg-white border border-[#D8E4EC] text-[#4A5C6B] hover:bg-[#F5F9FD]'}`} title="Card view"><LayoutGrid size={15} /></button>
          <button onClick={() => setViewMode('table')} className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg cursor-pointer transition-colors ${viewMode === 'table' ? 'bg-[#263746] text-white' : 'bg-white border border-[#D8E4EC] text-[#4A5C6B] hover:bg-[#F5F9FD]'}`} title="Table view"><List size={15} /></button>
          <button onClick={addApp} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
            <Plus size={16} /> Log application
          </button>
        </div>
      </div>

      {/* Pipeline header */}
      {apps.length > 0 && (
        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
          {[
            { label: 'Researching', count: pipelineCounts['Researching'], color: 'bg-[#EEF3FA] text-[#6D99F2]' },
            { label: 'Applied', count: pipelineCounts['Applied'], color: 'bg-[#263746]/10 text-[#263746]' },
            { label: 'Interview', count: pipelineCounts['Interview'], color: 'bg-[#FBD872]/20 text-amber-800' },
            { label: 'Offer', count: pipelineCounts['Offer'], color: 'bg-emerald-50 text-emerald-700' },
          ].map(({ label, count, color }, i) => (
            <div key={label} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[#D8E4EC] text-sm font-bold">›</span>}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>{label} <span className="font-bold">{count}</span></span>
            </div>
          ))}
        </div>
      )}

      {apps.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-[#7A8FA3] text-sm">No applications yet. Hit "Log application" to get started.</p>
        </div>
      )}

      {/* Card view */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className={`bg-white rounded-xl overflow-hidden border-2 ${app.vibe === 'green' ? 'border-emerald-400' : app.vibe === 'amber' ? 'border-amber-400' : app.vibe === 'red' ? 'border-red-400' : 'border-[#D8E4EC]'}`}>
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#F5F9FD]" onClick={() => setExpanded(expanded === app.id ? null : app.id)}>
                <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {[['green', '🟢'], ['amber', '🟡'], ['red', '🔴']].map(([v, emoji]) => (
                    <button key={v} onClick={() => updateApp(app.id, 'vibe', app.vibe === v ? '' : v)} className={`text-sm transition-all cursor-pointer ${app.vibe === v ? 'opacity-100 scale-110' : 'opacity-25 hover:opacity-60'}`}>{emoji}</button>
                  ))}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[app.status] || 'bg-[#F5F9FD] text-[#7A8FA3]'}`}>{app.status}</span>
                {app.workType && <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${WORK_TYPE_COLORS[app.workType] || ''}`}>{app.workType}</span>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#263746] truncate">{app.company || 'Untitled company'}</p>
                    {app.jobUrl && <a href={app.jobUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-[#6D99F2] hover:text-[#263746] flex-shrink-0"><ExternalLink size={12} /></a>}
                  </div>
                  <p className="text-xs text-[#7A8FA3] truncate">{app.jobRole || 'No role selected'}{app.location ? ` · ${app.location}` : ''}</p>
                </div>
                {app.submittedDate && <span className="text-xs text-[#7A8FA3] flex-shrink-0">{app.submittedDate}</span>}
                <AlignmentPill ratings={app.blueprintRatings} />
                <button onClick={e => { e.stopPropagation(); removeApp(app.id) }} className="text-[#FF5E5B] hover:text-red-700 flex-shrink-0 cursor-pointer"><Trash2 size={14} /></button>
                <ChevronDown size={16} className={`text-[#7A8FA3] transition-transform flex-shrink-0 ${expanded === app.id ? 'rotate-180' : ''}`} />
              </div>
              {expanded === app.id && (
                <div className="border-t border-[#EEF3FA]">
                  <ExpandedForm app={app} {...formProps} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table view */}
      {viewMode === 'table' && apps.length > 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F8F5F2] border-b border-[#EEF3FA]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4A5C6B] whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4A5C6B]">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4A5C6B]">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4A5C6B] whitespace-nowrap">Work Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4A5C6B]">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4A5C6B] whitespace-nowrap">Date Applied</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4A5C6B] whitespace-nowrap">Follow-up</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4A5C6B]">Blueprint</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4A5C6B]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => {
                const today = new Date().toISOString().slice(0, 10)
                const followUpOverdue = app.followUpDate && app.followUpDate < today && !app.followUpDone
                const isExpanded = expanded === app.id
                return (
                  <>
                    <tr key={app.id} className={`border-b border-[#EEF3FA] cursor-pointer hover:bg-[#F5F9FD] transition-colors ${isExpanded ? 'bg-[#F8F5F2]' : ''}`} onClick={() => setExpanded(isExpanded ? null : app.id)}>
                      <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[app.status] || 'bg-[#F5F9FD] text-[#7A8FA3]'}`}>{app.status}</span></td>
                      <td className="px-4 py-3 font-semibold text-[#263746] max-w-[160px] truncate">{app.jobRole || '—'}</td>
                      <td className="px-4 py-3 text-[#263746] max-w-[140px]">
                        <div className="flex items-center gap-1 truncate">
                          <span className="truncate">{app.company || '—'}</span>
                          {app.jobUrl && <a href={app.jobUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-[#6D99F2] hover:text-[#263746] flex-shrink-0"><ExternalLink size={11} /></a>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {app.workType ? <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${WORK_TYPE_COLORS[app.workType] || ''}`}>{app.workType}</span> : <span className="text-[#7A8FA3]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-[#7A8FA3] max-w-[120px] truncate">{app.location || '—'}</td>
                      <td className="px-4 py-3 text-[#7A8FA3] whitespace-nowrap">{app.submittedDate || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {app.followUpDate ? <span className={followUpOverdue ? 'text-red-500 font-semibold' : 'text-[#7A8FA3]'}>{app.followUpDate}</span> : <span className="text-[#7A8FA3]">—</span>}
                      </td>
                      <td className="px-4 py-3"><AlignmentPill ratings={app.blueprintRatings} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setExpanded(isExpanded ? null : app.id)} className="text-[#7A8FA3] hover:text-[#263746] cursor-pointer transition-colors"><ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></button>
                          <button onClick={() => removeApp(app.id)} className="text-[#FF5E5B] hover:text-red-700 cursor-pointer"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${app.id}-expanded`} className="bg-[#F8F5F2]">
                        <td colSpan={9} className="border-b border-[#EEF3FA]">
                          <ExpandedForm app={app} {...formProps} />
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
