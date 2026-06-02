import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const DataContext = createContext(null)

export const DEFAULTS = {
  profile: {
    name: '', email: '', coach: '', startDate: '', targetRole: '',
    linkedinUrl: '', resumeLink: '',
    weeklyAppTarget: 5, weeklyNetworkTarget: 3,
    jobTitles: [],
    onboardingComplete: false, watchedWelcome: false, thirtyDayGoal: '', ninetyDayGoal: '',
    usp: '', aboutMe: '',
  },
  blueprint: {
    company: '', culture: '', team: '', manager: '',
    tasks: '', values: '', environment: '', salary: '', notes: '',
    roleScores: [],
  },
  resumeVersions: [],
  applications: [],
  networking: [],
  events: [],
  linkedinChecklist: {
    headline: false, about: false, experience: false, skills: false,
    recommendations: false, activity: false, connections: false,
    endorsements: false, photo: false, url: false,
  },
  linkedinOutreach: [],
  interviewPrep: [],
  interviewFoundation: {
    starStories: {}, generalTalkingPoints: '', icebreakers: '', nervesStrategies: {}, nervesNotes: '',
  },
  questionBank: [],
  wins: [],
  salary: [],
  offers: [],
  coaching: [],
  weeklyCheckins: [],
  weeklyLog: [],
}

function getEmailParam() {
  // Support both ?email=foo@bar.com and the shorthand ?foo@bar.com format
  const search = window.location.search.slice(1)
  if (search.includes('@') && !search.includes('=')) return decodeURIComponent(search)
  return new URLSearchParams(window.location.search).get('email') || null
}

function getUid() {
  const params = new URLSearchParams(window.location.search)
  const urlUid = params.get('uid')
  if (urlUid) {
    // Use sessionStorage so the uid is scoped to this tab/session only.
    // A fresh tab or new browser session will always require email login.
    sessionStorage.setItem('py-tracker-uid', urlUid)
    // Keep localStorage in sync so the data cache uid-check still works
    localStorage.setItem('py-tracker-uid', urlUid)
    return urlUid
  }
  // If an email is in the URL, ignore any cached uid so the email lookup runs fresh
  if (getEmailParam()) return null
  // Only read from sessionStorage — not localStorage — so uid never leaks across tabs/sessions
  return sessionStorage.getItem('py-tracker-uid') || null
}

function mergeWithDefaults(saved) {
  const merged = { ...DEFAULTS, ...saved }
  // Auto-complete onboarding for existing users who already have a name
  // (prevents the onboarding from appearing for users who pre-date the onboarding flow)
  if (merged.profile?.name && !merged.profile?.onboardingComplete) {
    merged.profile = { ...merged.profile, onboardingComplete: true }
  }
  return merged
}

export function DataProvider({ children }) {
  const [uid, setUid] = useState(getUid)
  const emailParam = getEmailParam()
  const isBackend = !!uid
  const [data, setData] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(true)
  const saveTimer = useRef(null)

  // Load data on mount
  useEffect(() => {
    // If we have an email param but no uid, look up the token first
    if (!uid && emailParam) {
      fetch(`/api/lookup?email=${encodeURIComponent(emailParam)}`)
        .then(res => res.ok ? res.json() : null)
        .then(json => {
          if (json?.token) {
            localStorage.setItem('py-tracker-uid', json.token)
            setUid(json.token)
          } else {
            setHasAccess(null)
            setLoading(false)
          }
        })
        .catch(() => { setHasAccess(null); setLoading(false) })
      return
    }

    if (uid) {
      fetch(`/api/data?uid=${uid}`)
        .then(res => {
          if (res.status === 404) { setHasAccess(false); setLoading(false); return null }
          return res.json()
        })
        .then(json => {
          if (!json) return
          setData(mergeWithDefaults(json.data || {}))
          // Cache against this specific uid so fallback never serves another user's data
          localStorage.setItem('career-tracker-data', JSON.stringify({ uid, data: json.data || {} }))
          setLoading(false)
        })
        .catch(() => {
          try {
            const raw = localStorage.getItem('career-tracker-data')
            if (raw) {
              const parsed = JSON.parse(raw)
              // Only use cache if it belongs to this uid
              if (parsed?.uid === uid) setData(mergeWithDefaults(parsed.data || {}))
            }
          } catch {}
          setLoading(false)
        })
    } else {
      try {
        const raw = localStorage.getItem('career-tracker-data')
        if (raw) setData(mergeWithDefaults(JSON.parse(raw)))
      } catch {}
      setHasAccess(null)
      setLoading(false)
    }
  }, [uid])

  // Save data (debounced)
  const saveData = useCallback((newData) => {
    if (uid) {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        fetch(`/api/data?uid=${uid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: newData }),
        }).catch(console.error)
      }, 800)
    } else {
      // Fallback to localStorage
      localStorage.setItem('career-tracker-data', JSON.stringify(newData))
    }
  }, [isBackend, uid])

  function update(key, value) {
    setData(prev => {
      const next = { ...prev, [key]: value }
      saveData(next)
      return next
    })
  }

  function updateNested(key, field, value) {
    setData(prev => {
      const next = { ...prev, [key]: { ...prev[key], [field]: value } }
      saveData(next)
      return next
    })
  }

  return (
    <DataContext.Provider value={{ data, update, updateNested, loading, hasAccess, uid }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
