import { useState, useEffect, useRef } from 'react'
import {
  Users, Briefcase, CheckCircle, AlertCircle, ExternalLink, Search,
  StickyNote, TrendingUp, Clock, Award, ChevronDown, ChevronUp, Trophy,
  Copy, Check, Bell, Plus, X, Calendar, ListChecks, LogOut, UserPlus,
  CheckSquare, Square, Trash2, RefreshCw, ChevronRight, UserCog
} from 'lucide-react'
import pyLogo from '../assets/py-logo.png'

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

function getRisk(days) {
  if (days === null || days === undefined) return 'none'
  if (days < 7) return 'green'
  if (days < 14) return 'amber'
  return 'red'
}

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function RiskBadge({ days }) {
  if (days === null) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EEF3FA] text-[#7A8FA3]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#7A8FA3]" />No data
    </span>
  )
  if (days === 0) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Today
    </span>
  )
  if (days < 7) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{days}d ago
    </span>
  )
  if (days < 14) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{days}d ago
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#FF5E5B]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E5B]" />{days}d ago
    </span>
  )
}

function WinCard({ win }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(`🏆 ${win.memberName}: "${win.text}"`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="bg-[#FFFDF5] border border-[#D4AF37]/30 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-xs font-bold text-[#D4AF37] flex-shrink-0">
            {win.memberInitial}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#263746] truncate">{win.memberName}</p>
            {win.date && <p className="text-[10px] text-[#7A8FA3]">{new Date(win.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>}
          </div>
        </div>
        <button
          onClick={copy}
          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0 cursor-pointer transition-colors ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-white border border-[#D8E4EC] text-[#7A8FA3] hover:text-[#263746]'}`}
        >
          {copied ? <><Check size={10} />Copied</> : <><Copy size={10} />Copy</>}
        </button>
      </div>
      <p className="text-sm text-[#263746] leading-relaxed">"{win.text}"</p>
    </div>
  )
}

function SectionHeader({ title, subtitle, gold }) {
  return (
    <div className={`px-5 py-3 rounded-t-xl border-b border-[#D8E4EC] ${gold ? 'bg-[#D4AF37]' : 'bg-[#263746]'}`}>
      <h2 className={`font-bold text-sm tracking-wide ${gold ? 'text-[#263746]' : 'text-white'}`}>{title}</h2>
      {subtitle && <p className={`text-xs mt-0.5 ${gold ? 'text-[#263746]/70' : 'text-white/60'}`}>{subtitle}</p>}
    </div>
  )
}

// ─── Sessions Panel ──────────────────────────────────────────────────────────

function SessionsPanel({ memberId, headers }) {
  const [sessions, setSessions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ sessionDate: new Date().toISOString().split('T')[0], sessionType: 'General Q&A', notes: '', keyTakeaway: '', nextSteps: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/coach-sessions?memberId=${memberId}`, { headers })
      .then(r => r.json())
      .then(j => { setSessions(j.sessions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [memberId])

  async function createSession(e) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/coach-sessions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'create', memberId, ...form }),
    })
    const j = await res.json()
    if (j.session) {
      setSessions(prev => [j.session, ...(prev || [])])
      setShowForm(false)
      setForm({ sessionDate: new Date().toISOString().split('T')[0], sessionType: 'General Q&A', notes: '', keyTakeaway: '', nextSteps: '' })
    }
    setSaving(false)
  }

  async function deleteSession(sessionId) {
    await fetch('/api/coach-sessions', { method: 'POST', headers, body: JSON.stringify({ action: 'delete', sessionId }) })
    setSessions(prev => (prev || []).filter(s => s.id !== sessionId))
  }

  if (loading) return <p className="text-xs text-[#7A8FA3] py-4 text-center">Loading sessions…</p>

  const SESSION_TYPES = ['General Q&A', 'Confidence & Clarity', 'Group Coaching', 'Resumes & Interviews', '1:1 Coaching', 'Check-in', 'Other']

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-[#263746] uppercase tracking-wide flex items-center gap-1.5">
          <Calendar size={13} className="text-[#6D99F2]" />
          Coaching Sessions ({(sessions || []).length})
        </p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 text-xs font-semibold text-[#6D99F2] hover:text-[#263746] cursor-pointer"
        >
          <Plus size={13} />{showForm ? 'Cancel' : 'Log Session'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createSession} className="bg-[#EEF3FA] rounded-xl p-4 mb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[#4A5C6B] uppercase mb-1">Date</label>
              <input type="date" required value={form.sessionDate} onChange={e => setForm(p => ({ ...p, sessionDate: e.target.value }))}
                className="w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#4A5C6B] uppercase mb-1">Type</label>
              <select value={form.sessionType} onChange={e => setForm(p => ({ ...p, sessionType: e.target.value }))}
                className="w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40">
                {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#4A5C6B] uppercase mb-1">Session Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 resize-none"
              placeholder="What was discussed…" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#4A5C6B] uppercase mb-1">Key Takeaway</label>
            <input value={form.keyTakeaway} onChange={e => setForm(p => ({ ...p, keyTakeaway: e.target.value }))}
              className="w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40"
              placeholder="The main insight from this session…" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#4A5C6B] uppercase mb-1">Next Steps</label>
            <input value={form.nextSteps} onChange={e => setForm(p => ({ ...p, nextSteps: e.target.value }))}
              className="w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40"
              placeholder="Action items for next session…" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-[#7A8FA3] px-3 py-1.5 cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="text-xs font-semibold bg-[#263746] text-white px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Session'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {(sessions || []).length === 0 && !showForm && (
          <p className="text-xs text-[#7A8FA3] py-3 text-center">No sessions logged yet</p>
        )}
        {(sessions || []).map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-[#D8E4EC] p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-xs font-semibold text-[#263746]">{fmtDate(s.session_date)}</span>
                <span className="ml-2 text-[10px] bg-[#EEF3FA] text-[#6D99F2] px-2 py-0.5 rounded-full font-medium">{s.session_type}</span>
              </div>
              <button onClick={() => deleteSession(s.id)} className="text-[#7A8FA3] hover:text-[#FF5E5B] cursor-pointer flex-shrink-0">
                <Trash2 size={12} />
              </button>
            </div>
            {s.notes && <p className="text-xs text-[#4A5C6B] mb-1">{s.notes}</p>}
            {s.key_takeaway && <p className="text-xs text-[#263746] font-medium">Key takeaway: {s.key_takeaway}</p>}
            {s.next_steps && <p className="text-xs text-[#7A8FA3] mt-1">Next steps: {s.next_steps}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Actions Panel ───────────────────────────────────────────────────────────

function ActionsPanel({ memberId, headers }) {
  const [actions, setActions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', dueDate: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/coach-actions?memberId=${memberId}`, { headers })
      .then(r => r.json())
      .then(j => { setActions(j.actions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [memberId])

  async function createAction(e) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/coach-actions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'create', memberId, ...form }),
    })
    const j = await res.json()
    if (j.item) {
      setActions(prev => [j.item, ...(prev || [])])
      setShowForm(false)
      setForm({ title: '', description: '', dueDate: '' })
    }
    setSaving(false)
  }

  async function toggleAction(item) {
    const actionName = item.status === 'completed' ? 'reopen' : 'complete'
    const res = await fetch('/api/coach-actions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: actionName, actionId: item.id }),
    })
    const j = await res.json()
    if (j.item) {
      setActions(prev => (prev || []).map(a => a.id === item.id ? j.item : a))
    }
  }

  async function deleteAction(actionId) {
    await fetch('/api/coach-actions', { method: 'POST', headers, body: JSON.stringify({ action: 'delete', actionId }) })
    setActions(prev => (prev || []).filter(a => a.id !== actionId))
  }

  if (loading) return <p className="text-xs text-[#7A8FA3] py-4 text-center">Loading action items…</p>

  const pending = (actions || []).filter(a => a.status !== 'completed')
  const done = (actions || []).filter(a => a.status === 'completed')

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-[#263746] uppercase tracking-wide flex items-center gap-1.5">
          <ListChecks size={13} className="text-[#D4AF37]" />
          Action Items ({pending.length} open)
        </p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 text-xs font-semibold text-[#6D99F2] hover:text-[#263746] cursor-pointer"
        >
          <Plus size={13} />{showForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createAction} className="bg-[#EEF3FA] rounded-xl p-4 mb-3 space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-[#4A5C6B] uppercase mb-1">Action Item *</label>
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
              placeholder="e.g. Update LinkedIn headline" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#4A5C6B] uppercase mb-1">Details (optional)</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
              placeholder="Extra context…" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#4A5C6B] uppercase mb-1">Due Date (optional)</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
              className="w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-[#7A8FA3] px-3 py-1.5 cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="text-xs font-semibold bg-[#D4AF37] text-[#263746] px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-50">
              {saving ? 'Saving…' : 'Add Action'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {(actions || []).length === 0 && !showForm && (
          <p className="text-xs text-[#7A8FA3] py-3 text-center">No action items yet</p>
        )}
        {[...pending, ...done].map(item => (
          <div key={item.id} className={`bg-white rounded-xl border p-3 flex items-start gap-3 ${item.status === 'completed' ? 'border-emerald-100 opacity-60' : 'border-[#D8E4EC]'}`}>
            <button onClick={() => toggleAction(item)} className="flex-shrink-0 mt-0.5 cursor-pointer text-[#7A8FA3] hover:text-[#263746]">
              {item.status === 'completed' ? <CheckSquare size={15} className="text-emerald-600" /> : <Square size={15} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold text-[#263746] ${item.status === 'completed' ? 'line-through' : ''}`}>{item.title}</p>
              {item.description && <p className="text-[10px] text-[#7A8FA3] mt-0.5">{item.description}</p>}
              {item.due_date && (
                <p className={`text-[10px] mt-1 font-medium ${new Date(item.due_date) < new Date() && item.status !== 'completed' ? 'text-[#FF5E5B]' : 'text-[#7A8FA3]'}`}>
                  Due: {fmtDate(item.due_date)}
                </p>
              )}
            </div>
            <button onClick={() => deleteAction(item.id)} className="text-[#7A8FA3] hover:text-[#FF5E5B] cursor-pointer flex-shrink-0">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Notifications Panel ─────────────────────────────────────────────────────

function NotificationIcon({ type }) {
  const icons = {
    first_application: '📋',
    first_interview: '🎯',
    first_offer: '🎉',
    checkin_submitted: '✅',
    inactive_member: '⚠️',
  }
  return <span className="text-base">{icons[type] || '🔔'}</span>
}

function NotificationsPanel({ notifications, onMarkRead, onMarkAllRead, onClose }) {
  const unread = notifications.filter(n => !n.read)

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-[#D8E4EC] rounded-2xl shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#EEF3FA]">
        <p className="text-sm font-bold text-[#263746]">Notifications {unread.length > 0 && `(${unread.length} unread)`}</p>
        <div className="flex items-center gap-2">
          {unread.length > 0 && (
            <button onClick={onMarkAllRead} className="text-xs text-[#6D99F2] hover:underline cursor-pointer">Mark all read</button>
          )}
          <button onClick={onClose} className="text-[#7A8FA3] hover:text-[#263746] cursor-pointer"><X size={15} /></button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto divide-y divide-[#EEF3FA]">
        {notifications.length === 0 && (
          <p className="text-sm text-[#7A8FA3] text-center py-8">You're all caught up!</p>
        )}
        {notifications.map(n => (
          <div
            key={n.id}
            className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-[#F8F5F2] ${!n.read ? 'bg-[#EEF3FA]/40' : ''}`}
            onClick={() => !n.read && onMarkRead(n.id)}
          >
            <NotificationIcon type={n.type} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold text-[#263746] ${!n.read ? 'font-bold' : ''}`}>{n.title}</p>
              {n.message && <p className="text-[10px] text-[#7A8FA3] mt-0.5 leading-relaxed">{n.message}</p>}
              <p className="text-[10px] text-[#7A8FA3] mt-1">{fmtDate(n.created_at)}</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full bg-[#6D99F2] flex-shrink-0 mt-1" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Invite Member Modal ─────────────────────────────────────────────────────

function InviteMemberModal({ coaches, currentCoach, headers, onClose, onInvited }) {
  const [form, setForm] = useState({ name: '', email: '', coachId: currentCoach.id })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/coach-members', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'invite', ...form }),
    })
    const j = await res.json()
    setSaving(false)
    if (!res.ok) { setError(j.error); return }
    setResult(j)
    onInvited && onInvited(j)
  }

  function copyUrl() {
    navigator.clipboard.writeText(result.trackerUrl)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#D8E4EC] w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEF3FA]">
          <p className="font-bold text-sm text-[#263746]">Invite New Member</p>
          <button onClick={onClose} className="text-[#7A8FA3] hover:text-[#263746] cursor-pointer"><X size={16} /></button>
        </div>

        {result ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">{result.alreadyExists ? '👋' : '🎉'}</div>
            <p className="font-semibold text-[#263746] mb-1">
              {result.alreadyExists ? 'Member already exists!' : 'Member invited!'}
            </p>
            <p className="text-xs text-[#7A8FA3] mb-4">Share this tracker link with them:</p>
            <div className="bg-[#F8F5F2] rounded-xl border border-[#D8E4EC] px-4 py-3 mb-4 flex items-center gap-3">
              <p className="text-xs text-[#4A5C6B] break-all flex-1">{result.trackerUrl}</p>
              <button onClick={copyUrl} className="flex-shrink-0 text-[#7A8FA3] hover:text-[#263746] cursor-pointer">
                <Copy size={14} />
              </button>
            </div>
            <button onClick={onClose} className="bg-[#263746] text-white text-sm font-semibold px-6 py-2.5 rounded-lg cursor-pointer">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#263746] uppercase tracking-wide mb-1.5">Full Name</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-[#D8E4EC] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40"
                placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#263746] uppercase tracking-wide mb-1.5">Email Address</label>
              <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full border border-[#D8E4EC] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40"
                placeholder="jane@example.com" />
            </div>
            {coaches.length > 1 && (
              <div>
                <label className="block text-xs font-semibold text-[#263746] uppercase tracking-wide mb-1.5">Assign to Coach</label>
                <select value={form.coachId} onChange={e => setForm(p => ({ ...p, coachId: e.target.value }))}
                  className="w-full border border-[#D8E4EC] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40">
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            {error && <p className="text-xs text-[#FF5E5B]">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="text-sm text-[#7A8FA3] px-4 py-2 cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="bg-[#263746] text-white text-sm font-semibold px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50">
                {saving ? 'Inviting…' : 'Send Invite'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function CoachDashboard({ auth, onLogout }) {
  const [members, setMembers] = useState([])
  const [currentCoach, setCurrentCoach] = useState(auth?.coach || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('lastActive')
  const [coachFilter, setCoachFilter] = useState('')
  const [expandedMember, setExpandedMember] = useState(null)
  const [expandedTab, setExpandedTab] = useState({})
  const [notesDraft, setNotesDraft] = useState({})
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [allCoaches, setAllCoaches] = useState([])
  const saveTimers = useRef({})
  const notifRef = useRef(null)

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${auth?.token}`,
  }

  // Close notifications on outside click
  useEffect(() => {
    function handler(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load members
  useEffect(() => {
    fetch('/api/admin', { headers })
      .then(res => {
        if (res.status === 401 || res.status === 403) { onLogout(); return null }
        return res.ok ? res.json() : res.json().then(j => { throw new Error(j.error) })
      })
      .then(json => {
        if (!json) return
        setMembers(json.members || [])
        if (json.currentCoach) setCurrentCoach(json.currentCoach)
        const drafts = {}
        ;(json.members || []).forEach(m => { drafts[m.id] = m.coachNotes || '' })
        setNotesDraft(drafts)
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  // Load notifications
  useEffect(() => {
    fetch('/api/coach-notifications', { headers })
      .then(r => r.json())
      .then(j => setNotifications(j.notifications || []))
      .catch(() => {})
  }, [])

  // Load all coaches (for reassign/invite)
  useEffect(() => {
    fetch('/api/coach-members', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'listCoaches' }),
    })
      .then(r => r.json())
      .then(j => setAllCoaches(j.coaches || []))
      .catch(() => {})
  }, [])

  function updateNotes(memberId, value) {
    setNotesDraft(prev => ({ ...prev, [memberId]: value }))
    if (saveTimers.current[memberId]) clearTimeout(saveTimers.current[memberId])
    saveTimers.current[memberId] = setTimeout(() => {
      fetch('/api/admin', { method: 'POST', headers, body: JSON.stringify({ memberId, notes: value }) })
    }, 800)
  }

  async function markNotifRead(id) {
    await fetch('/api/coach-notifications', { method: 'POST', headers, body: JSON.stringify({ action: 'markRead', notificationId: id }) })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    await fetch('/api/coach-notifications', { method: 'POST', headers, body: JSON.stringify({ action: 'markAllRead' }) })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function toggleExpand(memberId) {
    if (expandedMember === memberId) { setExpandedMember(null); return }
    setExpandedMember(memberId)
    if (!expandedTab[memberId]) setExpandedTab(p => ({ ...p, [memberId]: 'notes' }))
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#263746] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[#7A8FA3]">Loading member data…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
      <div className="bg-white rounded-xl border border-[#D8E4EC] p-10 text-center max-w-sm">
        <AlertCircle size={32} className="text-[#FF5E5B] mx-auto mb-3" />
        <p className="text-[#263746] font-semibold mb-1">Error loading dashboard</p>
        <p className="text-sm text-[#7A8FA3]">{error}</p>
        <button onClick={onLogout} className="mt-4 text-xs text-[#6D99F2] hover:underline cursor-pointer">Sign out and try again</button>
      </div>
    </div>
  )

  const coaches = [...new Set(members.map(m => m.coach).filter(Boolean))].sort()
  const filtered = members
    .filter(m =>
      (!coachFilter || m.coach === coachFilter) &&
      (!search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        (m.targetRole || '').toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sort === 'lastActive') return (daysSince(a.lastActive) ?? 999) - (daysSince(b.lastActive) ?? 999)
      if (sort === 'apps') return b.totalApps - a.totalApps
      if (sort === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  const activeThisWeek = members.filter(m => daysSince(m.lastActive) !== null && daysSince(m.lastActive) <= 7).length
  const atRisk = members.filter(m => daysSince(m.lastActive) === null || daysSince(m.lastActive) >= 14)
  const amber = members.filter(m => daysSince(m.lastActive) !== null && daysSince(m.lastActive) >= 7 && daysSince(m.lastActive) < 14)
  const totalApps = members.reduce((s, m) => s + m.totalApps, 0)
  const totalOffers = members.reduce((s, m) => s + m.offers, 0)
  const needsAttention = members
    .filter(m => { const d = daysSince(m.lastActive); return d === null || d >= 7 })
    .sort((a, b) => (daysSince(b.lastActive) ?? 999) - (daysSince(a.lastActive) ?? 999))

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-[#F8F5F2]">

      {/* Header */}
      <header className="bg-[#263746] sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={pyLogo} alt="Promotable You" className="h-7 w-auto" />
            <div>
              <p className="text-white font-bold text-sm leading-tight">CAP Coach Portal</p>
              <p className="text-white/50 text-xs">{currentCoach?.name || auth?.coach?.name || 'Coach'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-white/50 bg-white/10 px-3 py-1 rounded-full">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </span>

            {/* Invite member */}
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#D4AF37] text-[#263746] px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[#c9a430] transition-colors"
            >
              <UserPlus size={13} />
              <span className="hidden sm:inline">Invite Member</span>
            </button>

            {/* Notifications bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(v => !v)}
                className="relative text-white/70 hover:text-white cursor-pointer p-1.5"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#FF5E5B] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationsPanel
                  notifications={notifications}
                  onMarkRead={markNotifRead}
                  onMarkAllRead={markAllRead}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="text-white/50 hover:text-white cursor-pointer p-1.5"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Members', value: members.length, icon: Users, bg: 'bg-[#263746]', sub: 'Enrolled in CAP' },
            { label: 'Active This Week', value: activeThisWeek, icon: CheckCircle, bg: 'bg-emerald-600', sub: 'Engaged in last 7 days' },
            { label: 'Total Applications', value: totalApps, icon: Briefcase, bg: 'bg-[#6D99F2]', sub: 'Submitted across cohort' },
            { label: 'Needs Attention', value: needsAttention.length, icon: AlertCircle, bg: 'bg-[#FF5E5B]', sub: '7+ days since last activity' },
          ].map(({ label, value, icon: Icon, bg, sub }) => (
            <div key={label} className={`${bg} rounded-xl p-5 shadow-sm`}>
              <Icon size={20} className="text-white opacity-80 mb-3" />
              <div className="text-4xl font-bold text-white mb-1">{value}</div>
              <div className="text-xs font-bold text-white opacity-90 mb-0.5">{label}</div>
              <div className="text-xs text-white opacity-50">{sub}</div>
            </div>
          ))}
        </div>

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <div className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden shadow-sm">
            <SectionHeader title="⚠ Members Needing Attention" subtitle="7+ days since last engagement — consider reaching out" gold />
            <div className="divide-y divide-[#EEF3FA]">
              {needsAttention.map(m => {
                const days = daysSince(m.lastActive)
                const isRed = days === null || days >= 14
                return (
                  <div key={m.id} className={`px-5 py-4 flex items-center justify-between gap-4 ${isRed ? 'bg-red-50/40' : 'bg-amber-50/40'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isRed ? 'bg-red-100 text-[#FF5E5B]' : 'bg-amber-100 text-amber-700'}`}>
                        {m.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#263746] truncate">{m.name}</p>
                        <p className="text-xs text-[#7A8FA3] truncate">{m.targetRole || m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <RiskBadge days={days} />
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-[#7A8FA3]">Apps</p>
                        <p className="text-sm font-bold text-[#263746]">{m.totalApps}</p>
                      </div>
                      <a href={`https://pycaptracker.netlify.app?uid=${m.token}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[#6D99F2] hover:underline">
                        View <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[#D8E4EC] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-[#D4AF37]" />
              <span className="text-xs font-bold text-[#263746] uppercase tracking-wide">Offers Received</span>
            </div>
            <p className="text-3xl font-bold text-[#263746]">{totalOffers}</p>
            <p className="text-xs text-[#7A8FA3] mt-1">Across all members</p>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E4EC] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-amber-500" />
              <span className="text-xs font-bold text-[#263746] uppercase tracking-wide">Amber Zone</span>
            </div>
            <p className="text-3xl font-bold text-[#263746]">{amber.length}</p>
            <p className="text-xs text-[#7A8FA3] mt-1">7–13 days inactive</p>
          </div>
          <div className="bg-white rounded-xl border border-[#D8E4EC] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Award size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-[#263746] uppercase tracking-wide">Check-ins Done</span>
            </div>
            <p className="text-3xl font-bold text-[#263746]">{members.reduce((s, m) => s + m.checkinsSubmitted, 0)}</p>
            <p className="text-xs text-[#7A8FA3] mt-1">Weekly check-ins submitted</p>
          </div>
        </div>

        {/* Wins Board */}
        {(() => {
          const allWins = members
            .flatMap(m => (m.wins || []).map(w => ({ ...w, memberName: m.name, memberInitial: m.name.charAt(0) })))
            .filter(w => w.text)
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
            .slice(0, 30)

          if (allWins.length === 0) return null
          return (
            <div className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden shadow-sm">
              <SectionHeader title="🏆 Wins Board" subtitle="Recent wins logged by your clients — celebrate and share them!" gold />
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allWins.map(w => <WinCard key={`${w.memberName}-${w.id}`} win={w} />)}
                </div>
              </div>
            </div>
          )
        })()}

        {/* All Members */}
        <div className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden shadow-sm">
          <SectionHeader title="All Members" subtitle="Click a member to expand their profile and log sessions or action items" />

          {/* Search + Sort bar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#EEF3FA] flex-wrap bg-[#F8F5F2]">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8FA3]" />
              <input
                className="w-full bg-white border border-[#D8E4EC] rounded-lg pl-8 pr-3 py-2 text-sm text-[#263746] placeholder:text-[#7A8FA3] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                placeholder="Search by name, email or role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {coaches.length > 0 && (
              <select
                className="bg-white border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none cursor-pointer"
                value={coachFilter}
                onChange={e => setCoachFilter(e.target.value)}
              >
                <option value="">All coaches</option>
                {coaches.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <div className="flex gap-2">
              {[['lastActive', 'Last Active'], ['apps', 'Most Apps'], ['name', 'A–Z']].map(([val, label]) => (
                <button key={val} onClick={() => setSort(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${sort === val ? 'bg-[#263746] text-white' : 'bg-white border border-[#D8E4EC] text-[#4A5C6B] hover:bg-[#EEF3FA]'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Member Rows */}
          <div className="divide-y divide-[#EEF3FA]">
            {filtered.map(m => {
              const days = daysSince(m.lastActive)
              const risk = getRisk(days)
              const isExpanded = expandedMember === m.id
              const activeTab = expandedTab[m.id] || 'notes'
              const rowBg = risk === 'red' ? 'bg-red-50/20' : risk === 'amber' ? 'bg-amber-50/20' : ''

              return (
                <div key={m.id} className={rowBg}>
                  {/* Summary row */}
                  <div
                    className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-[#F5F9FD] transition-colors"
                    onClick={() => toggleExpand(m.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#EEF3FA] flex items-center justify-center text-sm font-bold text-[#263746] flex-shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#263746] truncate">{m.name}</p>
                      <p className="text-xs text-[#7A8FA3] truncate">
                        {m.targetRole || m.email}
                        {m.coachName && <span className="ml-2 text-[#D4AF37] font-medium">· {m.coachName}</span>}
                      </p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-center flex-shrink-0">
                      {[
                        { label: 'Apps', value: m.totalApps },
                        { label: 'Interviews', value: m.interviews },
                        { label: 'Offers', value: m.offers },
                        { label: 'Networking', value: m.networking },
                        { label: 'Check-ins', value: m.checkinsSubmitted },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-[#7A8FA3]">{label}</p>
                          <p className="text-sm font-bold text-[#263746]">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex-shrink-0"><RiskBadge days={days} /></div>
                    <div className="flex-shrink-0 text-[#7A8FA3]">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="bg-[#F8F5F2] border-t border-[#EEF3FA]">
                      {/* Quick links + tabs */}
                      <div className="px-5 pt-4 pb-0 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex gap-1">
                          {[['notes', StickyNote, 'Notes'], ['sessions', Calendar, 'Sessions'], ['actions', ListChecks, 'Actions']].map(([tab, Icon, label]) => (
                            <button
                              key={tab}
                              onClick={() => setExpandedTab(p => ({ ...p, [m.id]: tab }))}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${activeTab === tab ? 'bg-[#263746] text-white' : 'bg-white border border-[#D8E4EC] text-[#4A5C6B] hover:bg-[#EEF3FA]'}`}
                            >
                              <Icon size={12} />{label}
                            </button>
                          ))}
                        </div>
                        <a
                          href={`https://pycaptracker.netlify.app?uid=${m.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#263746] hover:bg-[#1a2733] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Open Full Tracker <ExternalLink size={11} />
                        </a>
                      </div>

                      <div className="p-5">
                        {/* Activity stats (always visible) */}
                        <div className="grid grid-cols-5 gap-2 mb-5">
                          {[
                            { label: 'Applications', value: m.totalApps, color: 'bg-[#EEF3FA] text-[#6D99F2]' },
                            { label: 'Interviews', value: m.interviews, color: 'bg-emerald-50 text-emerald-700' },
                            { label: 'Offers', value: m.offers, color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
                            { label: 'Networking', value: m.networking, color: 'bg-[#EEF3FA] text-[#4A5C6B]' },
                            { label: 'Check-ins', value: m.checkinsSubmitted, color: 'bg-emerald-50 text-emerald-700' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className={`${color} rounded-lg p-3 text-center`}>
                              <p className="text-lg font-bold">{value}</p>
                              <p className="text-xs opacity-80">{label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Tab content */}
                        {activeTab === 'notes' && (
                          <div>
                            <p className="text-xs font-bold text-[#263746] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <StickyNote size={13} className="text-[#D4AF37]" />Private Coach Notes
                            </p>
                            <textarea
                              className="w-full border border-[#D8E4EC] rounded-lg px-3 py-2.5 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 bg-white placeholder:text-[#7A8FA3] resize-none"
                              rows={5}
                              value={notesDraft[m.id] || ''}
                              onChange={e => updateNotes(m.id, e.target.value)}
                              placeholder="Add private notes about this member — not visible to them…"
                            />
                            <p className="text-xs text-[#7A8FA3] mt-1">Confidential · Saves automatically</p>
                          </div>
                        )}

                        {activeTab === 'sessions' && (
                          <SessionsPanel memberId={m.id} headers={headers} />
                        )}

                        {activeTab === 'actions' && (
                          <ActionsPanel memberId={m.id} headers={headers} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-sm text-[#7A8FA3] py-10">No members found</p>
          )}
        </div>

      </main>

      {/* Invite modal */}
      {showInvite && (
        <InviteMemberModal
          coaches={allCoaches}
          currentCoach={currentCoach || auth?.coach}
          headers={headers}
          onClose={() => setShowInvite(false)}
          onInvited={() => {}}
        />
      )}
    </div>
  )
}
