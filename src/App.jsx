import { useState, useRef, useEffect } from 'react'
import { DataProvider, useData } from './context/DataContext'
import CoachDashboard from './pages/CoachDashboard'
import NoAccess from './pages/NoAccess'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import MyProfile from './pages/MyProfile'
import RoleTracker from './pages/RoleTracker'
import Networking from './pages/Networking'
import LinkedIn from './pages/LinkedIn'
import InterviewPrep from './pages/InterviewPrep'
import Coaching from './pages/Coaching'
import WeeklyCheckin from './pages/WeeklyCheckin'
import Events from './pages/Events'
import {
  LayoutDashboard, User, Briefcase, Network,
  Link2, MessageSquare, CalendarCheck,
  ClipboardList, Menu, X, ChevronRight, Search, GraduationCap
} from 'lucide-react'
import pyLogo from './assets/py-logo.png'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'myprofile', label: 'My Profile', icon: User },
  { id: 'roles', label: 'Role Tracker', icon: Briefcase },
  { id: 'networking', label: 'Networking', icon: Network },
  { id: 'linkedin', label: 'LinkedIn', icon: Link2 },
  { id: 'interviews', label: 'Interview Prep', icon: MessageSquare },
  { id: 'coaching', label: 'Coaching Sessions', icon: CalendarCheck },
  { id: 'checkin', label: 'Weekly Check-In', icon: ClipboardList },
  { id: 'events', label: 'Professional Dev', icon: GraduationCap },
]

const PAGES = {
  dashboard: Dashboard, myprofile: MyProfile, roles: RoleTracker,
  networking: Networking, linkedin: LinkedIn,
  interviews: InterviewPrep, coaching: Coaching, checkin: WeeklyCheckin, events: Events,
}

function EmbedLayout({ page, navigate, Page }) {
  const { data, uid } = useData()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const searchRef = useRef(null)
  const params = new URLSearchParams(window.location.search)
  const backUrl = params.get('back') || ''

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const q = query.toLowerCase()
    const appMatches = (data.applications || [])
      .filter(a => (a.company || '').toLowerCase().includes(q) || (a.jobRole || '').toLowerCase().includes(q))
      .slice(0, 4)
      .map(a => ({ label: a.company || 'Untitled', sub: a.jobRole || '', page: 'roles', icon: Briefcase }))
    const netMatches = (data.networking || [])
      .filter(n => (n.name || '').toLowerCase().includes(q) || (n.company || '').toLowerCase().includes(q))
      .slice(0, 3)
      .map(n => ({ label: n.name || 'Untitled', sub: n.company || '', page: 'networking', icon: Network }))
    setResults([...appMatches, ...netMatches])
  }, [query, data])

  function pick(p) { navigate(p); setQuery(''); setResults([]) }

  function goBack() {
    if (backUrl) window.top.location.href = backUrl
    else window.top.history.back()
  }

  function navTo(id) { navigate(id); setMobileNavOpen(false) }

  const SidebarNav = () => (
    <>
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => navTo(id)}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-xs font-medium transition-colors cursor-pointer
              ${page === id ? 'bg-[#EEF3FA] text-[#263746]' : 'text-[#4A5C6B] hover:bg-[#F5F9FD] hover:text-[#263746]'}
            `}
          >
            <Icon size={14} className={page === id ? 'text-[#6D99F2]' : 'text-[#7A8FA3]'} />
            {label}
            {page === id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6D99F2]" />}
          </button>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-[#D8E4EC]">
        <p className="text-[10px] text-[#7A8FA3]">{uid ? '☁️ Data synced to your account' : 'Data saved in your browser'}</p>
      </div>
    </>
  )

  return (
    <div className="flex flex-col h-screen bg-[#F8F5F2] overflow-hidden">

      {/* Top bar */}
      <header className="h-12 bg-white border-b border-[#D8E4EC] flex items-center px-4 gap-3 flex-shrink-0 z-10">
        {/* Mobile: hamburger. Desktop: Back button */}
        <button
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden text-[#4A5C6B] hover:text-[#263746] cursor-pointer flex-shrink-0"
        >
          <Menu size={18} />
        </button>
        <button
          onClick={goBack}
          className="hidden md:flex items-center gap-1.5 text-sm text-[#4A5C6B] hover:text-[#263746] transition-colors cursor-pointer flex-shrink-0 font-medium"
        >
          <ChevronRight size={14} className="rotate-180" />
          Back
        </button>

        <div className="flex-1 relative max-w-xl mx-auto" ref={searchRef}>
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA3]" />
          <input
            className="w-full bg-[#F5F9FD] border border-[#D8E4EC] rounded-lg pl-8 pr-3 py-1.5 text-sm text-[#263746] placeholder:text-[#7A8FA3] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40"
            placeholder="Search applications, contacts..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D8E4EC] rounded-xl shadow-lg z-50 overflow-hidden">
              {results.map((r, i) => (
                <button key={i} onClick={() => pick(r.page)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F5F9FD] text-left cursor-pointer">
                  <r.icon size={14} className="text-[#6D99F2] flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[#263746]">{r.label}</p>
                    {r.sub && <p className="text-[10px] text-[#7A8FA3]">{r.sub}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <img src={pyLogo} alt="Promotable You" className="h-5 w-auto flex-shrink-0" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-52 flex-shrink-0 bg-white border-r border-[#D8E4EC] flex-col">
          <SidebarNav />
        </aside>

        {/* Mobile drawer overlay */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-64 bg-white flex flex-col shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#D8E4EC]">
                <span className="text-sm text-[#263746]" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600 }}>
                  Application Accelerator
                </span>
                <button onClick={() => setMobileNavOpen(false)} className="text-[#7A8FA3] cursor-pointer"><X size={16} /></button>
              </div>
              <SidebarNav />
              <button onClick={goBack} className="flex items-center gap-2 px-5 py-4 text-sm text-[#4A5C6B] hover:text-[#263746] border-t border-[#D8E4EC] cursor-pointer">
                <ChevronRight size={14} className="rotate-180" /> Back to community
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
          <Page navigate={navigate} />
        </main>
      </div>

    </div>
  )
}

function AppInner() {
  const { loading, hasAccess, uid } = useData()
  const [page, setPage] = useState('dashboard')
  const [open, setOpen] = useState(false)
  const Page = PAGES[page]
  const isEmbed = new URLSearchParams(window.location.search).get('embed') === 'true'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#263746] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#7A8FA3]">Loading your tracker...</p>
        </div>
      </div>
    )
  }

  if (hasAccess === null) return <NoAccess />

  const { data, updateNested } = useData()
  // Only skip onboarding once explicitly completed (existing users are handled in mergeWithDefaults)
  const skipOnboarding = !!data.profile?.onboardingComplete
  if (!skipOnboarding) {
    return <Onboarding onComplete={() => updateNested('profile', 'onboardingComplete', true)} />
  }

  function navigate(id) {
    setPage(id)
    setOpen(false)
  }

  if (isEmbed) {
    return <EmbedLayout page={page} navigate={navigate} Page={Page} />
  }

  return (
    <DataProvider>
      <div className="min-h-screen bg-[#F8F5F2]">

        {/* Top bar */}
        <header className="bg-white border-b border-[#D8E4EC] sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setOpen(o => !o)}
                className="text-[#263746] hover:text-[#6D99F2] transition-colors cursor-pointer"
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div className="flex flex-col leading-tight">
                <span
                  className="text-2xl text-[#263746]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 700 }}
                >
                  Application Accelerator
                </span>
                <span
                  className="text-xs text-[#7A8FA3] tracking-wide"
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
                >
                  by Promotable You
                </span>
              </div>
            </div>
            <img src={pyLogo} alt="Promotable You" className="h-7 w-auto" />
          </div>
        </header>

        {/* Drawer overlay */}
        {open && (
          <div
            className="fixed inset-0 bg-black/30 z-30"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Drawer */}
        <div className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-[#D8E4EC] z-40
          flex flex-col shadow-lg
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors cursor-pointer
                  ${page === id
                    ? 'bg-[#EEF3FA] text-[#263746]'
                    : 'text-[#4A5C6B] hover:bg-[#F5F9FD] hover:text-[#263746]'
                  }
                `}
              >
                <Icon size={16} className={page === id ? 'text-[#6D99F2]' : 'text-[#7A8FA3]'} />
                {label}
                {page === id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6D99F2]" />}
              </button>
            ))}
          </nav>
          <div className="px-5 py-4 border-t border-[#D8E4EC]">
            <p className="text-xs text-[#7A8FA3]">{uid ? '☁️ Data synced to your account' : 'Data saved locally in your browser'}</p>
          </div>
        </div>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-6 py-8">
          <Page navigate={navigate} />
        </main>

      </div>
    </DataProvider>
  )
}

export default function App() {
  const coachKey = new URLSearchParams(window.location.search).get('coach')
  if (coachKey) return <CoachDashboard coachKey={coachKey} />

  return (
    <DataProvider>
      <AppInner />
    </DataProvider>
  )
}
