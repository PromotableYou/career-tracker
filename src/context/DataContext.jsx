import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const DataContext = createContext(null)

export const DEFAULTS = {
  profile: {
    name: '', email: '', coach: '', startDate: '', targetRole: '',
    linkedinUrl: '', resumeLink: '',
    weeklyAppTarget: 5, weeklyNetworkTarget: 3,
    jobTitles: [],
  },
  blueprint: {
    company: '', culture: '', team: '', manager: '',
    tasks: '', values: '', environment: '', salary: '', notes: '',
    roleScores: [],
  },
  resumeVersions: [],
  applications: [],
  networking: [],
  linkedinChecklist: {
    headline: false, about: false, experience: false, skills: false,
    recommendations: false, activity: false, connections: false,
    endorsements: false, photo: false, url: false,
  },
  linkedinOutreach: [],
  interviewPrep: [],
  salary: [],
  offers: [],
  coaching: [],
  weeklyCheckins: Array.from({ length: 12 }, (_, i) => ({
    id: i + 1, weekOf: '', appsSubmitted: 0, networkingActions: 0,
    interviewsScheduled: 0, wentWell: '', didntWork: '', feeling: '',
    focusNextWeek: '', energyLevel: '', submitted: false,
  })),
}

function getUid() {
  // Check URL first, then localStorage
  const urlUid = new URLSearchParams(window.location.search).get('uid')
  if (urlUid) {
    localStorage.setItem('py-tracker-uid', urlUid)
    return urlUid
  }
  return localStorage.getItem('py-tracker-uid') || null
}

function mergeWithDefaults(saved) {
  return { ...DEFAULTS, ...saved }
}

export function DataProvider({ children }) {
  const uid = getUid()
  const isBackend = !!uid
  const [data, setData] = useState(DEFAULTS)
  const [loading, setLoading] = useState(isBackend)
  const [hasAccess, setHasAccess] = useState(!isBackend ? null : true)
  const saveTimer = useRef(null)

  // Load data on mount
  useEffect(() => {
    if (isBackend) {
      fetch(`/api/data?uid=${uid}`)
        .then(res => {
          if (res.status === 404) { setHasAccess(false); setLoading(false); return null }
          return res.json()
        })
        .then(json => {
          if (!json) return
          setData(mergeWithDefaults(json.data || {}))
          setLoading(false)
        })
        .catch(() => {
          // Fall back to localStorage if API unreachable
          try {
            const raw = localStorage.getItem('career-tracker-data')
            if (raw) setData(mergeWithDefaults(JSON.parse(raw)))
          } catch {}
          setLoading(false)
        })
    } else {
      // No uid — use localStorage
      try {
        const raw = localStorage.getItem('career-tracker-data')
        if (raw) setData(mergeWithDefaults(JSON.parse(raw)))
      } catch {}
      setHasAccess(null) // null = no uid, show NoAccess
    }
  }, [])

  // Save data (debounced)
  const saveData = useCallback((newData) => {
    if (isBackend && uid) {
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
