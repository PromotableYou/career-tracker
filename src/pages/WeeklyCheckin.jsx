import { useData } from '../context/DataContext'
import { CheckCircle2, Circle, Zap } from 'lucide-react'

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-2 py-1.5 text-xs text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"

const ENERGY_LABELS = { 1: 'Very low', 2: 'Low', 3: 'OK', 4: 'Good', 5: 'Energised' }
const ENERGY_COLORS = {
  1: 'bg-red-50 text-[#FF5E5B] border-[#FF5E5B]',
  2: 'bg-amber-50 text-amber-600 border-amber-400',
  3: 'bg-[#FBD872]/20 text-amber-700 border-[#FBD872]',
  4: 'bg-emerald-50 text-emerald-600 border-emerald-400',
  5: 'bg-[#EEF3FA] text-[#6D99F2] border-[#6D99F2]',
}

// Count apps submitted within 7 days of weekOf
function countAppsForWeek(applications, weekOf) {
  if (!weekOf || !applications?.length) return 0
  const start = new Date(weekOf)
  const end = new Date(weekOf)
  end.setDate(end.getDate() + 7)
  return applications.filter(a => {
    if (!a.submittedDate) return false
    const d = new Date(a.submittedDate)
    return d >= start && d < end
  }).length
}

// Small sparkline of energy levels across submitted weeks
function EnergySparkline({ checkins }) {
  const points = checkins.map((c, i) => ({ i, e: c.submitted && c.energyLevel ? parseInt(c.energyLevel) : null }))
  const withData = points.filter(p => p.e !== null)
  if (withData.length < 2) return null

  const W = 140, H = 28, padX = 6, padY = 4
  const xStep = (W - padX * 2) / (checkins.length - 1)

  const plotted = points.map(p => {
    if (p.e === null) return null
    return {
      x: padX + p.i * xStep,
      y: H - padY - ((p.e - 1) / 4) * (H - padY * 2),
      e: p.e,
    }
  })

  // Build path connecting non-null points
  const segments = []
  let segStart = null
  plotted.forEach((pt, i) => {
    if (pt !== null) {
      if (segStart === null) segStart = i
    } else {
      if (segStart !== null) {
        const seg = plotted.slice(segStart, i).filter(Boolean)
        if (seg.length >= 2) segments.push(seg)
        segStart = null
      }
    }
  })
  if (segStart !== null) {
    const seg = plotted.slice(segStart).filter(Boolean)
    if (seg.length >= 2) segments.push(seg)
  }

  return (
    <svg width={W} height={H} className="overflow-visible flex-shrink-0">
      {segments.map((seg, si) => (
        <polyline
          key={si}
          points={seg.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#6D99F2"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
      ))}
      {plotted.filter(Boolean).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#6D99F2" />
      ))}
    </svg>
  )
}

export default function WeeklyCheckin() {
  const { data, update } = useData()
  const checkins = data.weeklyCheckins || []
  const applications = data.applications || []

  function upd(id, field, value) {
    update('weeklyCheckins', checkins.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  function autoFillApps(id, weekOf) {
    const count = countAppsForWeek(applications, weekOf)
    upd(id, 'appsSubmitted', count)
  }

  const completed = checkins.filter(c => c.submitted).length

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Weekly Check-In</h2>
        <p className="text-sm text-[#7A8FA3]">12 weeks of structured reflection. Fill in every Friday.</p>
      </div>

      {/* Progress bar + sparkline */}
      <div className="bg-white rounded-xl border border-[#D8E4EC] px-5 py-4 mb-6 flex items-center gap-6">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-[#7A8FA3] mb-1.5">
            <span>Weekly check-ins submitted</span>
            <span>{completed} / 12</span>
          </div>
          <div className="w-full h-2.5 bg-[#D8E4EC] rounded-full overflow-hidden">
            <div className="h-full bg-[#6D99F2] rounded-full transition-all" style={{ width: `${(completed / 12) * 100}%` }} />
          </div>
        </div>
        {completed >= 2 && (
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <EnergySparkline checkins={checkins} />
            <span className="text-[10px] text-[#7A8FA3]">energy trend</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {checkins.map(c => {
          const trackerCount = c.weekOf ? countAppsForWeek(applications, c.weekOf) : null
          const showAutoFill = trackerCount !== null && trackerCount > 0 && trackerCount !== c.appsSubmitted

          return (
            <div key={c.id} className={`bg-white rounded-xl border overflow-hidden ${c.submitted ? 'border-[#6D99F2]/40' : 'border-[#D8E4EC]'}`}>
              <div className={`flex items-center justify-between px-5 py-4 ${c.submitted ? 'bg-[#EEF3FA]' : 'bg-[#F8F5F2]'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#6D99F2] w-8 font-['Inter']">W{c.id}</span>
                  <input
                    className="text-sm font-semibold text-[#263746] bg-transparent border-b border-dashed border-[#D8E4EC] focus:outline-none focus:border-[#6D99F2] min-w-[130px]"
                    type="date"
                    value={c.weekOf}
                    onChange={e => upd(c.id,'weekOf',e.target.value)}
                  />
                  {c.energyLevel && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ENERGY_COLORS[c.energyLevel] || ''}`}>
                      Energy: {ENERGY_LABELS[c.energyLevel]}
                    </span>
                  )}
                </div>
                <button onClick={() => upd(c.id,'submitted',!c.submitted)} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  {c.submitted
                    ? <><CheckCircle2 size={16} className="text-[#6D99F2]" /><span className="text-[#6D99F2]">Submitted</span></>
                    : <><Circle size={16} className="text-[#D8E4EC]" /><span className="text-[#7A8FA3]">Mark submitted</span></>
                  }
                </button>
              </div>

              <div className="px-5 py-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-[#4A5C6B]">Apps submitted</label>
                      {showAutoFill && (
                        <button
                          onClick={() => autoFillApps(c.id, c.weekOf)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-[#6D99F2] hover:text-[#263746] cursor-pointer transition-colors"
                          title={`Tracker shows ${trackerCount} apps this week`}
                        >
                          <Zap size={10} /> Fill from tracker ({trackerCount})
                        </button>
                      )}
                    </div>
                    <input className={inputCls} type="number" min="0" value={c.appsSubmitted} onChange={e => upd(c.id,'appsSubmitted',+e.target.value)} />
                  </div>
                  <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Networking actions</label><input className={inputCls} type="number" min="0" value={c.networkingActions} onChange={e => upd(c.id,'networkingActions',+e.target.value)} /></div>
                  <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Interviews scheduled</label><input className={inputCls} value={c.interviewsScheduled} onChange={e => upd(c.id,'interviewsScheduled',e.target.value)} placeholder="e.g. 1" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">What went well?</label><textarea className={inputCls} rows={2} value={c.wentWell} onChange={e => upd(c.id,'wentWell',e.target.value)} placeholder="Wins this week" /></div>
                  <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">What didn't work?</label><textarea className={inputCls} rows={2} value={c.didntWork} onChange={e => upd(c.id,'didntWork',e.target.value)} placeholder="What to do differently" /></div>
                  <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">How are you feeling?</label><textarea className={inputCls} rows={2} value={c.feeling} onChange={e => upd(c.id,'feeling',e.target.value)} placeholder="Honest reflection" /></div>
                  <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Focus next week</label><textarea className={inputCls} rows={2} value={c.focusNextWeek} onChange={e => upd(c.id,'focusNextWeek',e.target.value)} placeholder="Your priority" /></div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A5C6B] mb-2">Energy level (1-5)</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(n => (
                      <button
                        key={n}
                        onClick={() => upd(c.id,'energyLevel', c.energyLevel === n ? '' : n)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold cursor-pointer transition-colors border ${c.energyLevel === n ? ENERGY_COLORS[n] : 'bg-[#F8F5F2] text-[#7A8FA3] border-[#D8E4EC] hover:bg-[#EEF3FA]'}`}
                      >
                        {n}
                      </button>
                    ))}
                    {c.energyLevel && <span className="text-xs text-[#7A8FA3] self-center ml-1">{ENERGY_LABELS[c.energyLevel]}</span>}
                  </div>
                </div>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
