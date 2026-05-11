import { useData } from '../context/DataContext'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts'
import { Briefcase, Users, TrendingUp, Calendar, AlertCircle, CheckCircle, Clock, Target } from 'lucide-react'

const COLORS = ['#263746','#6D99F2','#9999FF','#D4AF37','#FF5E5B','#FBD872','#344f66']

const QUOTES = [
  "You don't have to be ready. You have to be willing.",
  "Small steps every day beat big leaps once a month.",
  "The right role won't feel like a gift -- it'll feel like a fit.",
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

function daysSinceLastActivity(applications) {
  const dates = applications.map(a => a.submittedDate).filter(Boolean).map(d => new Date(d))
  if (!dates.length) return null
  return Math.floor((Date.now() - Math.max(...dates)) / 86400000)
}

function getStatus(days, appsThisWeek, target) {
  if (days === null) return { label: 'No activity yet', color: 'text-[#7A8FA3]', icon: Clock, bg: 'bg-[#F5F9FD]' }
  if (days >= 7) return { label: 'No activity in 7+ days', color: 'text-[#FF5E5B]', icon: AlertCircle, bg: 'bg-red-50' }
  if (appsThisWeek < target) return { label: 'Below weekly target', color: 'text-[#D4AF37]', icon: AlertCircle, bg: 'bg-amber-50' }
  return { label: 'On track', color: 'text-emerald-600', icon: CheckCircle, bg: 'bg-emerald-50' }
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

  // Average score per category across all rated apps
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

  // Best fitting role
  const best = rated.reduce((best, a) => {
    const total = BP_CATEGORIES.reduce((s, { key }) => s + (parseInt(a.blueprintRatings[key]) || 0), 0)
    return total > (best?.total || 0) ? { ...a, total } : best
  }, null)

  return { overallAvg, pct, color, catAverages, best, ratedCount: rated.length }
}

function getPipelineData(applications) {
  const stages = ['Applied', 'Awaiting Response', 'Interview Scheduled', 'Offer Received']
  return stages.map(stage => ({
    stage: stage.replace(' ', '\n'),
    count: applications.filter(a => a.status === stage).length,
  }))
}

export default function Dashboard({ navigate }) {
  const { data } = useData()
  const { profile, applications, networking, weeklyCheckins } = data

  const totalApps = applications.length
  const interviews = applications.filter(a => a.interviewDate).length
  const convRate = totalApps ? ((interviews / totalApps) * 100).toFixed(1) : '0.0'
  const weeks = weeksActive(profile.startDate)
  const days = daysSinceLastActivity(applications)
  const appsWeek = appsThisWeek(applications)
  const networkingWeek = networking.filter(n => n.lastContact && new Date(n.lastContact) >= Date.now() - 7 * 86400000).length
  const status = getStatus(days, appsWeek, profile.weeklyAppTarget || 5)

  const roleMap = {}
  applications.forEach(a => { if (a.jobRole) roleMap[a.jobRole] = (roleMap[a.jobRole] || 0) + 1 })
  const pieData = Object.entries(roleMap).map(([name, value]) => ({ name, value }))

  const firstApp = applications.length > 0
  const firstInterview = applications.some(a => a.interviewDate)
  const firstOffer = data.offers?.length > 0

  const appOverTime = getApplicationsOverTime(applications)
  const roleFit = getRoleFitScore(applications)
  const pipeline = getPipelineData(applications)

  const fitColor = roleFit?.color === 'emerald' ? '#10b981' : roleFit?.color === 'amber' ? '#f59e0b' : '#FF5E5B'
  const fitBg = roleFit?.color === 'emerald' ? 'bg-emerald-50' : roleFit?.color === 'amber' ? 'bg-amber-50' : 'bg-red-50'
  const fitText = roleFit?.color === 'emerald' ? 'text-emerald-600' : roleFit?.color === 'amber' ? 'text-amber-600' : 'text-red-500'
  const fitVerdict = roleFit?.pct >= 70 ? 'Strong alignment' : roleFit?.pct >= 40 ? 'Moderate alignment' : 'Low alignment'

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">
          {profile.name ? `Hey ${profile.name.split(' ')[0]}` : 'Dashboard'}
        </h2>
        <p className="text-[#5A7080] text-sm italic font-['Playfair_Display']">"{getQuote()}"</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Log application', page: 'roles' },
          { label: 'Add networking', page: 'networking' },
          { label: 'Friday check-in', page: 'checkin' },
          { label: 'Log coaching', page: 'coaching' },
        ].map(({ label, page }) => (
          <button
            key={label}
            onClick={() => navigate(page)}
            className="py-3 px-4 bg-[#263746] hover:bg-[#1a2832] text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Status banner */}
      <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${status.bg} border border-[#D8E4EC]`}>
        <status.icon size={20} className={status.color} />
        <span className={`font-medium text-sm ${status.color}`}>{status.label}</span>
        {days !== null && (
          <span className="text-sm text-[#7A8FA3] ml-auto">
            {days === 0 ? 'Active today' : `${days} day${days !== 1 ? 's' : ''} since last activity`}
          </span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Apps this week', value: appsWeek, sub: `Target: ${profile.weeklyAppTarget || 5}`, icon: Briefcase, color: 'text-[#263746]', bg: 'bg-[#EEF3FA]' },
          { label: 'Networking this week', value: networkingWeek, sub: `Target: ${profile.weeklyNetworkTarget || 3}`, icon: Users, color: 'text-[#6D99F2]', bg: 'bg-[#EEF3FA]' },
          { label: 'Total applications', value: totalApps, sub: 'All time', icon: TrendingUp, color: 'text-[#263746]', bg: 'bg-[#EEF3FA]' },
          { label: 'Interviews secured', value: interviews, sub: `${convRate}% conversion`, icon: Calendar, color: 'text-[#D4AF37]', bg: 'bg-amber-50' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-[#D8E4EC]">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-3xl font-bold text-[#263746] mb-1 font-['Inter']">{value}</div>
            <div className="text-xs font-semibold text-[#263746] mb-0.5">{label}</div>
            <div className="text-xs text-[#7A8FA3]">{sub}</div>
          </div>
        ))}
      </div>

      {/* Role Fit Score */}
      {roleFit ? (
        <div className="bg-white rounded-xl p-6 border border-[#D8E4EC] mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-[#6D99F2]" />
              <h3 className="font-semibold text-[#263746] font-['Inter']">Role Fit Score</h3>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${fitBg} ${fitText}`}>
              {fitVerdict}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Overall score */}
            <div>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-5xl font-bold text-[#263746] font-['Inter']">{roleFit.overallAvg.toFixed(1)}</span>
                <span className="text-lg text-[#7A8FA3] mb-1">/5</span>
                <span className="text-sm text-[#7A8FA3] mb-1.5">avg across {roleFit.ratedCount} role{roleFit.ratedCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="w-full h-3 bg-[#EEF3FA] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${roleFit.pct}%`, backgroundColor: fitColor }}
                />
              </div>
              {roleFit.best && (
                <p className="text-xs text-[#7A8FA3]">
                  Best fit: <span className="font-semibold text-[#263746]">{roleFit.best.jobRole || 'Untitled'}</span>
                  {roleFit.best.company ? ` at ${roleFit.best.company}` : ''}
                  {' '}({roleFit.best.total}/{BP_CATEGORIES.length * 5})
                </p>
              )}
            </div>

            {/* Category breakdown */}
            <div className="space-y-2">
              {roleFit.catAverages.sort((a, b) => b.avg - a.avg).map(({ label, avg }) => {
                const pct = (avg / 5) * 100
                const barColor = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#FF5E5B'
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-[#4A5C6B] w-20 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-[#EEF3FA] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                    <span className="text-xs font-semibold text-[#263746] w-6 text-right">{avg.toFixed(1)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 border border-[#D8E4EC] mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} className="text-[#6D99F2]" />
            <h3 className="font-semibold text-[#263746] font-['Inter']">Role Fit Score</h3>
          </div>
          <p className="text-sm text-[#7A8FA3]">Rate blueprint alignment on your role applications to see your fit score here.</p>
        </div>
      )}

      {/* Progress chart + Pipeline */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Applications over time */}
        <div className="bg-white rounded-xl p-6 border border-[#D8E4EC]">
          <h3 className="font-semibold text-[#263746] mb-4 font-['Inter']">Applications Over Time</h3>
          {appOverTime.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={appOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF3FA" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#7A8FA3' }} />
                <YAxis tick={{ fontSize: 10, fill: '#7A8FA3' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="apps" stroke="#6D99F2" strokeWidth={2} dot={{ fill: '#6D99F2', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-[#7A8FA3] text-sm">
              Log applications with dates to see your progress
            </div>
          )}
        </div>

        {/* Pipeline */}
        <div className="bg-white rounded-xl p-6 border border-[#D8E4EC]">
          <h3 className="font-semibold text-[#263746] mb-4 font-['Inter']">Application Pipeline</h3>
          {totalApps > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={pipeline} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF3FA" />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#7A8FA3' }} />
                <YAxis tick={{ fontSize: 10, fill: '#7A8FA3' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="#263746" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-[#7A8FA3] text-sm">
              Add applications to see your pipeline
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Pie chart */}
        <div className="bg-white rounded-xl p-6 border border-[#D8E4EC]">
          <h3 className="font-semibold text-[#263746] mb-4 font-['Inter']">Applications by Role</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-[#7A8FA3] text-sm">
              Add applications to see the breakdown
            </div>
          )}
        </div>

        {/* Overall progress */}
        <div className="bg-white rounded-xl p-6 border border-[#D8E4EC]">
          <h3 className="font-semibold text-[#263746] mb-4 font-['Inter']">Overall Progress</h3>
          <div className="space-y-3">
            {[
              ['Total applications', totalApps],
              ['Interviews secured', interviews],
              ['Conversion rate', `${convRate}%`],
              ['Weeks active', weeks],
              ['Days since last activity', days !== null ? days : '--'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-[#EEF3FA] last:border-0">
                <span className="text-sm text-[#4A5C6B]">{label}</span>
                <span className="text-sm font-semibold text-[#263746]">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-xl p-6 border border-[#D8E4EC] mb-6">
        <h3 className="font-semibold text-[#263746] mb-4 font-['Inter']">Milestones</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'First application', done: firstApp, msg: 'First application in. This is how it starts.' },
            { label: 'First interview', done: firstInterview, msg: 'First interview booked. You made the leap.' },
            { label: 'First offer', done: firstOffer, msg: "First offer on the table. Let's choose wisely." },
          ].map(({ label, done, msg }) => (
            <div key={label} className={`p-4 rounded-xl text-center border ${done ? 'bg-[#EEF3FA] border-[#6D99F2]/30' : 'bg-[#F8F5F2] border-[#D8E4EC]'}`}>
              <div className="text-2xl mb-2">{done ? '✓' : '·'}</div>
              <div className={`text-xs font-semibold mb-1 ${done ? 'text-[#263746]' : 'text-[#7A8FA3]'}`}>{label}</div>
              {done && <div className="text-xs text-[#6D99F2] italic font-['Playfair_Display']">{msg}</div>}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
