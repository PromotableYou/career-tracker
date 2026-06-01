import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Plus, Trash2, ChevronDown, ChevronUp, BookOpen, Calendar, Laptop, Award, ExternalLink } from 'lucide-react'

const TYPE_OPTIONS = [
  'Event / Conference',
  'Online Workshop / Webinar',
  'Book / Podcast / Course',
  'Association / Membership',
]

const TYPE_ICONS = {
  'Event / Conference':       { Icon: Calendar,  color: 'text-[#6D99F2]',    bg: 'bg-[#EEF3FA]' },
  'Online Workshop / Webinar':{ Icon: Laptop,    color: 'text-emerald-600',  bg: 'bg-emerald-50' },
  'Book / Podcast / Course':  { Icon: BookOpen,  color: 'text-[#D4AF37]',    bg: 'bg-yellow-50' },
  'Association / Membership': { Icon: Award,     color: 'text-purple-600',   bg: 'bg-purple-50' },
}

const STATUS_OPTIONS = ['Planned', 'Attending', 'Completed', 'Cancelled']

const STATUS_BADGE = {
  Planned:   'bg-blue-100 text-blue-700',
  Attending: 'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-gray-100 text-gray-500',
}

const FILTER_TABS = [
  { label: 'All',              match: null },
  { label: 'Events',           match: 'Event / Conference' },
  { label: 'Webinars',         match: 'Online Workshop / Webinar' },
  { label: 'Books & Learning', match: 'Book / Podcast / Course' },
  { label: 'Associations',     match: 'Association / Membership' },
]

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"
const labelCls = "block text-xs font-semibold text-[#4A5C6B] mb-1"

function newEntry() {
  return {
    id: Date.now(),
    type: 'Event / Conference',
    name: '',
    organiser: '',
    date: '',
    completedDate: '',
    location: '',
    link: '',
    notes: '',
    keyTakeaways: '',
    status: 'Planned',
  }
}

export default function Events() {
  const { data, update } = useData()
  const entries = data.events || []
  const [expanded, setExpanded] = useState(null)
  const [typeFilter, setTypeFilter] = useState(null)

  function set(next) { update('events', next) }

  function add() {
    const e = newEntry()
    set([...entries, e])
    setExpanded(e.id)
  }

  function remove(id) { set(entries.filter(e => e.id !== id)) }

  function upd(id, field, value) {
    set(entries.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  function toggle(id) { setExpanded(expanded === id ? null : id) }

  const filtered = typeFilter
    ? entries.filter(e => e.type === typeFilter)
    : entries

  return (
    <div className="max-w-4xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Professional Development</h2>
          <p className="text-sm text-[#7A8FA3]">
            Track your learning, events, associations and growth outside of job applications.
          </p>
        </div>
        <button
          onClick={add}
          className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors"
        >
          <Plus size={16} /> Add activity
        </button>
      </div>

      {/* Type filter tabs */}
      {entries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.label}
              onClick={() => setTypeFilter(tab.match)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                typeFilter === tab.match
                  ? 'bg-[#263746] text-white'
                  : 'bg-white border border-[#D8E4EC] text-[#4A5C6B] hover:bg-[#EEF3FA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="text-xs text-[#7A8FA3] ml-1">
            {filtered.length} {filtered.length === 1 ? 'activity' : 'activities'}
          </span>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] p-10 text-center">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-[#263746] font-semibold text-base mb-2">Track your professional growth</p>
          <p className="text-[#7A8FA3] text-sm max-w-md mx-auto leading-relaxed mb-5">Log events, webinars, courses, books, and memberships. It shows interviewers you're invested in your development — and helps you remember what you've learned.</p>
          <button onClick={add} className="inline-flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-colors">
            <Plus size={16} /> Add your first activity
          </button>
        </div>
      )}

      {/* Entry list */}
      <div className="space-y-3">
        {filtered.map(entry => {
          const typeInfo = TYPE_ICONS[entry.type] || TYPE_ICONS['Event / Conference']
          const { Icon, color, bg } = typeInfo
          const isExpanded = expanded === entry.id
          const displayDate = entry.completedDate || entry.date

          return (
            <div key={entry.id} className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden">
              {/* Collapsed header */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#F5F9FD] transition-colors"
                onClick={() => toggle(entry.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Type icon */}
                  <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={17} className={color} />
                  </div>

                  {/* Name + organiser */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#263746] truncate">
                      {entry.name || 'New activity'}
                    </p>
                    <p className="text-xs text-[#7A8FA3] truncate">
                      {entry.organiser || entry.type}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_BADGE[entry.status] || STATUS_BADGE['Planned']}`}>
                    {entry.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  {/* Date */}
                  {displayDate && (
                    <span className="hidden md:block text-xs text-[#7A8FA3]">
                      {new Date(displayDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}

                  {/* Delete */}
                  <button
                    onClick={e => { e.stopPropagation(); remove(entry.id) }}
                    className="text-[#D8E4EC] hover:text-[#FF5E5B] transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>

                  {/* Chevron */}
                  {isExpanded
                    ? <ChevronUp size={16} className="text-[#7A8FA3]" />
                    : <ChevronDown size={16} className="text-[#7A8FA3]" />
                  }
                </div>
              </div>

              {/* Expanded form */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-[#EEF3FA]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {/* Name */}
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Name</label>
                      <input
                        className={inputCls}
                        value={entry.name}
                        onChange={e => upd(entry.id, 'name', e.target.value)}
                        placeholder="Event, book, course or membership name"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className={labelCls}>Status</label>
                      <select
                        className={inputCls}
                        value={entry.status}
                        onChange={e => upd(entry.id, 'status', e.target.value)}
                      >
                        {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Type */}
                    <div>
                      <label className={labelCls}>Type</label>
                      <select
                        className={inputCls}
                        value={entry.type}
                        onChange={e => upd(entry.id, 'type', e.target.value)}
                      >
                        {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Organiser */}
                    <div>
                      <label className={labelCls}>Organiser / Provider</label>
                      <input
                        className={inputCls}
                        value={entry.organiser}
                        onChange={e => upd(entry.id, 'organiser', e.target.value)}
                        placeholder="Who runs it?"
                      />
                    </div>

                    {/* Date */}
                    <div>
                      <label className={labelCls}>Date / Start Date</label>
                      <input
                        className={inputCls}
                        type="date"
                        value={entry.date}
                        onChange={e => upd(entry.id, 'date', e.target.value)}
                      />
                    </div>

                    {/* Completed date */}
                    <div>
                      <label className={labelCls}>Completed Date</label>
                      <input
                        className={inputCls}
                        type="date"
                        value={entry.completedDate}
                        onChange={e => upd(entry.id, 'completedDate', e.target.value)}
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className={labelCls}>Location</label>
                      <input
                        className={inputCls}
                        value={entry.location}
                        onChange={e => upd(entry.id, 'location', e.target.value)}
                        placeholder="In-person location or Online"
                      />
                    </div>

                    {/* Link */}
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Link</label>
                      <div className="relative">
                        <input
                          className={inputCls + (entry.link ? ' pr-9' : '')}
                          type="url"
                          value={entry.link}
                          onChange={e => upd(entry.id, 'link', e.target.value)}
                          placeholder="https://"
                        />
                        {entry.link && (
                          <a
                            href={entry.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6D99F2] hover:text-[#263746] transition-colors"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Key Takeaways - full width */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className={labelCls}>Key Takeaways</label>
                      <textarea
                        className={inputCls + ' resize-none'}
                        rows={3}
                        value={entry.keyTakeaways}
                        onChange={e => upd(entry.id, 'keyTakeaways', e.target.value)}
                        placeholder="What did you learn or gain from this?"
                      />
                    </div>

                    {/* Notes - full width */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className={labelCls}>Notes</label>
                      <textarea
                        className={inputCls + ' resize-none'}
                        rows={2}
                        value={entry.notes}
                        onChange={e => upd(entry.id, 'notes', e.target.value)}
                        placeholder="Any other notes..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer count + quick add */}
      {entries.length > 0 && (
        <div className="mt-4 flex justify-between items-center text-xs text-[#7A8FA3]">
          <span>
            {filtered.length} of {entries.length} {entries.length === 1 ? 'activity' : 'activities'}
          </span>
          <button onClick={add} className="text-[#6D99F2] hover:underline cursor-pointer">
            + Add activity
          </button>
        </div>
      )}
    </div>
  )
}
