import React from 'react'
import { useData } from '../context/DataContext'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts'
import {
  Briefcase, Users, TrendingUp, Calendar, AlertCircle,
  CheckCircle, Clock, Target, Flame, Plus, Trophy, ClipboardList,
  Lightbulb, CalendarCheck, ChevronRight
} from 'lucide-react'

const COLORS = ['#263746', '#6D99F2', '#9999FF', '#D4AF37', '#FF5E5B', '#FBD872', '#344f66']

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

function getQuote() {
  return QUOTES[new Date().getDay() % QUOTES.length]
}

function daysSinceLastActivity(applications, networking, weeklyCheckins, coaching) {
  const dates = [
    ...applications.map(a => a.submittedDate),
    ...applications.map(a => a.interviewDate),
    ...(networking || []).map(n => n.lastContact),
    ...(networking || []).flatMap(n => (n.touchpoints || []).map(tp => tp.date)),
    ...(weeklyCheckins || []).filter(c => c.submitted && c.weekOf).map(c => c.weekOf),
    ...(coaching || []).map(c => c.date),
  ].filter(Boolean).map(d => new Date(d))
  if (!dates.length) return null
  return Math.floor((Date.now() - Math.max(...dates)) / 86400000)
}

function getStatus(days, appsThisWeek, target) {
  if (days === null) return { label: 'No activity yet', color: 'text-[#7A8FA3]', icon: Clock, variant: 'neutral' }
  if (days >= 7) return { label: 'No activity in 7+ days', color: 'text-[#FF5E5B]', icon: AlertCircle, variant: 'red' }
  if (appsThisWeek < target) return { label: 'Below weekly target', color: 'text-amber-600', icon: AlertCircle, variant: 'amber' }
  return { label: 'On track', color: 'text-emerald-500', icon: CheckCircle, variant: 'green' }
}

function weeksActive(startDate) {
  if (!startDate) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(startDate)) / (7 * 86400000)))
}

function appsThisWeek(applications) {
  const weekAgo = Date.now() - 7 * 86400000
  return applications.filter(a => a.submittedDate && new Date(a.submittedDate) >= weekAgo).length
}

function getApplicationsOverTime(applications) {
  if (!applications.length) return []
  const byWeek = {}
  applications.forEach(a => {
    if (!a.submittedDate) return
    const d = new Date(a.submittedDate)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    byWeek[key] = (byWeek[key] || 0) + 1
  })
  return Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      week: new Date(date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      apps: count,
    }))
}

function getRoleFitScore(applications) {
  const rated = applications.filter(a => a.blueprintRatings && Object.keys(a.blueprintRatings).length > 0)
  if (!rated.length) return null
  const catTotals = {}
  const catCounts = {}
  rated.forEach(a => {
    BP_CATEGORIES.forEach(({ key }) => {
      const val = parseInt(a.blueprintRatings[key]) || 0
      if (val > 0) {
        catTotals[key] = (catTotals[key] || 0) + val
        catCounts[key] = (catCounts[key] || 0) + 1
      }
    })
  })
  const catAverages = BP_CATEGORIES.map(({ key, label }) => ({
    label,
    avg: catCounts[key] ? catTotals[key] / catCounts[key] : 0,
  })).filter(c => c.avg > 0)
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
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (activityDates.has(key)) streak++
    else if (i > 0) break
  }
  return streak
}

function getCheckinOverdue(weeklyCheckins) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  return !(weeklyCheckins || []).some(c => c.submitted && c.weekOf && c.weekOf >= sevenDaysAgo)
}

function getOverdueFollowUps(applications) {
  const today = new Date().toISOString().slice(0, 10)
  return applications.filter(a =>
    a.followUpDate && a.followUpDate <= today && !a.followUpDone &&
    !['Offer Received', 'Rejected', 'Withdrawn'].includes(a.status)
  )
}

function getModulePrompts(applications, weeks) {
  const prompts = []
  const totalApps = applications.length
  const hasInterview = applications.some(a => a.interviewDate)
  const hasOffer = applications.some(a => a.status === 'Offer Received')
  if (totalApps >= 5 && !hasInterview) {
    prompts.push({ icon: '🎤', module: 'Module 5 — Mastering Interviews', message: `You've submitted ${totalApps} applications — are you interview-ready?`, urgency: 'amber' })
  }
  if (hasInterview && !hasOffer) {
    prompts.push({ icon: '🏆', module: 'Influential Interviews', message: 'Interview coming up — brush up on behavioural questions and your career overview.', urgency: 'blue' })
  }
  if (totalApps >= 10) {
    prompts.push({ icon: '🧭', module: 'Career Blueprint Builder', message: `${totalApps} applications in — are you targeting the right roles?`, urgency: 'navy' })
  }
  if (weeks >= 3 && totalApps < 3) {
    prompts.push({ icon: '🚀', module: 'Winning Applicants Formula', message: "A few weeks in but applications are low — revisit your momentum strategy.", urgency: 'amber' })
  }
  return prompts
}

function getPipelineData(applications) {
  const stages = ['Applied', 'Awaiting Response', 'Interview Scheduled', 'Offer Received']
  return stages.map(stage => ({
    stage: stage.replace(' ', '\n'),
    count: applications.filter(a => a.status === stage).length,
  }))
}

export default function Dashboard({ navigate }) {
  const { data, update, updateNested } = useData()
  const { profile, applications, networking, weeklyCheckins } = data
  const [editingTarget, setEditingTarget] = React.useState(null)
  const [targetDraft, setTargetDraft] = React.useState('')

  const totalApps = applications.length
  const interviews = applications.filter(a => a.interviewDate).length
  const convRate = totalApps ? ((interviews / totalApps) * 100).toFixed(1) : '0.0'
  const weeks = weeksActive(profile.startDate)
  const days = daysSinceLastActivity(applications, networking, weeklyCheckins, data.coaching)
  const appsWeek = appsThisWeek(applications)
  const networkingWeek = networking.filter(n => n.lastContact && new Date(n.lastContact) >= Date.now() - 7 * 86400000).length
  const status = getStatus(days, appsWeek, profile.weeklyAppTarget || 5)
  const checkinOverdue = getCheckinOverdue(weeklyCheckins)

  const roleMap = {}
  applications.forEach(a => { if (a.jobRole) roleMap[a.jobRole] = (roleMap[a.jobRole] || 0) + 1 })
  const pieData = Object.entries(roleMap).map(([name, value]) => ({ name, value }))

  const firstApp = applications.length > 0
  const firstInterview = applications.some(a => a.interviewDate)
  const firstOffer = data.offers?.length > 0

  const appOverTime = getApplicationsOverTime(applications)
  const roleFit = getRoleFitScore(applications)
  const pipeline = getPipelineData(applications)
  const streak = getStreak(applications, networking)
  const overdueFollowUps = getOverdueFollowUps(applications)
  const modulePrompts = getModulePrompts(applications, weeks)
  const wins = data.wins || []
  const [newWin, setNewWin] = React.useState('')

  function addWin(e) {
    e.preventDefault()
    if (!newWin.trim()) return
    update('wins', [{ id: Date.now(), text: newWin.trim(), date: new Date().toISOString().slice(0, 10) }, ...wins])
    setNewWin('')
  }
  function removeWin(id) { update('wins', wins.filter(w => w.id !== id)) }
  function markFollowUpDone(id) {
    update('applications', applications.map(a => a.id === id ? { ...a, followUpDone: true } : a))
  }

  const fitColor = roleFit?.color === 'emerald' ? '#10b981' : roleFit?.color === 'amber' ? '#f59e0b' : '#FF5E5B'
  const fitBg = roleFit?.color === 'emerald' ? 'bg-emerald-50' : roleFit?.color === 'amber' ? 'bg-amber-50' : 'bg-red-50'
  const fitText = roleFit?.color === 'emerald' ? 'text-emerald-600' : roleFit?.color === 'amber' ? 'text-amber-600' : 'text-red-500'
  const fitVerdict = roleFit?.pct >= 70 ? 'Strong alignment' : roleFit?.pct >= 40 ? 'Moderate alignment' : 'Low alignment'

  const statusVariantClasses = {
    green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    neutral: 'bg-white/15 text-white/70 border-white/20',
  }

  return (
    <div className="max-w-5xl">

      {/* ── HERO ── */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1c2f3e] via-[#263746] to-[#1e3d55] p-7 mb-6 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#6D99F2]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 left-1/4 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-[#6D99F2]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div>
              {weeks > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-3 border border-white/10">
                  <Calendar size={11} />
                  Week {weeks} of your search
                </div>
              )}
              <h1 className="text-3xl font-bold text-white mb-1.5 font-['Inter']">
                {profile.name ? `Hey ${profile.name.split(' ')[0]} 👋` : 'Welcome back 👋'}
              </h1>
              <p className="text-white/55 text-sm italic font-['Playfair_Display'] max-w-lg">"{getQuote()}"</p>
            </div>
            <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border flex-shrink-0 ${statusVariantClasses[status.variant]}`}>
              <status.icon size={12} />
              {status.label}
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total applications', value: totalApps, icon: '📋', sub: 'all time' },
              { label: 'Interviews secured', value: interviews, icon: '🎤', sub: `${convRate}% conversion` },
              { label: 'Day streak', value: streak, icon: '🔥', sub: streak > 0 ? 'keep it going!' : 'start today' },
              {
                label: 'Weeks active', value: weeks, icon: '📅',
                sub: profile.startDate
                  ? `since ${new Date(profile.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`
                  : 'set your start date'
              },
            ].map(({ label, value, icon, sub }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
                <div className="text-xl mb-2">{icon}</div>
                <div className="text-2xl font-bold text-white font-['Inter'] leading-none mb-1">{value}</div>
                <div className="text-xs font-semibold text-white/80 leading-tight">{label}</div>
                <div className="text-xs text-white/40 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Log application', sub: 'Role Tracker', page: 'roles', icon: Briefcase, bg: 'from-[#1c2f3e] to-[#263746]', accent: '#6D99F2' },
          { label: 'Add networking', sub: 'Networking', page: 'networking', icon: Users, bg: 'from-[#14352a] to-[#1e4d3c]', accent: '#4ade80' },
          { label: 'Friday check-in', sub: 'Weekly Check-In', page: 'checkin', icon: ClipboardList, bg: 'from-[#3d2c10] to-[#563d18]', accent: '#FBD872' },
          { label: 'Log coaching', sub: 'Coaching Sessions', page: 'coaching', icon: CalendarCheck, bg: 'from-[#251840] to-[#362558]', accent: '#c084fc' },
        ].map(({ label, sub, page, icon: Icon, bg, accent }) => (
          <button
            key={label}
            onClick={() => navigate(page)}
            className={`bg-gradient-to-br ${bg} hover:opacity-90 active:scale-[0.98] rounded-xl p-4 text-left cursor-pointer transition-all border border-white/10 group`}
          >
            <Icon size={20} className="mb-3 flex-shrink-0" style={{ color: accent }} />
            <p className="text-white text-sm font-semibold leading-tight">{label}</p>
            <p className="text-white/40 text-xs mt-0.5 flex items-center gap-0.5 group-hover:text-white/60 transition-colors">
              {sub} <ChevronRight size={10} />
            </p>
          </button>
        ))}
      </div>

      {/* ── YOUR WEEK ── */}
      <div className="bg-white rounded-2xl border border-[#D8E4EC] p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#263746] font-['Inter']">Your week at a glance</h2>
            <p className="text-xs text-[#7A8FA3] mt-0.5">
              w/e {new Date().toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
              {days !== null && <span className="ml-3">{days === 0 ? '· Active today ✓' : `· Last active ${days}d ago`}</span>}
            </p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              <span className="text-xl">🔥</span>
              <div>
                <div className="text-lg font-bold text-[#263746] font-['Inter'] leading-none">{streak}</div>
                <div className="text-xs text-amber-700">day streak</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-8">
          {/* Apps */}
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-[#263746] font-['Inter'] leading-none">{appsWeek}</span>
                <span className="text-xl text-[#B8CAD8] font-['Inter']">/{profile.weeklyAppTarget || 5}</span>
              </div>
              {editingTarget === 'apps' ? (
                <form onSubmit={e => { e.preventDefault(); updateNested('profile', 'weeklyAppTarget', parseInt(targetDraft) || 5); setEditingTarget(null) }}>
                  <input
                    autoFocus
                    className="w-14 border border-[#6D99F2] rounded-lg px-2 py-1 text-xs text-center text-[#263746] focus:outline-none"
                    value={targetDraft}
                    onChange={e => setTargetDraft(e.target.value)}
                    onBlur={() => { updateNested('profile', 'weeklyAppTarget', parseInt(targetDraft) || 5); setEditingTarget(null) }}
                  />
                </form>
              ) : (
                <button
                  onClick={() => { setEditingTarget('apps'); setTargetDraft(String(profile.weeklyAppTarget || 5)) }}
                  className="text-xs text-[#6D99F2] hover:underline cursor-pointer"
                >edit target</button>
              )}
            </div>
            <div className="w-full h-4 bg-[#EEF3FA] rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${appsWeek >= (profile.weeklyAppTarget || 5) ? 'bg-emerald-500' : 'bg-[#6D99F2]'}`}
                style={{ width: `${Math.min(100, (appsWeek / (profile.weeklyAppTarget || 5)) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#263746]">Applications this week</p>
              {appsWeek >= (profile.weeklyAppTarget || 5)
                ? <span className="text-xs text-emerald-600 font-semibold">🎉 Target hit!</span>
                : <span className="text-xs text-[#7A8FA3]">{(profile.weeklyAppTarget || 5) - appsWeek} to go</span>
              }
            </div>
          </div>

          {/* Networking */}
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-[#263746] font-['Inter'] leading-none">{networkingWeek}</span>
                <span className="text-xl text-[#B8CAD8] font-['Inter']">/{profile.weeklyNetworkTarget || 3}</span>
              </div>
              {editingTarget === 'network' ? (
                <form onSubmit={e => { e.preventDefault(); updateNested('profile', 'weeklyNetworkTarget', parseInt(targetDraft) || 3); setEditingTarget(null) }}>
                  <input
                    autoFocus
                    className="w-14 border border-[#6D99F2] rounded-lg px-2 py-1 text-xs text-center text-[#263746] focus:outline-none"
                    value={targetDraft}
                    onChange={e => setTargetDraft(e.target.value)}
                    onBlur={() => { updateNested('profile', 'weeklyNetworkTarget', parseInt(targetDraft) || 3); setEditingTarget(null) }}
                  />
                </form>
              ) : (
                <button
                  onClick={() => { setEditingTarget('network'); setTargetDraft(String(profile.weeklyNetworkTarget || 3)) }}
                  className="text-xs text-[#6D99F2] hover:underline cursor-pointer"
                >edit target</button>
              )}
            </div>
            <div className="w-full h-4 bg-[#EEF3FA] rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${networkingWeek >= (profile.weeklyNetworkTarget || 3) ? 'bg-emerald-500' : 'bg-[#6D99F2]'}`}
                style={{ width: `${Math.min(100, (networkingWeek / (profile.weeklyNetworkTarget || 3)) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#263746]">Networking this week</p>
              {networkingWeek >= (profile.weeklyNetworkTarget || 3)
                ? <span className="text-xs text-emerald-600 font-semibold">🎉 Target hit!</span>
                : <span className="text-xs text-[#7A8FA3]">{(profile.weeklyNetworkTarget || 3) - networkingWeek} to go</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── ALERTS ── */}
      {checkinOverdue && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-4 bg-[#FBD872]/15 border border-[#FBD872]/40">
          <ClipboardList size={17} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-sm text-amber-800">Weekly check-in due</span>
            <span className="text-sm text-amber-700 ml-2">Keep the habit — fill in this week's reflection.</span>
          </div>
          <button
            onClick={() => navigate('checkin')}
            className="text-xs font-semibold text-amber-800 bg-white border border-[#FBD872]/60 px-3 py-1.5 rounded-lg hover:bg-[#FBD872]/20 cursor-pointer transition-colors flex-shrink-0"
          >
            Go to check-in
          </button>
        </div>
      )}

      {overdueFollowUps.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={15} className="text-red-500" />
            <span className="text-sm font-semibold text-red-700">{overdueFollowUps.length} follow-up{overdueFollowUps.length !== 1 ? 's' : ''} overdue</span>
          </div>
          <div className="space-y-2">
            {overdueFollowUps.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-3 bg-white rounded-lg px-3 py-2 border border-red-100">
                <div>
                  <span className="text-sm font-medium text-[#263746]">{a.company || 'Untitled'}</span>
                  {a.jobRole && <span className="text-xs text-[#7A8FA3] ml-2">{a.jobRole}</span>}
                  <span className="text-xs text-red-500 ml-2">Due {a.followUpDate}</span>
                </div>
                <button onClick={() => markFollowUpDone(a.id)} className="text-xs text-emerald-600 font-semibold hover:underline cursor-pointer flex-shrink-0">
                  Mark done
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {modulePrompts.length > 0 && (
        <div className="mb-6 space-y-2">
          {modulePrompts.map((p, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                p.urgency === 'amber' ? 'bg-amber-50 border-amber-200' :
                p.urgency === 'blue' ? 'bg-[#EEF3FA] border-[#C5D8EF]' :
                'bg-[#F8F5F2] border-[#D8E4EC]'
              }`}
            >
              <span className="text-xl flex-shrink-0">{p.icon}</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#263746] mb-0.5">{p.module}</p>
                <p className="text-xs text-[#4A5C6B]">{p.message}</p>
              </div>
              <Lightbulb size={14} className="text-[#D4AF37] flex-shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      )}

      {/* ── WIN LOG ── */}
      <div className="bg-white rounded-2xl border border-[#D8E4EC] p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-[#D4AF37]" />
          <h3 className="font-bold text-[#263746] font-['Inter']">Win Log</h3>
          <span className="text-xs text-[#7A8FA3]">— celebrate the small stuff</span>
        </div>
        <form onSubmit={addWin} className="flex gap-2 mb-4">
          <input
            className="flex-1 border border-[#D8E4EC] rounded-xl px-4 py-2.5 text-sm text-[#263746] placeholder:text-[#B8CAD8] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/30 bg-[#F8F5F2]"
            placeholder="Log a win — e.g. Got a callback from Google!"
            value={newWin}
            onChange={e => setNewWin(e.target.value)}
          />
          <button type="submit" className="bg-[#263746] hover:bg-[#1a2832] text-white px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors flex items-center gap-1.5">
            <Plus size={14} /> Add
          </button>
        </form>
        {wins.length === 0 ? (
          <p className="text-sm text-[#B8CAD8] italic text-center py-4">No wins logged yet — they don't have to be big!</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {wins.map(w => (
              <div key={w.id} className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#EEF3FA] to-[#F8F5F2] rounded-xl px-4 py-2.5 border border-[#E8F0F8]">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🏆</span>
                  <span className="text-sm text-[#263746] font-medium">{w.text}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-[#B8CAD8]">{w.date}</span>
                  <button onClick={() => removeWin(w.id)} className="text-[#D8E4EC] hover:text-[#FF5E5B] transition-colors cursor-pointer">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-[#D8E4EC]">
          <h3 className="font-bold text-[#263746] mb-4 font-['Inter']">Applications Over Time</h3>
          {appOverTime.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={appOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF3FA" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#7A8FA3' }} />
                <YAxis tick={{ fontSize: 10, fill: '#7A8FA3' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #D8E4EC' }} />
                <Line type="monotone" dataKey="apps" stroke="#6D99F2" strokeWidth={2.5} dot={{ fill: '#6D99F2', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center text-[#B8CAD8] text-sm gap-2">
              <TrendingUp size={28} className="opacity-30" />
              Log applications with dates to see your progress
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#D8E4EC]">
          <h3 className="font-bold text-[#263746] mb-4 font-['Inter']">Application Pipeline</h3>
          {totalApps > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={pipeline} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF3FA" />
                <XAxis dataKey="stage" tick={{ fontSize: 9, fill: '#7A8FA3' }} />
                <YAxis tick={{ fontSize: 10, fill: '#7A8FA3' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #D8E4EC' }} />
                <Bar dataKey="count" fill="#263746" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center text-[#B8CAD8] text-sm gap-2">
              <Briefcase size={28} className="opacity-30" />
              Add applications to see your pipeline
            </div>
          )}
        </div>
      </div>

      {/* ── ROLE FIT ── */}
      {roleFit ? (
        <div className="bg-white rounded-2xl p-6 border border-[#D8E4EC] mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-[#6D99F2]" />
              <h3 className="font-bold text-[#263746] font-['Inter']">Role Fit Score</h3>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${fitBg} ${fitText}`}>
              {fitVerdict}
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-5xl font-bold text-[#263746] font-['Inter']">{roleFit.overallAvg.toFixed(1)}</span>
                <span className="text-lg text-[#B8CAD8] mb-1">/5</span>
                <span className="text-sm text-[#7A8FA3] mb-1.5">avg across {roleFit.ratedCount} role{roleFit.ratedCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="w-full h-4 bg-[#EEF3FA] rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${roleFit.pct}%`, backgroundColor: fitColor }} />
              </div>
              {roleFit.best && (
                <p className="text-xs text-[#7A8FA3]">
                  Best fit: <span className="font-semibold text-[#263746]">{roleFit.best.jobRole || 'Untitled'}</span>
                  {roleFit.best.company ? ` at ${roleFit.best.company}` : ''}
                  {' '}({roleFit.best.total}/{BP_CATEGORIES.length * 5})
                </p>
              )}
            </div>
            <div className="space-y-2">
              {roleFit.catAverages.sort((a, b) => b.avg - a.avg).map(({ label, avg }) => {
                const pct = (avg / 5) * 100
                const barColor = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#FF5E5B'
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-[#4A5C6B] w-20 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-2.5 bg-[#EEF3FA] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                    <span className="text-xs font-semibold text-[#263746] w-6 text-right">{avg.toFixed(1)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── MILESTONES ── */}
      <div className="bg-white rounded-2xl p-6 border border-[#D8E4EC] mb-6">
        <h3 className="font-bold text-[#263746] mb-5 font-['Inter']">Milestones</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'First application', done: firstApp, msg: 'First application in. This is how it starts.' },
            { label: 'First interview', done: firstInterview, msg: 'First interview booked. You made the leap.' },
            { label: 'First offer', done: firstOffer, msg: "First offer on the table. Let's choose wisely." },
          ].map(({ label, done, msg }) => (
            <div
              key={label}
              className={`p-5 rounded-xl text-center border transition-all ${
                done
                  ? 'bg-gradient-to-br from-[#EEF3FA] to-[#F0F6FF] border-[#6D99F2]/30 shadow-sm'
                  : 'bg-[#F8F5F2] border-[#E8EDEF]'
              }`}
            >
              <div className={`text-2xl mb-2 ${done ? '' : 'grayscale opacity-30'}`}>{done ? '✅' : '⭕'}</div>
              <div className={`text-xs font-bold mb-1 ${done ? 'text-[#263746]' : 'text-[#B8CAD8]'}`}>{label}</div>
              {done && <div className="text-xs text-[#6D99F2] italic font-['Playfair_Display'] leading-snug">{msg}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── APPLICATIONS BY ROLE ── */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-[#D8E4EC] mb-6">
          <h3 className="font-bold text-[#263746] mb-4 font-['Inter']">Applications by Role</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  )
}
