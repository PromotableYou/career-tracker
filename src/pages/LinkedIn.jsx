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

const ACTIVITY_TYPES = ['Post', 'Comment', 'Article', 'Profile update', 'Recommendation given', 'Endorsement', 'Other']
const ACTIVITY_COLORS = {
  'Post': 'bg-[#EEF3FA] text-[#6D99F2]',
  'Comment': 'bg-blue-50 text-blue-600',
  'Article': 'bg-purple-50 text-purple-600',
  'Profile update': 'bg-amber-50 text-amber-700',
  'Recommendation given': 'bg-emerald-50 text-emerald-700',
  'Endorsement': 'bg-teal-50 text-teal-700',
  'Other': 'bg-gray-100 text-gray-600',
}

function newActivity() {
  return { id: Date.now(), date: new Date().toISOString().slice(0, 10), type: 'Post', description: '', url: '', reach: '' }
}

export default function LinkedIn() {
  const { data, updateNested, update } = useData()
  const checklist = data.linkedinChecklist || {}
  const activities = data.linkedinActivity || []
  const [activityExpanded, setActivityExpanded] = useState(null)

  const completed = CHECKLIST_ITEMS.filter(i => checklist[i.key]).length
  const pct = Math.round((completed / CHECKLIST_ITEMS.length) * 100)

  function toggleCheck(key) { updateNested('linkedinChecklist', key, !checklist[key]) }

  function setActivities(next) { update('linkedinActivity', next) }
  function addActivity() {
    const a = newActivity()
    setActivities([...activities, a])
    setActivityExpanded(a.id)
  }
  function removeActivity(id) { setActivities(activities.filter(a => a.id !== id)) }
  function updActivity(id, field, value) { setActivities(activities.map(a => a.id === id ? { ...a, [field]: value } : a)) }
  function toggleActivity(id) { setActivityExpanded(activityExpanded === id ? null : id) }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">LinkedIn</h2>
        <p className="text-sm text-[#7A8FA3]">Profile checklist and activity log.</p>
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

      {/* ── ACTIVITY LOG ── */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#263746] font-['Inter']">LinkedIn Activity Log</h3>
            <p className="text-xs text-[#7A8FA3] mt-0.5">Track posts, comments, articles and profile updates — visibility actions that build your brand.</p>
          </div>
          <button onClick={addActivity} className="flex items-center gap-2 bg-white border border-[#D8E4EC] hover:bg-[#EEF3FA] text-[#263746] text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
            <Plus size={15} /> Log activity
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#D8E4EC] p-8 text-center">
            <div className="text-3xl mb-3">✍️</div>
            <p className="text-[#263746] font-semibold mb-1">Track your LinkedIn visibility</p>
            <p className="text-[#7A8FA3] text-sm max-w-sm mx-auto leading-relaxed mb-4">Posts, comments, articles, profile updates — log each action here to see how active you're being on the platform.</p>
            <button onClick={addActivity} className="inline-flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-colors">
              <Plus size={15} /> Log first activity
            </button>
          </div>
        ) : (
          <>
            {(() => {
              const thisWeek = activities.filter(a => a.date && new Date(a.date) >= new Date(Date.now() - 7 * 86400000)).length
              const byType = {}
              activities.forEach(a => { byType[a.type] = (byType[a.type] || 0) + 1 })
              const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]
              return (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white rounded-xl border border-[#D8E4EC] p-4 text-center">
                    <div className="text-2xl font-black text-[#263746] font-['Inter']">{activities.length}</div>
                    <div className="text-[10px] text-[#7A8FA3] font-semibold uppercase tracking-wide mt-0.5">Total logged</div>
                  </div>
                  <div className="bg-white rounded-xl border border-[#D8E4EC] p-4 text-center">
                    <div className="text-2xl font-black text-[#6D99F2] font-['Inter']">{thisWeek}</div>
                    <div className="text-[10px] text-[#7A8FA3] font-semibold uppercase tracking-wide mt-0.5">This week</div>
                  </div>
                  <div className="bg-white rounded-xl border border-[#D8E4EC] p-4 text-center">
                    <div className="text-sm font-black text-[#263746] font-['Inter']">{topType ? topType[0] : '—'}</div>
                    <div className="text-[10px] text-[#7A8FA3] font-semibold uppercase tracking-wide mt-0.5">Top activity</div>
                  </div>
                </div>
              )
            })()}
            <div className="space-y-2">
              {[...activities].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(a => (
                <div key={a.id} className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-[#F5F9FD] transition-colors" onClick={() => toggleActivity(a.id)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ACTIVITY_COLORS[a.type] || 'bg-gray-100 text-gray-600'}`}>{a.type}</span>
                      <p className="text-sm text-[#263746] truncate">{a.description || 'No description yet'}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      {a.date && <span className="hidden md:block text-xs text-[#7A8FA3]">{new Date(a.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>}
                      <button onClick={e => { e.stopPropagation(); removeActivity(a.id) }} className="text-[#D8E4EC] hover:text-[#FF5E5B] cursor-pointer transition-colors"><Trash2 size={14} /></button>
                      {activityExpanded === a.id ? <ChevronUp size={15} className="text-[#7A8FA3]" /> : <ChevronDown size={15} className="text-[#7A8FA3]" />}
                    </div>
                  </div>
                  {activityExpanded === a.id && (
                    <div className="px-5 pb-4 pt-3 border-t border-[#EEF3FA]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className={labelCls}>Date</label>
                          <input className={inputCls} type="date" value={a.date} onChange={e => updActivity(a.id,'date',e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Activity Type</label>
                          <select className={inputCls} value={a.type} onChange={e => updActivity(a.id,'type',e.target.value)}>
                            {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Description</label>
                          <input className={inputCls} value={a.description} onChange={e => updActivity(a.id,'description',e.target.value)} placeholder="What did you post/comment/update?" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelCls}>URL (optional)</label>
                          <input className={inputCls} type="url" value={a.url || ''} onChange={e => updActivity(a.id,'url',e.target.value)} placeholder="Link to the post or article" />
                        </div>
                        <div>
                          <label className={labelCls}>Reach / Impressions</label>
                          <input className={inputCls} value={a.reach || ''} onChange={e => updActivity(a.id,'reach',e.target.value)} placeholder="e.g. 450 views" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between items-center text-xs text-[#7A8FA3]">
              <span>{activities.length} activit{activities.length !== 1 ? 'ies' : 'y'} logged</span>
              <button onClick={addActivity} className="text-[#6D99F2] hover:underline cursor-pointer">+ Log activity</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
