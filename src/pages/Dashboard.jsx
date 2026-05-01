import { useData } from '../context/DataContext'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Briefcase, Users, TrendingUp, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react'

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
