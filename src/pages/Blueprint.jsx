import { useData } from '../context/DataContext'
import { Download } from 'lucide-react'
import jsPDF from 'jspdf'

const CATEGORIES = ['The Company','The Culture','The Team','Your Manager','Your Tasks','What you Value','The Environment','Salary / Benefits / Progression']
const PLACEHOLDERS = [
  'e.g. Balanced commercial and values-driven. Growing organisation.',
  'e.g. Structured but flexible. Collaborative but accountable.',
  'e.g. Constructive feedback. Friendly but purposeful.',
  'e.g. Balanced autonomy and support. Clear communication.',
  'e.g. Improving systems and processes. Clear ownership.',
  'e.g. Security, freedom, recognition, financial growth.',
  'e.g. Remote-first, hybrid secondary. Flexible structure.',
  'e.g. Target $100K. Fair compensation. Clear progression.',
]
const CATEGORY_KEYS = ['company','culture','team','manager','tasks','values','environment','salary']
const MAX_SCORE = CATEGORY_KEYS.length * 5

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"

function appTotal(app) {
  return CATEGORY_KEYS.reduce((s, k) => s + (parseInt(app.blueprintRatings?.[k]) || 0), 0)
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

function downloadPDF(bp, profileName, ratedApps) {
  const doc = new jsPDF()
  const lm = 20
  const pageW = doc.internal.pageSize.getWidth()
  const contentW = pageW - lm * 2
  let y = lm

  function checkPage(needed = 20) {
    if (y + needed > 272) { doc.addPage(); y = lm }
  }

  // Header bar
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

  // Date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(122, 143, 163)
  doc.text(`Generated ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`, lm, y)
  y += 10

  // Blueprint criteria
  CATEGORIES.forEach((cat, i) => {
    const value = bp[CATEGORY_KEYS[i]]
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

  // Notes
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

  // Role alignment table from applications
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

    CATEGORIES.forEach((cat, ci) => {
      checkPage(8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(74, 92, 107)
      doc.text(cat, lm, y)
      ratedApps.forEach((app, i) => {
        const val = parseInt(app.blueprintRatings?.[CATEGORY_KEYS[ci]]) || 0
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

export default function Blueprint() {
  const { data, updateNested } = useData()
  const bp = data.blueprint
  const applications = data.applications || []
  const ratedApps = applications.filter(a =>
    a.blueprintRatings && Object.values(a.blueprintRatings).some(v => v)
  )

  function set(field, value) { updateNested('blueprint', field, value) }

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Career Blueprint</h2>
          <p className="text-sm text-[#5A7080] italic font-['Playfair_Display']">Your clarity document. Paste your GPT responses, then rate every role in the Role Tracker.</p>
        </div>
        <button
          onClick={() => downloadPDF(bp, data.profile?.name, ratedApps)}
          className="flex items-center gap-2 bg-[#EEF3FA] hover:bg-[#D0DFF8] text-[#263746] text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer border border-[#D8E4EC] flex-shrink-0 mt-1"
        >
          <Download size={15} /> Download PDF
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#D8E4EC] p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-[#263746] font-['Inter']">Your Blueprint Criteria</h3>
            <p className="text-xs text-[#7A8FA3] mt-0.5">Complete your Blueprint first, then paste your responses into each section below.</p>
          </div>
          <a
            href="https://chatgpt.com/g/g-69a2761ed5948191b868cef59aa04126-career-blueprint-buildertm-by-promotable-you"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors no-underline flex-shrink-0"
          >
            Build my Career Blueprint
          </a>
        </div>
        <div className="space-y-4">
          {CATEGORIES.map((cat, i) => (
            <div key={cat}>
              <label className="block text-sm font-medium text-[#263746] mb-1">{cat}</label>
              <textarea className={inputCls} rows={2} value={bp[CATEGORY_KEYS[i]] || ''} onChange={e => set(CATEGORY_KEYS[i], e.target.value)} placeholder={PLACEHOLDERS[i]} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-[#263746] mb-1">Notes</label>
            <textarea className={inputCls} rows={3} value={bp.notes} onChange={e => set('notes', e.target.value)} placeholder="Ideas, thoughts, questions for your coach, non-negotiables, deal-breakers." />
          </div>
        </div>
      </div>

      {/* Live role alignment from Role Tracker */}
      <div className="bg-white rounded-xl border border-[#D8E4EC] p-6 overflow-x-auto">
        <h3 className="font-semibold text-[#263746] mb-1 font-['Inter']">Role Alignment</h3>
        <p className="text-sm text-[#7A8FA3] mb-4">Pulled automatically from your rated applications in the Role Tracker. Rate 1–5 per category on each application to see it here.</p>

        {ratedApps.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[#7A8FA3]">No rated applications yet.</p>
            <p className="text-xs text-[#7A8FA3] mt-1">Open an application in the Role Tracker and rate each blueprint category to see the comparison here.</p>
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
              {CATEGORY_KEYS.map((key, ci) => (
                <tr key={key} className="border-t border-[#EEF3FA]">
                  <td className="text-xs text-[#4A5C6B] py-2 pr-4">{CATEGORIES[ci]}</td>
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
  )
}
