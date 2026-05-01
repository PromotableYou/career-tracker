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

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"

function downloadPDF(bp, profileName) {
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

    // Category label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(38, 55, 70)
    doc.text(cat, lm, y)
    y += 5

    // Value text
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(74, 92, 107)
    const lines = doc.splitTextToSize(value, contentW)
    checkPage(lines.length * 5 + 4)
    doc.text(lines, lm, y)
    y += lines.length * 5 + 7

    // Divider
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

  // Role scores table
  const scoredRoles = (bp.roleScores || []).filter(r => r?.name)
  if (scoredRoles.length > 0) {
    checkPage(40)
    doc.addPage()
    y = lm

    doc.setFillColor(38, 55, 70)
    doc.rect(0, 0, pageW, 18, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(255, 255, 255)
    doc.text('Role Scores', lm, 12)
    y = 28

    // Table header
    const colW = Math.min(32, (contentW - 48) / scoredRoles.length)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(74, 92, 107)
    doc.text('Category', lm, y)
    scoredRoles.forEach((r, i) => {
      doc.text(r.name.substring(0, 14), lm + 48 + i * colW, y, { maxWidth: colW - 2 })
    })
    y += 5
    doc.setDrawColor(216, 228, 236)
    doc.line(lm, y, pageW - lm, y)
    y += 4

    // Rows
    CATEGORIES.forEach((cat, ci) => {
      checkPage(8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(74, 92, 107)
      doc.text(cat, lm, y)
      scoredRoles.forEach((r, i) => {
        const val = r.scores?.[CATEGORY_KEYS[ci]] ?? ''
        doc.text(val === '' ? '-' : String(val), lm + 48 + i * colW + colW / 2, y, { align: 'center' })
      })
      y += 6
    })

    // Totals row
    y += 2
    doc.setDrawColor(38, 55, 70)
    doc.line(lm, y - 2, pageW - lm, y - 2)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(38, 55, 70)
    doc.text('TOTAL / 8', lm, y + 4)
    scoredRoles.forEach((r, i) => {
      const total = CATEGORY_KEYS.reduce((s, k) => s + (parseFloat(r.scores?.[k]) || 0), 0)
      doc.text(total.toFixed(1), lm + 48 + i * colW + colW / 2, y + 4, { align: 'center' })
    })
  }

  doc.save(`career-blueprint${profileName ? `-${profileName.split(' ')[0].toLowerCase()}` : ''}.pdf`)
}

export default function Blueprint() {
  const { data, updateNested } = useData()
  const bp = data.blueprint

  function set(field, value) { updateNested('blueprint', field, value) }

  function updateScore(ri, catKey, value) {
    const scores = [...(bp.roleScores || [])]
    if (!scores[ri]) scores[ri] = { name: '', scores: {} }
    scores[ri] = { ...scores[ri], scores: { ...scores[ri].scores, [catKey]: value } }
    set('roleScores', scores)
  }

  function updateRoleName(ri, name) {
    const scores = [...(bp.roleScores || [])]
    if (!scores[ri]) scores[ri] = { name: '', scores: {} }
    scores[ri] = { ...scores[ri], name }
    set('roleScores', scores)
  }

  const roles = bp.roleScores?.length > 0 ? bp.roleScores : Array(5).fill(null).map(() => ({ name: '', scores: {} }))

  function getTotal(ri) {
    return CATEGORY_KEYS.reduce((sum, k) => sum + (parseFloat(roles[ri]?.scores?.[k]) || 0), 0)
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Career Blueprint</h2>
          <p className="text-sm text-[#5A7080] italic font-['Playfair_Display']">Your clarity document. Paste your GPT responses, then score every role before you apply.</p>
        </div>
        <button
          onClick={() => downloadPDF(bp, data.profile?.name)}
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

      <div className="bg-white rounded-xl border border-[#D8E4EC] p-6 overflow-x-auto">
        <h3 className="font-semibold text-[#263746] mb-1 font-['Inter']">Score Roles Against Your Blueprint</h3>
        <p className="text-sm text-[#7A8FA3] mb-4">1 = strong match &nbsp;·&nbsp; 0.5 = partial &nbsp;·&nbsp; 0 = no match</p>

        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold text-[#4A5C6B] py-2 pr-4 w-40">Category</th>
              {roles.map((role, i) => (
                <th key={i} className="text-center py-2 px-2 min-w-[120px]">
                  <input
                    className="w-full border border-[#D8E4EC] rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#6D99F2]/40 placeholder:text-[#7A8FA3]"
                    value={role?.name || ''}
                    onChange={e => updateRoleName(i, e.target.value)}
                    placeholder={`Role ${i + 1}`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat, ci) => (
              <tr key={cat} className="border-t border-[#EEF3FA]">
                <td className="text-xs text-[#4A5C6B] py-2 pr-4">{cat}</td>
                {roles.map((role, ri) => (
                  <td key={ri} className="text-center py-2 px-2">
                    <select
                      className="border border-[#D8E4EC] rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#6D99F2]/40 bg-white text-[#263746]"
                      value={role?.scores?.[CATEGORY_KEYS[ci]] ?? ''}
                      onChange={e => updateScore(ri, CATEGORY_KEYS[ci], e.target.value)}
                    >
                      <option value="">-</option>
                      <option value="0">0</option>
                      <option value="0.5">0.5</option>
                      <option value="1">1</option>
                    </select>
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t-2 border-[#D8E4EC] font-semibold">
              <td className="text-xs text-[#263746] py-3 pr-4">TOTAL (out of 8)</td>
              {roles.map((_, ri) => (
                <td key={ri} className="text-center py-3 px-2">
                  <span className={`text-sm font-bold ${getTotal(ri) >= 6 ? 'text-emerald-600' : getTotal(ri) >= 4 ? 'text-amber-600' : 'text-[#FF5E5B]'}`}>
                    {getTotal(ri).toFixed(1)}
                  </span>
                </td>
              ))}
            </tr>
            <tr className="border-t border-[#EEF3FA]">
              <td className="text-xs text-[#4A5C6B] py-2 pr-4">Verdict</td>
              {roles.map((_, ri) => {
                const t = getTotal(ri)
                const verdict = t >= 6 ? 'Strong fit' : t >= 4 ? 'Partial fit' : t > 0 ? 'Weak fit' : ''
                const color = t >= 6 ? 'text-emerald-600' : t >= 4 ? 'text-amber-600' : 'text-[#FF5E5B]'
                return <td key={ri} className={`text-center text-xs py-2 px-2 font-medium ${color}`}>{verdict}</td>
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
