import React from 'react'
import { useData } from '../context/DataContext'
import {
  Briefcase, Users, TrendingUp, AlertCircle,
  CheckCircle, Clock, Target, Plus, Trophy, ClipboardList,
  CalendarCheck, ArrowRight, Sparkles, FileDown
} from 'lucide-react'
import jsPDF from 'jspdf'

const QUOTES = [
  "You don't have to be ready. You have to be willing.",
  "Small steps every day beat big leaps once a month.",
  "The right role won't feel like a gift — it'll feel like a fit.",
  "Clarity doesn't come from thinking. It comes from doing.",
  "Momentum is a decision, not a mood.",
  "Rejection is redirection.",
  "Confidence is the residue of preparation.",
  "Networking is just being kind on purpose.",
  "Your story is your strategy.",
  "Apply for the role you want, not the one you think you're allowed.",
]

const BP_CATEGORIES = [
  { key: 'company', label: 'Company' },
  { key: 'culture', label: 'Culture' },
  { key: 'team', label: 'Team' },
  { key: 'manager', label: 'Manager' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'values', label: 'Values' },
  { key: 'environment', label: 'Environment' },
  { key: 'salary', label: 'Salary' },
]

function getQuote() { return QUOTES[new Date().getDay() % QUOTES.length] }

function daysSinceLastActivity(applications, networking, weeklyLog, coaching) {
  const dates = [
    ...applications.map(a => a.submittedDate),
    ...applications.map(a => a.interviewDate),
    ...(networking || []).map(n => n.lastContact),
    ...(networking || []).flatMap(n => (n.touchpoints || []).map(tp => tp.date)),
    ...(weeklyLog || []).filter(c => c.submitted && c.weekOf).map(c => c.weekOf),
    ...(coaching || []).map(c => c.date),
  ].filter(Boolean).map(d => new Date(d))
  if (!dates.length) return null
  return Math.floor((Date.now() - Math.max(...dates)) / 86400000)
}

function getStatus(days, appsThisWeek, target) {
  if (days === null) return { label: 'No activity yet', icon: Clock, variant: 'neutral' }
  if (days >= 7) return { label: 'No activity in 7+ days', icon: AlertCircle, variant: 'red' }
  if (appsThisWeek < target) return { label: 'Below weekly target', icon: AlertCircle, variant: 'amber' }
  return { label: 'On track', icon: CheckCircle, variant: 'green' }
}

function weeksActive(startDate) {
  if (!startDate) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(startDate)) / (7 * 86400000)))
}

function appsThisWeek(applications) {
  const weekAgo = Date.now() - 7 * 86400000
  return applications.filter(a => a.submittedDate && new Date(a.submittedDate) >= weekAgo).length
}

function getRoleFitScore(applications) {
  const rated = applications.filter(a => a.blueprintRatings && Object.keys(a.blueprintRatings).length > 0)
  if (!rated.length) return null
  const catTotals = {}, catCounts = {}
  rated.forEach(a => {
    BP_CATEGORIES.forEach(({ key }) => {
      const val = parseInt(a.blueprintRatings[key]) || 0
      if (val > 0) { catTotals[key] = (catTotals[key] || 0) + val; catCounts[key] = (catCounts[key] || 0) + 1 }
    })
  })
  const catAverages = BP_CATEGORIES.map(({ key, label }) => ({ label, avg: catCounts[key] ? catTotals[key] / catCounts[key] : 0 })).filter(c => c.avg > 0)
  if (!catAverages.length) return null
  const overallAvg = catAverages.reduce((s, c) => s + c.avg, 0) / catAverages.length
  const pct = (overallAvg / 5) * 100
  const color = pct >= 70 ? 'emerald' : pct >= 40 ? 'amber' : 'red'
  const best = rated.reduce((best, a) => {
    const total = BP_CATEGORIES.reduce((s, { key }) => s + (parseInt(a.blueprintRatings[key]) || 0), 0)
    return total > (best?.total || 0) ? { ...a, total } : best
  }, null)
  return { overallAvg, pct, color, catAverages, best, ratedCount: rated.length }
}

function getStreak(applications, networking) {
  const activityDates = new Set()
  applications.forEach(a => { if (a.submittedDate) activityDates.add(a.submittedDate.slice(0, 10)) })
  networking.forEach(n => { if (n.lastContact) activityDates.add(n.lastContact.slice(0, 10)) })
  if (!activityDates.size) return 0
  let streak = 0
  const today = new Date()
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (activityDates.has(key)) streak++
    else if (i > 0) break
  }
  return streak
}

function getCheckinOverdue(weeklyLog) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  return !(weeklyLog || []).some(c => c.submitted && c.weekOf && c.weekOf >= sevenDaysAgo)
}

function getOverdueFollowUps(applications) {
  const today = new Date().toISOString().slice(0, 10)
  return applications.filter(a =>
    a.followUpDate && a.followUpDate <= today && !a.followUpDone &&
    !['Offer Received', 'Rejected'].includes(a.status)
  )
}

function getModulePrompts(applications, weeks) {
  const prompts = []
  const totalApps = applications.length
  const hasInterview = applications.some(a => a.interviewDate)
  const hasOffer = applications.some(a => a.status === 'Offer Received')
  if (totalApps >= 5 && !hasInterview) prompts.push({ icon: '🎤', module: 'Mastering Interviews', message: `${totalApps} applications in — are you interview-ready?` })
  if (hasInterview && !hasOffer) prompts.push({ icon: '🏆', module: 'Influential Interviews', message: 'Interview coming up — brush up on behavioural questions and your career overview.' })
  if (totalApps >= 10) prompts.push({ icon: '🧭', module: 'Career Blueprint Builder', message: `${totalApps} applications in — are you still targeting the right roles?` })
  return prompts
}

const STATUS_STYLES = {
  green:   { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  amber:   { pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  red:     { pill: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-400' },
  neutral: { pill: 'bg-[#F5F9FD] text-[#7A8FA3] border-[#D8E4EC]', dot: 'bg-[#B8CAD8]' },
}

export default function Dashboard({ navigate }) {
  const { data, update, updateNested } = useData()
  const { profile, applications, networking, weeklyLog } = data
  const [editingTarget, setEditingTarget] = React.useState(null)
  const [targetDraft, setTargetDraft] = React.useState('')
  const [newWin, setNewWin] = React.useState('')

  const totalApps = applications.length
  const interviews = applications.filter(a => a.interviewDate).length
  const convRate = totalApps ? ((interviews / totalApps) * 100).toFixed(1) : '0.0'
  const weeks = weeksActive(profile.startDate)
  const days = daysSinceLastActivity(applications, networking, weeklyLog, data.coaching)
  const appsWeek = appsThisWeek(applications)
  const networkingWeek = networking.filter(n => n.lastContact && new Date(n.lastContact) >= Date.now() - 7 * 86400000).length
  const status = getStatus(days, appsWeek, profile.weeklyAppTarget || 5)
  const checkinOverdue = getCheckinOverdue(weeklyLog)
  const streak = getStreak(applications, networking)
  const overdueFollowUps = getOverdueFollowUps(applications)
  const modulePrompts = getModulePrompts(applications, weeks)
  const wins = data.wins || []
  const roleFit = getRoleFitScore(applications)

  const upcomingInterviews = applications.filter(a => {
    if (!a.interviewDate) return false
    const msUntil = new Date(a.interviewDate) - Date.now()
    return msUntil >= 0 && msUntil <= 7 * 86400000
  }).sort((a, b) => a.interviewDate.localeCompare(b.interviewDate))

  const networkNudges = (networking || []).filter(n => {
    if ((n.status || 'Active') !== 'Active') return false
    if (!n.lastContact) return false
    return (Date.now() - new Date(n.lastContact)) / 86400000 > 30
  }).sort((a, b) => new Date(a.lastContact) - new Date(b.lastContact)).slice(0, 3)

  const fitColor = roleFit?.color === 'emerald' ? '#10b981' : roleFit?.color === 'amber' ? '#f59e0b' : '#FF5E5B'
  const fitBg = roleFit?.color === 'emerald' ? 'bg-emerald-50' : roleFit?.color === 'amber' ? 'bg-amber-50' : 'bg-red-50'
  const fitText = roleFit?.color === 'emerald' ? 'text-emerald-600' : roleFit?.color === 'amber' ? 'text-amber-600' : 'text-red-500'

  const hasFirstCheckin = (weeklyLog || []).some(c => c.submitted)
  const hasOffer = applications.some(a => a.status === 'Offer Received')

  function addWin(e) {
    e.preventDefault()
    if (!newWin.trim()) return
    update('wins', [{ id: Date.now(), text: newWin.trim(), date: new Date().toISOString().slice(0, 10) }, ...wins])
    setNewWin('')
  }
  function removeWin(id) { update('wins', wins.filter(w => w.id !== id)) }

  function generateSummaryPDF() {
    const doc = new jsPDF()
    const today = new Date()
    const weekStart = new Date(today - 7 * 86400000)
    const fmt = d => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    const name = profile.name || 'Member'

    let y = 20

    doc.setFillColor(38, 55, 70)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Weekly Job Search Summary', 20, 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`${name}  ·  Week of ${fmt(weekStart)} – ${fmt(today)}`, 20, 30)
    y = 55

    doc.setTextColor(38, 55, 70)
    const section = (title) => {
      doc.setFillColor(238, 243, 250)
      doc.rect(15, y - 5, 180, 8, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(109, 153, 242)
      doc.text(title.toUpperCase(), 18, y + 0.5)
      doc.setTextColor(38, 55, 70)
      y += 10
    }
    const row = (label, value) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(74, 92, 107)
      doc.text(label, 20, y)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(38, 55, 70)
      doc.text(String(value || '—'), 120, y)
      y += 8
    }

    section('This Week')
    row('Applications submitted', appsWeek)
    row('Networking actions', networkingWeek)
    row('Weekly target', profile.weeklyAppTarget || 5)
    row('Day streak', streak)
    y += 4

    const thisWeekCheckin = (weeklyLog || []).find(c => c.submitted && c.weekOf && c.weekOf >= weekStart.toISOString().slice(0, 10))
    section('Weekly Check-In')
    row('Submitted', thisWeekCheckin ? 'Yes' : 'Not yet')
    if (thisWeekCheckin?.wentWell) { row('What went well', ''); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(74, 92, 107); const lines = doc.splitTextToSize(thisWeekCheckin.wentWell, 160); doc.text(lines, 22, y); y += lines.length * 5 + 2 }
    if (thisWeekCheckin?.focusNextWeek) { row('Focus next week', ''); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(74, 92, 107); const lines = doc.splitTextToSize(thisWeekCheckin.focusNextWeek, 160); doc.text(lines, 22, y); y += lines.length * 5 + 2 }
    y += 4

    section('Wins Logged')
    const recentWins = wins.filter(w => w.date >= weekStart.toISOString().slice(0, 10))
    if (recentWins.length === 0) { doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(168, 188, 200); doc.text('No wins logged this week', 20, y); y += 8 }
    else recentWins.forEach(w => { doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(38, 55, 70); doc.text(`★  ${w.text}`, 20, y); y += 7 })
    y += 4

    section('Upcoming Interviews')
    if (upcomingInterviews.length === 0) { doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(168, 188, 200); doc.text('None scheduled', 20, y); y += 8 }
    else upcomingInterviews.forEach(iv => { row(`${iv.company || 'Company'} — ${iv.jobRole || 'Role'}`, iv.interviewDate) })

    doc.save(`weekly-summary-${today.toISOString().slice(0, 10)}.pdf`)
  }

  function markFollowUpDone(id) {
    update('applications', applications.map(a => a.id === id ? { ...a, followUpDone: true } : a))
  }

  const s = STATUS_STYLES[status.variant]

  return (
    <div className="w-full">

      {/* ── GREETING ─────────────────────────────────────────── */}
      <div className="mb-7">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {weeks > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-[#263746] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Week {weeks} of your search
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${s.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {status.label}
            {days !== null && <span className="opacity-60">· {days === 0 ? 'active today' : `${days}d ago`}</span>}
          </span>
        </div>
        <h1 className="text-5xl font-black text-[#1a2b38] font-['Inter'] leading-[1.1] mb-3 tracking-tight">
          {profile.name ? `Hey ${profile.name.split(' ')[0]} 👋` : 'Welcome back 👋'}
        </h1>
        <p className="text-lg text-[#8FA3B3] italic font-['Playfair_Display']">"{getQuote()}"</p>
        <div className="flex justify-end mt-2">
          <button
            onClick={generateSummaryPDF}
            className="flex items-center gap-2 text-xs font-semibold text-[#7A8FA3] hover:text-[#263746] bg-white border border-[#E4EDF5] px-4 py-2 rounded-xl cursor-pointer transition-colors hover:shadow-sm"
          >
            <FileDown size={13} />
            Download weekly summary
          </button>
        </div>
      </div>

      {/* ── WEEKLY CHECK-IN NUDGE ────────────────────────────── */}
      {checkinOverdue && (
        <div className="mb-6 flex items-center justify-between gap-4 bg-[#263746] text-white rounded-2xl px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">📋</span>
            <div className="min-w-0">
              <p className="font-bold text-sm">Have you done your weekly check-in?</p>
              <p className="text-xs text-white/60 mt-0.5">It takes 2 minutes. Reflect, reset, and go again.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('weeklylog')}
            className="flex-shrink-0 bg-white text-[#263746] text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#EEF3FA] cursor-pointer transition-colors"
          >
            Do it now →
          </button>
        </div>
      )}

      {/* ── MILESTONES ────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs font-bold text-[#A8BCC8] uppercase tracking-widest mb-3">Your milestones</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              emoji: '📝',
              label: 'First application',
              done: totalApps > 0,
              detail: totalApps > 0 ? `${totalApps} logged so far` : 'Not yet',
              celebrate: 'You started. That took courage.',
            },
            {
              emoji: '📞',
              label: 'First interview',
              done: interviews > 0,
              detail: interviews > 0 ? `${interviews} scheduled` : 'Not yet',
              celebrate: 'They want to meet you.',
            },
            {
              emoji: '✅',
              label: 'First check-in',
              done: hasFirstCheckin,
              detail: hasFirstCheckin ? 'Habit started' : 'Not yet',
              celebrate: 'Reflection is how you improve.',
            },
            {
              emoji: '🎉',
              label: 'First offer',
              done: hasOffer,
              detail: hasOffer ? 'Offer received!' : 'Not yet',
              celebrate: "All that work paid off.",
            },
          ].map(({ emoji, label, done, detail, celebrate }) => (
            <div
              key={label}
              className={`rounded-2xl p-5 flex flex-col items-center text-center transition-all ${
                done
                  ? 'bg-white border border-[#E4EDF5] shadow-sm'
                  : 'bg-[#F8FBFD] border border-dashed border-[#E4EDF5]'
              }`}
            >
              <div className={`text-3xl mb-3 ${done ? '' : 'grayscale opacity-25'}`}>{emoji}</div>
              <p className={`text-xs font-bold leading-snug mb-1.5 ${done ? 'text-[#263746]' : 'text-[#C8D8E4]'}`}>{label}</p>
              {done
                ? <p className="text-[10px] text-[#6D99F2] font-medium italic font-['Playfair_Display'] leading-snug">{celebrate}</p>
                : <p className="text-[10px] text-[#D8E4EC]">{detail}</p>
              }
            </div>
          ))}
        </div>
      </div>

      {/* ── YOUR WEEK ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E4EDF5] mb-6 overflow-hidden">
        <div className="px-8 pt-7 pb-6 border-b border-[#F0F5FA]">
          <div className="flex items-baseline justify-between mb-7">
            <div>
              <h2 className="text-2xl font-black text-[#1a2b38] font-['Inter']">Your week at a glance</h2>
              <p className="text-sm text-[#A8BCC8] mt-0.5">
                w/e {new Date().toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>
            {streak > 0 && (
              <div className="text-right">
                <div className="text-3xl font-black text-[#1a2b38] font-['Inter'] leading-none">🔥 {streak}</div>
                <div className="text-xs text-[#A8BCC8] mt-0.5">day streak</div>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* Applications */}
            <div>
              <div className="flex items-end justify-between mb-4">
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-black text-[#1a2b38] font-['Inter'] leading-none">{appsWeek}</span>
                  <span className="text-2xl text-[#C8D8E4] font-['Inter'] mb-1">
                    / {editingTarget === 'apps' ? (
                      <form className="inline" onSubmit={e => { e.preventDefault(); updateNested('profile', 'weeklyAppTarget', parseInt(targetDraft) || 5); setEditingTarget(null) }}>
                        <input autoFocus className="w-10 border-b-2 border-[#6D99F2] text-[#6D99F2] text-2xl font-black bg-transparent focus:outline-none text-center" value={targetDraft} onChange={e => setTargetDraft(e.target.value)} onBlur={() => { updateNested('profile', 'weeklyAppTarget', parseInt(targetDraft) || 5); setEditingTarget(null) }} />
                      </form>
                    ) : (
                      <button onClick={() => { setEditingTarget('apps'); setTargetDraft(String(profile.weeklyAppTarget || 5)) }} className="hover:text-[#6D99F2] cursor-pointer transition-colors" title="Edit target">{profile.weeklyAppTarget || 5}</button>
                    )}
                  </span>
                </div>
                {appsWeek >= (profile.weeklyAppTarget || 5)
                  ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">🎉 Done!</span>
                  : <span className="text-xs text-[#A8BCC8]">{(profile.weeklyAppTarget || 5) - appsWeek} to go</span>
                }
              </div>
              <div className="w-full h-3 bg-[#F0F5FA] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${appsWeek >= (profile.weeklyAppTarget || 5) ? 'bg-emerald-500' : 'bg-[#6D99F2]'}`}
                  style={{ width: `${Math.min(100, (appsWeek / (profile.weeklyAppTarget || 5)) * 100)}%` }}
                />
              </div>
              <p className="text-sm font-semibold text-[#4A5C6B] mt-2">Applications this week</p>
            </div>

            {/* Networking */}
            <div>
              <div className="flex items-end justify-between mb-4">
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-black text-[#1a2b38] font-['Inter'] leading-none">{networkingWeek}</span>
                  <span className="text-2xl text-[#C8D8E4] font-['Inter'] mb-1">
                    / {editingTarget === 'network' ? (
                      <form className="inline" onSubmit={e => { e.preventDefault(); updateNested('profile', 'weeklyNetworkTarget', parseInt(targetDraft) || 3); setEditingTarget(null) }}>
                        <input autoFocus className="w-10 border-b-2 border-[#6D99F2] text-[#6D99F2] text-2xl font-black bg-transparent focus:outline-none text-center" value={targetDraft} onChange={e => setTargetDraft(e.target.value)} onBlur={() => { updateNested('profile', 'weeklyNetworkTarget', parseInt(targetDraft) || 3); setEditingTarget(null) }} />
                      </form>
                    ) : (
                      <button onClick={() => { setEditingTarget('network'); setTargetDraft(String(profile.weeklyNetworkTarget || 3)) }} className="hover:text-[#6D99F2] cursor-pointer transition-colors" title="Edit target">{profile.weeklyNetworkTarget || 3}</button>
                    )}
                  </span>
                </div>
                {networkingWeek >= (profile.weeklyNetworkTarget || 3)
                  ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">🎉 Done!</span>
                  : <span className="text-xs text-[#A8BCC8]">{(profile.weeklyNetworkTarget || 3) - networkingWeek} to go</span>
                }
              </div>
              <div className="w-full h-3 bg-[#F0F5FA] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${networkingWeek >= (profile.weeklyNetworkTarget || 3) ? 'bg-emerald-500' : 'bg-[#6D99F2]'}`}
                  style={{ width: `${Math.min(100, (networkingWeek / (profile.weeklyNetworkTarget || 3)) * 100)}%` }}
                />
              </div>
              <p className="text-sm font-semibold text-[#4A5C6B] mt-2">Networking this week</p>
            </div>
          </div>
        </div>

        {/* Stats footer strip */}
        <div className="grid grid-cols-4 divide-x divide-[#F0F5FA]">
          {[
            { label: 'Total apps', value: totalApps, sub: 'all time' },
            { label: 'Interviews', value: interviews, sub: `${convRate}% conversion` },
            { label: 'Day streak', value: streak, sub: streak > 0 ? 'keep going!' : 'start today' },
            { label: 'Weeks active', value: weeks, sub: profile.startDate ? `since ${new Date(profile.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}` : '—' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="px-6 py-4 text-center">
              <div className="text-2xl font-black text-[#1a2b38] font-['Inter'] leading-none mb-1">{value}</div>
              <div className="text-xs font-semibold text-[#4A5C6B]">{label}</div>
              <div className="text-xs text-[#A8BCC8] mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK ACTIONS ─────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs font-bold text-[#A8BCC8] uppercase tracking-widest mb-3">Quick actions</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Log application', page: 'roles', icon: Briefcase, accent: '#6D99F2', accentBg: '#EEF3FA' },
            { label: 'Add networking', page: 'networking', icon: Users, accent: '#10b981', accentBg: '#ecfdf5' },
            { label: 'Weekly log', page: 'weeklylog', icon: ClipboardList, accent: '#D4AF37', accentBg: '#fefce8' },
          ].map(({ label, page, icon: Icon, accent, accentBg }) => (
            <button
              key={label}
              onClick={() => navigate(page)}
              className="group bg-white border border-[#E4EDF5] hover:border-[#C8D8E4] hover:shadow-md rounded-2xl p-5 text-left cursor-pointer transition-all"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors" style={{ backgroundColor: accentBg }}>
                <Icon size={18} style={{ color: accent }} />
              </div>
              <p className="text-sm font-bold text-[#263746] mb-0.5">{label}</p>
              <ArrowRight size={14} className="text-[#C8D8E4] group-hover:text-[#6D99F2] transition-colors mt-1" />
            </button>
          ))}
        </div>
      </div>

      {/* ── NUDGES (check-in + follow-ups + module prompts) ───── */}
      {(upcomingInterviews.length > 0 || checkinOverdue || overdueFollowUps.length > 0 || modulePrompts.length > 0 || networkNudges.length > 0) && (
        <div className="bg-white rounded-3xl border border-[#E4EDF5] p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} className="text-[#D4AF37]" />
            <p className="text-xs font-bold text-[#263746] uppercase tracking-widest">On your radar</p>
          </div>
          <div className="space-y-3">

            {/* Upcoming interviews */}
            {upcomingInterviews.map(iv => {
              const daysUntil = Math.ceil((new Date(iv.interviewDate) - Date.now()) / 86400000)
              return (
                <div key={iv.id} className="flex items-center gap-4 bg-[#EEF3FA] border border-[#D0E4F8] rounded-2xl px-5 py-4">
                  <div className="w-11 h-11 rounded-xl bg-[#6D99F2] flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl font-black leading-none">{daysUntil === 0 ? '!' : daysUntil}</span>
                    <span className="text-white/70 text-[9px] leading-none mt-0.5">{daysUntil === 0 ? 'today' : 'days'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#263746]">Interview — {iv.company || 'Company'}</p>
                    <p className="text-xs text-[#5A7080] mt-0.5">
                      {iv.jobRole && <span className="font-medium">{iv.jobRole} · </span>}
                      {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : new Date(iv.interviewDate).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <button onClick={() => navigate('interviews')} className="text-xs font-semibold text-[#6D99F2] bg-white border border-[#D0E4F8] px-3 py-2 rounded-xl cursor-pointer hover:bg-[#EEF3FA] transition-colors flex-shrink-0">
                    Prep now →
                  </button>
                </div>
              )
            })}

            {/* Check-in overdue */}
            {checkinOverdue && (
              <div className="flex items-center gap-4 bg-[#FEFAF2] border border-[#F5E9C4] rounded-2xl px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-[#FEF3CD] flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={16} className="text-[#D4AF37]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#7A5C10]">Weekly check-in due</p>
                  <p className="text-xs text-[#A87E30] mt-0.5">Keep the habit going — fill in this week's reflection.</p>
                </div>
                <button
                  onClick={() => navigate('weeklylog')}
                  className="text-xs font-semibold text-[#7A5C10] bg-white border border-[#F0D98A] px-4 py-2 rounded-xl hover:bg-[#FEF3CD] cursor-pointer transition-colors flex-shrink-0"
                >
                  Go to check-in →
                </button>
              </div>
            )}

            {/* Overdue follow-ups */}
            {overdueFollowUps.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={14} className="text-red-400" />
                  <span className="text-xs font-bold text-red-700">{overdueFollowUps.length} follow-up{overdueFollowUps.length !== 1 ? 's' : ''} overdue</span>
                </div>
                <div className="space-y-2">
                  {overdueFollowUps.map(a => (
                    <div key={a.id} className="flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-2.5 border border-red-100">
                      <div>
                        <span className="text-sm font-semibold text-[#263746]">{a.company || 'Untitled'}</span>
                        {a.jobRole && <span className="text-xs text-[#A8BCC8] ml-2">{a.jobRole}</span>}
                        <span className="text-xs text-red-400 ml-2">due {a.followUpDate}</span>
                      </div>
                      <button onClick={() => markFollowUpDone(a.id)} className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer flex-shrink-0">Mark done</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Module prompts */}
            {modulePrompts.map((p, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4 bg-[#F8FBFD] border border-[#EEF3FA] rounded-2xl">
                <span className="text-xl flex-shrink-0 mt-0.5">{p.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#263746] mb-0.5">{p.module}</p>
                  <p className="text-xs text-[#7A8FA3] leading-relaxed">{p.message}</p>
                </div>
              </div>
            ))}

            {/* Networking nudges */}
            {networkNudges.map(n => {
              const daysSince = Math.floor((Date.now() - new Date(n.lastContact)) / 86400000)
              return (
                <div key={n.id} className="flex items-center gap-4 px-5 py-4 bg-[#F8FBFD] border border-[#EEF3FA] rounded-2xl">
                  <div className="w-9 h-9 rounded-full bg-[#EEF3FA] flex items-center justify-center text-sm font-bold text-[#6D99F2] flex-shrink-0">
                    {n.person ? n.person.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#263746]">{n.person || 'Contact'}</p>
                    <p className="text-xs text-[#7A8FA3] mt-0.5">Last contact {daysSince} days ago — time to reconnect</p>
                  </div>
                  <button onClick={() => navigate('networking')} className="text-xs font-semibold text-[#6D99F2] cursor-pointer hover:underline flex-shrink-0">
                    View →
                  </button>
                </div>
              )
            })}

          </div>
        </div>
      )}

      {/* ── WIN LOG ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E4EDF5] p-7 mb-6">
        <div className="flex items-center gap-2.5 mb-5">
          <Trophy size={18} className="text-[#D4AF37]" />
          <h3 className="text-base font-black text-[#1a2b38] font-['Inter']">Win Log</h3>
          <span className="text-sm text-[#C8D8E4]">— every win counts</span>
        </div>
        <form onSubmit={addWin} className="flex gap-2 mb-5">
          <input
            className="flex-1 border border-[#E4EDF5] rounded-xl px-4 py-3 text-sm text-[#263746] placeholder:text-[#C8D8E4] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/25 bg-[#F8FBFD]"
            placeholder="What went well? e.g. Got a callback from Google!"
            value={newWin}
            onChange={e => setNewWin(e.target.value)}
          />
          <button type="submit" className="bg-[#263746] hover:bg-[#1a2832] text-white px-5 py-3 rounded-xl text-sm font-bold cursor-pointer transition-colors flex items-center gap-2 flex-shrink-0">
            <Plus size={15} /> Add
          </button>
        </form>
        {wins.length === 0 ? (
          <p className="text-sm text-[#D8E4EC] text-center py-5 italic">Nothing logged yet — your wins don't have to be big!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {wins.map(w => (
              <div key={w.id} className="group flex items-center gap-2.5 bg-[#FFFBEF] border border-[#F5E9C4] rounded-full pl-3.5 pr-2.5 py-2">
                <span className="text-sm">🌟</span>
                <span className="text-sm text-[#7A5C10] font-medium">{w.text}</span>
                <span className="text-[10px] text-[#D4AF37] opacity-70">{w.date}</span>
                <button
                  onClick={() => removeWin(w.id)}
                  className="text-[#D4AF37] hover:text-[#FF5E5B] transition-colors cursor-pointer opacity-0 group-hover:opacity-100 ml-0.5"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ROLE FIT ───────────────────────────────────────────── */}
      {roleFit && (
        <div className="bg-white rounded-3xl p-7 border border-[#E4EDF5] mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Target size={20} className="text-[#6D99F2]" />
              <h3 className="text-base font-black text-[#1a2b38] font-['Inter']">Role Fit Score</h3>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${fitBg} ${fitText}`}>
              {roleFit.pct >= 70 ? 'Strong alignment' : roleFit.pct >= 40 ? 'Moderate alignment' : 'Low alignment'}
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-7">
            <div>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-5xl font-black text-[#1a2b38] font-['Inter']">{roleFit.overallAvg.toFixed(1)}</span>
                <span className="text-xl text-[#C8D8E4] mb-1">/5</span>
                <span className="text-sm text-[#A8BCC8] mb-1.5">avg across {roleFit.ratedCount} role{roleFit.ratedCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="w-full h-3 bg-[#F0F5FA] rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${roleFit.pct}%`, backgroundColor: fitColor }} />
              </div>
              {roleFit.best && (
                <p className="text-xs text-[#A8BCC8]">
                  Best fit: <span className="font-bold text-[#263746]">{roleFit.best.jobRole || 'Untitled'}</span>
                  {roleFit.best.company ? ` at ${roleFit.best.company}` : ''} ({roleFit.best.total}/{BP_CATEGORIES.length * 5})
                </p>
              )}
            </div>
            <div className="space-y-2">
              {roleFit.catAverages.sort((a, b) => b.avg - a.avg).map(({ label, avg }) => {
                const pct = (avg / 5) * 100
                const barColor = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#FF5E5B'
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-[#5A7080] w-20 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-[#F0F5FA] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                    <span className="text-xs font-bold text-[#263746] w-6 text-right">{avg.toFixed(1)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 90-DAY GOAL ───────────────────────────────────────── */}
      {profile.ninetyDayGoal && (
        <div className="bg-white rounded-3xl border border-[#E4EDF5] px-8 py-6 mb-6 flex items-start gap-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Target size={18} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#A8BCC8] uppercase tracking-widest mb-1.5">Your 90-Day Goal</p>
            <p className="text-base text-[#263746] font-medium leading-relaxed italic font-['Playfair_Display']">"{profile.ninetyDayGoal}"</p>
          </div>
          <button onClick={() => navigate('profile')} className="text-xs text-[#6D99F2] hover:underline cursor-pointer flex-shrink-0 mt-1">Edit →</button>
        </div>
      )}

      {/* ── SOURCE BREAKDOWN ─────────────────────────────────── */}
      {(() => {
        const withSource = applications.filter(a => a.source)
        if (withSource.length < 3) return null
        const sources = {}
        withSource.forEach(a => {
          if (!sources[a.source]) sources[a.source] = { apps: 0, interviews: 0 }
          sources[a.source].apps++
          if (a.interviewDate) sources[a.source].interviews++
        })
        const sorted = Object.entries(sources).sort((a, b) => b[1].apps - a[1].apps)
        const maxApps = Math.max(...sorted.map(([, v]) => v.apps))
        return (
          <div className="bg-white rounded-3xl border border-[#E4EDF5] p-7 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={18} className="text-[#6D99F2]" />
              <h3 className="text-base font-black text-[#1a2b38] font-['Inter']">Which channel is working?</h3>
            </div>
            <div className="space-y-3">
              {sorted.map(([source, { apps, interviews }]) => {
                const pct = apps > 0 ? Math.round((interviews / apps) * 100) : 0
                return (
                  <div key={source} className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-[#263746] w-28 flex-shrink-0 truncate">{source}</span>
                    <div className="flex-1 h-2 bg-[#F0F5FA] rounded-full overflow-hidden">
                      <div className="h-full bg-[#6D99F2] rounded-full transition-all" style={{ width: `${(apps / maxApps) * 100}%` }} />
                    </div>
                    <span className="text-xs text-[#A8BCC8] flex-shrink-0 w-16 text-right">{apps} app{apps !== 1 ? 's' : ''}</span>
                    {interviews > 0
                      ? <span className="text-xs font-bold text-emerald-600 flex-shrink-0 w-20 text-right">{pct}% → interview</span>
                      : <span className="text-xs text-[#D8E4EC] flex-shrink-0 w-20 text-right">no interviews yet</span>
                    }
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-[#C8D8E4] mt-4">Based on {withSource.length} tracked application{withSource.length !== 1 ? 's' : ''} with a source set.</p>
          </div>
        )
      })()}

    </div>
  )
}
