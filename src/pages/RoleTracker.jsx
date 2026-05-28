import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Trash2, ChevronDown, ExternalLink } from 'lucide-react'
import FileUpload from '../components/FileUpload'

const STATUS_OPTIONS = ['Not Started', 'Researching', 'Applied', 'Awaiting Response', 'Interview Scheduled', 'Offer Received', 'Rejected', 'Withdrawn']
const OUTCOME_OPTIONS = ['', 'Progressing', 'Rejected', 'Offer', 'Withdrawn', 'Awaiting']

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
        <div
          className={`h-full rounded-full transition-all duration-300 ${fillColor}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${textColor}`}>{total}/{max}</span>
    </div>
  )
}

function newApp() {
  return {
    id: Date.now(), status: 'Not Started', jobRole: '', company: '', alignment: '', why: '',
    blueprintRatings: {}, selectedResume: '',
    connectedHM: false, connectionMsg: false, hmContact: '', hmRole: '',
    notes: '', resumeLink: '', coverLetterLink: '', closeDate: '', submittedDate: '',
    followUpDate: '', followUpDone: false,
    outcome: '', interviewDate: '', interviewStage: '', prepDone: false,
    interviewOutcome: '', feedback: '', additionalNotes: '',
  }
}

export default function RoleTracker() {
  const { data, update } = useData()
  const [expanded, setExpanded] = useState(null)
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
  function updateApp(id, field, value) { setApps(apps.map(a => a.id === id ? { ...a, [field]: value } : a)) }
  function updateRating(id, catKey, value) {
    setApps(apps.map(a => a.id === id ? { ...a, blueprintRatings: { ...a.blueprintRatings, [catKey]: value } } : a))
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Role Tracker</h2>
          <p className="text-sm text-[#5A7080] italic font-['Playfair_Display']">Every application. Log it, track it, close it.</p>
        </div>
        <button onClick={addApp} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
          <Plus size={16} /> Log application
        </button>
      </div>

      {apps.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-[#7A8FA3] text-sm">No applications yet. Hit "Log application" to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {apps.map((app) => (
          <div key={app.id} className={`bg-white rounded-xl overflow-hidden border-2 ${app.vibe === 'green' ? 'border-emerald-400' : app.vibe === 'amber' ? 'border-amber-400' : app.vibe === 'red' ? 'border-red-400' : 'border-[#D8E4EC]'}`}>
            <div
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#F5F9FD]"
              onClick={() => setExpanded(expanded === app.id ? null : app.id)}
            >
              {/* Traffic light */}
              <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                {[['green','🟢'],['amber','🟡'],['red','🔴']].map(([v, emoji]) => (
                  <button
                    key={v}
                    onClick={() => updateApp(app.id, 'vibe', app.vibe === v ? '' : v)}
                    className={`text-sm transition-all cursor-pointer ${app.vibe === v ? 'opacity-100 scale-110' : 'opacity-25 hover:opacity-60'}`}
                    title={v === 'green' ? 'Feeling good' : v === 'amber' ? 'Feeling neutral' : 'Feeling concerned'}
                  >{emoji}</button>
                ))}
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[app.status] || 'bg-[#F5F9FD] text-[#7A8FA3]'}`}>
                {app.status}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#263746] truncate">{app.company || 'Untitled company'}</p>
                <p className="text-xs text-[#7A8FA3] truncate">{app.jobRole || 'No role selected'}</p>
              </div>
              {app.submittedDate && <span className="text-xs text-[#7A8FA3] flex-shrink-0">{app.submittedDate}</span>}
              <AlignmentPill ratings={app.blueprintRatings} />
              <button onClick={e => { e.stopPropagation(); removeApp(app.id) }} className="text-[#FF5E5B] hover:text-red-700 flex-shrink-0 cursor-pointer">
                <Trash2 size={14} />
              </button>
              <ChevronDown size={16} className={`text-[#7A8FA3] transition-transform flex-shrink-0 ${expanded === app.id ? 'rotate-180' : ''}`} />
            </div>

            {expanded === app.id && (
              <div className="border-t border-[#EEF3FA] px-5 py-5">
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
                    <input className={inputCls} type="date" value={app.followUpDate || ''} onChange={e => updateApp(app.id, 'followUpDate', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Resume Used</label>
                    <select
                      className={inputCls}
                      value={app.selectedResume || ''}
                      onChange={e => updateApp(app.id, 'selectedResume', e.target.value)}
                    >
                      {resumeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
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
                      <p className="text-[10px] text-[#7A8FA3] mt-0.5">Rate how well this role matches each area of your Career Blueprint (1 = poor, 5 = perfect)</p>
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

                  {/* Fill bar */}
                  {(() => {
                    const { pct, color, total } = getAlignmentMeta(app.blueprintRatings)
                    const fillColor = color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-400' : 'bg-[#FF5E5B]'
                    return total > 0 ? (
                      <div className="w-full h-3 bg-[#EEF3FA] rounded-full overflow-hidden mb-4 border border-[#D8E4EC]">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${fillColor}`}
                          style={{ width: `${pct * 100}%` }}
                        />
                      </div>
                    ) : null
                  })()}

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {BP_CATEGORIES.map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-[10px] font-medium text-[#4A5C6B] mb-1">{label}</label>
                        {blueprint[key] && (
                          <p className="text-[10px] text-[#7A8FA3] italic mb-1.5 line-clamp-2" title={blueprint[key]}>{blueprint[key]}</p>
                        )}
                        <select
                          className={inputCls}
                          value={app.blueprintRatings?.[key] ?? ''}
                          onChange={e => updateRating(app.id, key, e.target.value)}
                        >
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

                <div className="mt-4 pt-4 border-t border-[#EEF3FA]">
                  <p className="text-xs font-semibold text-[#4A5C6B] uppercase tracking-wide mb-3">Documents</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FileUpload
                        label="Resume"
                        value={app.resumeFile}
                        onChange={file => updateApp(app.id, 'resumeFile', file)}
                      />
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-[#D8E4EC]" />
                        <span className="text-[10px] text-[#7A8FA3]">or link</span>
                        <div className="h-px flex-1 bg-[#D8E4EC]" />
                      </div>
                      <div className="flex gap-1.5">
                        <input className={`${inputCls} flex-1`} type="url" value={app.resumeLink} onChange={e => updateApp(app.id, 'resumeLink', e.target.value)} placeholder="Paste Drive link" />
                        {app.resumeLink && <a href={app.resumeLink} target="_blank" rel="noreferrer" className="text-[#6D99F2] hover:text-[#263746]"><ExternalLink size={16} /></a>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <FileUpload
                        label="Cover Letter"
                        value={app.coverLetterFile}
                        onChange={file => updateApp(app.id, 'coverLetterFile', file)}
                      />
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-[#D8E4EC]" />
                        <span className="text-[10px] text-[#7A8FA3]">or link</span>
                        <div className="h-px flex-1 bg-[#D8E4EC]" />
                      </div>
                      <div className="flex gap-1.5">
                        <input className={`${inputCls} flex-1`} type="url" value={app.coverLetterLink} onChange={e => updateApp(app.id, 'coverLetterLink', e.target.value)} placeholder="Paste Drive link" />
                        {app.coverLetterLink && <a href={app.coverLetterLink} target="_blank" rel="noreferrer" className="text-[#6D99F2] hover:text-[#263746]"><ExternalLink size={16} /></a>}
                      </div>
                    </div>
                  </div>
                </div>

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
                    <div>
                      <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Feedback</label>
                      <textarea className={inputCls} rows={2} value={app.feedback} onChange={e => updateApp(app.id, 'feedback', e.target.value)} placeholder="Feedback received" />
                    </div>
                    <div className="col-span-2 lg:col-span-3">
                      <label className="block text-xs font-medium text-[#4A5C6B] mb-1">Additional Notes</label>
                      <textarea className={inputCls} rows={2} value={app.additionalNotes} onChange={e => updateApp(app.id, 'additionalNotes', e.target.value)} placeholder="Anything else" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
