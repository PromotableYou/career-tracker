import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Trash2, Download, User, FileText, Compass } from 'lucide-react'
import FileUpload from '../components/FileUpload'
import jsPDF from 'jspdf'

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"

// ── Blueprint constants ──────────────────────────────────────────────────────
const BP_CATEGORIES = ['The Company', 'The Culture', 'The Team', 'Your Manager', 'Your Tasks', 'What you Value', 'The Environment', 'Salary / Benefits / Progression']
const BP_PLACEHOLDERS = [
  'e.g. Balanced commercial and values-driven. Growing organisation.',
  'e.g. Structured but flexible. Collaborative but accountable.',
  'e.g. Constructive feedback. Friendly but purposeful.',
  'e.g. Balanced autonomy and support. Clear communication.',
  'e.g. Improving systems and processes. Clear ownership.',
  'e.g. Security, freedom, recognition, financial growth.',
  'e.g. Remote-first, hybrid secondary. Flexible structure.',
  'e.g. Target $100K. Fair compensation. Clear progression.',
]
const BP_KEYS = ['company', 'culture', 'team', 'manager', 'tasks', 'values', 'environment', 'salary']
const MAX_SCORE = BP_KEYS.length * 5

function appTotal(app) {
  return BP_KEYS.reduce((s, k) => s + (parseInt(app.blueprintRatings?.[k]) || 0), 0)
}
function fitVerdict(total) {
  const pct = total / MAX_SCORE
  if (pct >= 0.7) return { label: 'Strong fit', color: 'text-emerald-600' }
  if (pct >= 0.4) return { label: 'Partial fit', color: 'text-amber-600' }
  if (total > 0)  return { label: 'Weak fit',    color: 'text-[#FF5E5B]' }
  return { label: '', color: '' }
}
function scoreColor(val) {
  if (!val || val === 0) return ''
  if (val >= 4) return 'bg-emerald-50 text-emerald-700'
  if (val === 3) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-[#FF5E5B]'
}

function downloadBlueprintPDF(bp, profileName, ratedApps) {
  const doc = new jsPDF()
  const lm = 20
  const pageW = doc.internal.pageSize.getWidth()
  const contentW = pageW - lm * 2
  let y = lm

  function checkPage(needed = 20) {
    if (y + needed > 272) { doc.addPage(); y = lm }
  }

  doc.setFillColor(38, 55, 70)
  doc.rect(0, 0, pageW, 18, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text('Career Blueprint', lm, 12)
  if (profileName) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(profileName, pageW - lm, 12, { align: 'right' })
  }
  y = 28

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(122, 143, 163)
  doc.text(`Generated ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`, lm, y)
  y += 10

  BP_CATEGORIES.forEach((cat, i) => {
    const value = bp[BP_KEYS[i]]
    if (!value) return
    checkPage(24)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(38, 55, 70)
    doc.text(cat, lm, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(74, 92, 107)
    const lines = doc.splitTextToSize(value, contentW)
    checkPage(lines.length * 5 + 4)
    doc.text(lines, lm, y)
    y += lines.length * 5 + 7
    doc.setDrawColor(216, 228, 236)
    doc.line(lm, y - 3, pageW - lm, y - 3)
  })

  if (bp.notes) {
    checkPage(24)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(38, 55, 70)
    doc.text('Notes', lm, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(74, 92, 107)
    const lines = doc.splitTextToSize(bp.notes, contentW)
    checkPage(lines.length * 5)
    doc.text(lines, lm, y)
    y += lines.length * 5 + 10
  }

  if (ratedApps.length > 0) {
    doc.addPage()
    y = lm
    doc.setFillColor(38, 55, 70)
    doc.rect(0, 0, pageW, 18, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(255, 255, 255)
    doc.text('Role Alignment', lm, 12)
    y = 28

    const colW = Math.min(32, (contentW - 48) / ratedApps.length)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(74, 92, 107)
    doc.text('Category', lm, y)
    ratedApps.forEach((app, i) => {
      const header = (app.jobRole || 'Untitled').substring(0, 14)
      doc.text(header, lm + 48 + i * colW, y, { maxWidth: colW - 2 })
    })
    y += 5
    doc.setDrawColor(216, 228, 236)
    doc.line(lm, y, pageW - lm, y)
    y += 4

    BP_CATEGORIES.forEach((cat, ci) => {
      checkPage(8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(74, 92, 107)
      doc.text(cat, lm, y)
      ratedApps.forEach((app, i) => {
        const val = parseInt(app.blueprintRatings?.[BP_KEYS[ci]]) || 0
        doc.text(val > 0 ? String(val) : '-', lm + 48 + i * colW + colW / 2, y, { align: 'center' })
      })
      y += 6
    })

    y += 2
    doc.setDrawColor(38, 55, 70)
    doc.line(lm, y - 2, pageW - lm, y - 2)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(38, 55, 70)
    doc.text(`TOTAL / ${MAX_SCORE}`, lm, y + 4)
    ratedApps.forEach((app, i) => {
      const total = appTotal(app)
      doc.text(String(total), lm + 48 + i * colW + colW / 2, y + 4, { align: 'center' })
    })
  }

  doc.save(`career-blueprint${profileName ? `-${profileName.split(' ')[0].toLowerCase()}` : ''}.pdf`)
}

// ── Tab nav ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'details', label: 'My Details', icon: User },
  { id: 'resumes', label: 'Resumes', icon: FileText },
  { id: 'blueprint', label: 'Career Blueprint', icon: Compass },
]

export default function MyProfile() {
  const { data, update, updateNested } = useData()
  const [tab, setTab] = useState('details')

  const { profile } = data
  const blueprint = data.blueprint || {}
  const resumeVersions = data.resumeVersions || []
  const applications = data.applications || []
  const ratedApps = applications.filter(a =>
    a.blueprintRatings && Object.values(a.blueprintRatings).some(v => v)
  )

  function setProfile(field, value) { updateNested('profile', field, value) }
  function setBlueprint(field, value) { updateNested('blueprint', field, value) }

  // Resume helpers
  function setVersions(next) { update('resumeVersions', next) }
  function addVersion() { setVersions([...resumeVersions, { id: Date.now(), roleName: '', file: null, notes: '' }]) }
  function removeVersion(id) { setVersions(resumeVersions.filter(v => v.id !== id)) }
  function updVersion(id, field, value) { setVersions(resumeVersions.map(v => v.id === id ? { ...v, [field]: value } : v)) }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">My Profile</h2>
        <p className="text-sm text-[#7A8FA3]">Your foundations, your resumes, your blueprint. Everything in one place.</p>
      </div>

      {/* Completeness meter */}
      {(() => {
        const profileFields = ['name', 'email', 'coach', 'startDate', 'targetRole']
        const bpFields = ['company', 'culture', 'team', 'manager', 'tasks', 'values', 'environment', 'salary']
        const filled = profileFields.filter(f => profile[f]).length + bpFields.filter(k => blueprint[k]).length
        const total = profileFields.length + bpFields.length
        const pct = Math.round((filled / total) * 100)
        const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-[#6D99F2]' : 'bg-amber-400'
        const textColor = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-[#6D99F2]' : 'text-amber-600'
        const label = pct === 100 ? 'Complete!' : pct >= 80 ? 'Almost there' : pct >= 50 ? 'Good progress' : 'Let\'s fill this in'
        const detailFilled = profileFields.filter(f => profile[f]).length
        const bpFilled = bpFields.filter(k => blueprint[k]).length
        return (
          <div className="bg-white rounded-xl border border-[#D8E4EC] px-5 py-4 mb-5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#4A5C6B]">Profile completeness</span>
              <span className={`font-bold ${textColor}`}>{pct}% · {label}</span>
            </div>
            <div className="w-full h-2 bg-[#EEF3FA] rounded-full overflow-hidden mb-2">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex gap-4">
              <span className="text-[10px] text-[#7A8FA3]">Details: <span className="font-semibold text-[#263746]">{detailFilled}/{profileFields.length}</span></span>
              <span className="text-[10px] text-[#7A8FA3]">Blueprint: <span className="font-semibold text-[#263746]">{bpFilled}/{bpFields.length}</span></span>
            </div>
          </div>
        )
      })()}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F0F5FA] rounded-xl p-1 mb-6 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
              tab === id
                ? 'bg-white text-[#263746] shadow-sm border border-[#D8E4EC]'
                : 'text-[#7A8FA3] hover:text-[#263746]'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── MY DETAILS ── */}
      {tab === 'details' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#D8E4EC] p-6">
            <h3 className="font-semibold text-[#263746] mb-4 font-['Inter']">Your Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#263746] mb-1">Name</label>
                  <input className={inputCls} value={profile.name} onChange={e => setProfile('name', e.target.value)} placeholder="e.g. Shaniah" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#263746] mb-1">Email</label>
                  <input className={inputCls} type="email" value={profile.email} onChange={e => setProfile('email', e.target.value)} placeholder="your@email.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#263746] mb-1">Coach Name</label>
                  <input className={inputCls} value={profile.coach} onChange={e => setProfile('coach', e.target.value)} placeholder="Your career coach" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#263746] mb-1">Program Start Date</label>
                  <input className={inputCls} type="date" value={profile.startDate} onChange={e => setProfile('startDate', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#263746] mb-1">Target Role / Industry</label>
                <input className={inputCls} value={profile.targetRole} onChange={e => setProfile('targetRole', e.target.value)} placeholder="e.g. Senior Product Manager" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#263746] mb-1">30-Day Goal</label>
                <textarea className={inputCls} rows={2} value={profile.thirtyDayGoal || ''} onChange={e => setProfile('thirtyDayGoal', e.target.value)} placeholder="What's your focus for the next 30 days? e.g. Apply to 20 roles and land 3 interviews." />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#263746] mb-1">90-Day Goal</label>
                <textarea className={inputCls} rows={2} value={profile.ninetyDayGoal || ''} onChange={e => setProfile('ninetyDayGoal', e.target.value)} placeholder="What do you want to achieve in the next 90 days? e.g. Land a senior PM role at a purpose-driven company." />
              </div>
            </div>
          </div>

          {(() => {
            // Calculate this week's progress
            const today = new Date()
            const dayOfWeek = today.getDay() // 0=Sun
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - ((dayOfWeek + 6) % 7)) // Mon
            weekStart.setHours(0, 0, 0, 0)
            const weekStartStr = weekStart.toISOString().slice(0, 10)

            const appsThisWeek = (data.applications || []).filter(a => a.submittedDate >= weekStartStr).length
            const networkThisWeek = (data.networking || []).filter(n => n.lastContact >= weekStartStr).length

            const appTarget = profile.weeklyAppTarget || 5
            const netTarget = profile.weeklyNetworkTarget || 3
            const appPct = Math.min(100, Math.round((appsThisWeek / appTarget) * 100))
            const netPct = Math.min(100, Math.round((networkThisWeek / netTarget) * 100))

            function TargetBar({ label, current, target, pct, onChange }) {
              const color = pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-[#6D99F2]' : 'bg-amber-400'
              const textColor = pct >= 100 ? 'text-emerald-600' : pct >= 60 ? 'text-[#6D99F2]' : 'text-amber-600'
              return (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-[#263746]">{label}</label>
                    <span className={`text-xs font-bold ${textColor}`}>{current} / {target} this week</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#EEF3FA] rounded-full mb-2">
                    <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <input className={inputCls} type="number" min="1" value={target} onChange={e => onChange(+e.target.value)} />
                </div>
              )
            }

            return (
              <div className="bg-white rounded-xl border border-[#D8E4EC] p-6">
                <h3 className="font-semibold text-[#263746] mb-1 font-['Inter']">Weekly Targets</h3>
                <p className="text-sm text-[#7A8FA3] mb-4">Set your targets below. The bar shows this week's progress.</p>
                <div className="grid grid-cols-2 gap-6">
                  <TargetBar label="Applications" current={appsThisWeek} target={appTarget} pct={appPct} onChange={v => setProfile('weeklyAppTarget', v)} />
                  <TargetBar label="Networking" current={networkThisWeek} target={netTarget} pct={netPct} onChange={v => setProfile('weeklyNetworkTarget', v)} />
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── RESUMES ── */}
      {tab === 'resumes' && (
        <div className="space-y-6">
          {/* Master resume */}
          <div className="bg-white rounded-xl border border-[#D8E4EC] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[#263746] font-['Inter']">Master Resume</h3>
                <p className="text-xs text-[#7A8FA3] mt-0.5">Your base. Use Resume Genius to tailor it for each role.</p>
              </div>
              <a
                href="https://chatgpt.com/g/g-68077c2103e4819185cbb67866443ba4-resume-genius-tooltm-by-promotable-you"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors no-underline flex-shrink-0"
              >
                Open Resume Genius
              </a>
            </div>
            <FileUpload value={data.profile?.resumeFile || null} onChange={f => updateNested('profile', 'resumeFile', f)} />
            <div className="flex items-center gap-2 mt-3">
              <div className="h-px flex-1 bg-[#D8E4EC]" />
              <span className="text-xs text-[#7A8FA3]">or paste a link</span>
              <div className="h-px flex-1 bg-[#D8E4EC]" />
            </div>
            <input
              className={`${inputCls} mt-3`}
              type="url"
              value={data.profile?.resumeLink || ''}
              onChange={e => updateNested('profile', 'resumeLink', e.target.value)}
              placeholder="Google Drive / Dropbox link"
            />
          </div>

          {/* Tailored versions */}
          <div className="bg-white rounded-xl border border-[#D8E4EC] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[#263746] font-['Inter']">Tailored Versions</h3>
                <p className="text-xs text-[#7A8FA3] mt-0.5">Save a version for each role type you're targeting.</p>
              </div>
              <button
                onClick={addVersion}
                className="flex items-center gap-2 bg-[#EEF3FA] hover:bg-[#D0DFF8] text-[#263746] text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer border border-[#D8E4EC]"
              >
                <Plus size={15} /> Add version
              </button>
            </div>
            {resumeVersions.length === 0 && (
              <div className="text-center py-10 text-[#7A8FA3] text-sm">
                <p className="mb-1">No tailored versions yet.</p>
                <p>Use Resume Genius to tailor your master resume, then save each version here.</p>
              </div>
            )}
            <div className="space-y-4">
              {resumeVersions.map(v => (
                <div key={v.id} className="border border-[#D8E4EC] rounded-xl p-4 bg-[#F8F5F2]">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      className={`${inputCls} font-semibold`}
                      value={v.roleName}
                      onChange={e => updVersion(v.id, 'roleName', e.target.value)}
                      placeholder="Role name — e.g. Senior Product Manager"
                    />
                    <button onClick={() => removeVersion(v.id)} className="text-[#FF5E5B] hover:text-red-700 cursor-pointer ml-3 flex-shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <FileUpload value={v.file} onChange={file => updVersion(v.id, 'file', file)} />
                  <input
                    className={`${inputCls} mt-2 text-xs`}
                    value={v.notes}
                    onChange={e => updVersion(v.id, 'notes', e.target.value)}
                    placeholder="Notes — e.g. Emphasised stakeholder management"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CAREER BLUEPRINT ── */}
      {tab === 'blueprint' && (
        <div className="space-y-6">

          {/* Upload existing blueprint */}
          <div className="bg-white rounded-xl border border-[#D8E4EC] p-6">
            <h3 className="font-semibold text-[#263746] mb-1 font-['Inter']">Upload Your Blueprint</h3>
            <p className="text-sm text-[#7A8FA3] mb-4">Already completed your Career Blueprint? Upload it here so everything's in one place.</p>
            <FileUpload
              value={blueprint.file || null}
              onChange={f => setBlueprint('file', f)}
            />
            {blueprint.file && (
              <p className="text-xs text-emerald-600 mt-2 font-medium">✓ Blueprint uploaded</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#D8E4EC] p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="font-semibold text-[#263746] font-['Inter']">Your Blueprint Criteria</h3>
                <p className="text-xs text-[#7A8FA3] mt-0.5">Define what the right role looks like. Rate roles in the Role Tracker to see alignment.</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href="https://chatgpt.com/g/g-69a2761ed5948191b868cef59aa04126-career-blueprint-buildertm-by-promotable-you"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors no-underline"
                >
                  Build my Blueprint
                </a>
                <button
                  onClick={() => downloadBlueprintPDF(blueprint, profile?.name, ratedApps)}
                  className="flex items-center gap-2 bg-[#EEF3FA] hover:bg-[#D0DFF8] text-[#263746] text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer border border-[#D8E4EC]"
                >
                  <Download size={14} /> PDF
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {BP_CATEGORIES.map((cat, i) => (
                <div key={cat}>
                  <label className="block text-sm font-medium text-[#263746] mb-1">{cat}</label>
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={blueprint[BP_KEYS[i]] || ''}
                    onChange={e => setBlueprint(BP_KEYS[i], e.target.value)}
                    placeholder={BP_PLACEHOLDERS[i]}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-[#263746] mb-1">Notes</label>
                <textarea
                  className={inputCls}
                  rows={3}
                  value={blueprint.notes || ''}
                  onChange={e => setBlueprint('notes', e.target.value)}
                  placeholder="Ideas, thoughts, questions for your coach, non-negotiables, deal-breakers."
                />
              </div>
            </div>
          </div>

          {/* Role Alignment table */}
          <div className="bg-white rounded-xl border border-[#D8E4EC] p-6 overflow-x-auto">
            <h3 className="font-semibold text-[#263746] mb-1 font-['Inter']">Role Alignment</h3>
            <p className="text-sm text-[#7A8FA3] mb-4">Pulled automatically from rated applications in your Role Tracker.</p>

            {ratedApps.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-[#7A8FA3]">No rated applications yet.</p>
                <p className="text-xs text-[#7A8FA3] mt-1">Open an application in Role Tracker and rate each blueprint category to see the comparison here.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-[#4A5C6B] py-2 pr-4 w-40">Category</th>
                    {ratedApps.map(app => (
                      <th key={app.id} className="text-center py-2 px-2 min-w-[120px]">
                        <p className="text-xs font-semibold text-[#263746] truncate max-w-[110px] mx-auto">{app.jobRole || 'Untitled'}</p>
                        {app.company && <p className="text-[10px] text-[#7A8FA3] truncate max-w-[110px] mx-auto">{app.company}</p>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BP_KEYS.map((key, ci) => (
                    <tr key={key} className="border-t border-[#EEF3FA]">
                      <td className="text-xs text-[#4A5C6B] py-2 pr-4">{BP_CATEGORIES[ci]}</td>
                      {ratedApps.map(app => {
                        const val = parseInt(app.blueprintRatings?.[key]) || 0
                        return (
                          <td key={app.id} className="text-center py-2 px-2">
                            <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-semibold ${scoreColor(val)}`}>
                              {val > 0 ? val : <span className="text-[#D8E4EC]">-</span>}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-[#D8E4EC]">
                    <td className="text-xs font-semibold text-[#263746] py-3 pr-4">TOTAL (out of {MAX_SCORE})</td>
                    {ratedApps.map(app => {
                      const total = appTotal(app)
                      const { color } = fitVerdict(total)
                      return (
                        <td key={app.id} className="text-center py-3 px-2">
                          <span className={`text-sm font-bold ${color}`}>{total}</span>
                        </td>
                      )
                    })}
                  </tr>
                  <tr className="border-t border-[#EEF3FA]">
                    <td className="text-xs text-[#4A5C6B] py-2 pr-4">Verdict</td>
                    {ratedApps.map(app => {
                      const { label, color } = fitVerdict(appTotal(app))
                      return <td key={app.id} className={`text-center text-xs py-2 px-2 font-medium ${color}`}>{label}</td>
                    })}
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
