import { useData } from '../context/DataContext'
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'

const CHECKLIST_ITEMS = [
  { key: 'headline', label: 'Headline aligned with target role' },
  { key: 'about', label: 'About section includes hook' },
  { key: 'experience', label: 'Experience bullets are outcome-driven' },
  { key: 'skills', label: 'Skills match target role' },
  { key: 'recommendations', label: 'Recommendations requested' },
  { key: 'activity', label: 'Activity consistent' },
  { key: 'connections', label: 'Connections growing' },
  { key: 'endorsements', label: 'Endorsements up-to-date' },
  { key: 'photo', label: 'Profile photo professional' },
  { key: 'url', label: 'Custom URL optimised' },
]

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-2 py-1.5 text-xs text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"

function newOutreach() {
  return { id: Date.now(), person: '', company: '', role: '', dateConnected: '', message: '', response: '', followUp: '', notes: '' }
}

export default function LinkedIn() {
  const { data, updateNested, update } = useData()
  const checklist = data.linkedinChecklist || {}
  const outreach = data.linkedinOutreach || []

  const completed = CHECKLIST_ITEMS.filter(i => checklist[i.key]).length
  const pct = Math.round((completed / CHECKLIST_ITEMS.length) * 100)

  function toggleCheck(key) { updateNested('linkedinChecklist', key, !checklist[key]) }

  function setOutreach(next) { update('linkedinOutreach', next) }
  function addOutreach() { setOutreach([...outreach, newOutreach()]) }
  function removeOutreach(id) { setOutreach(outreach.filter(o => o.id !== id)) }
  function updOutreach(id, field, value) { setOutreach(outreach.map(o => o.id === id ? { ...o, [field]: value } : o)) }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">LinkedIn</h2>
        <p className="text-sm text-[#5A7080] italic font-['Playfair_Display']">Profile checklist and outreach log.</p>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-xl border border-[#D8E4EC] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#263746] font-['Inter']">Profile Checklist</h3>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-[#D8E4EC] rounded-full overflow-hidden">
              <div className="h-full bg-[#6D99F2] rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-[#7A8FA3]">{completed}/{CHECKLIST_ITEMS.length}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CHECKLIST_ITEMS.map(({ key, label }) => (
            <button key={key} onClick={() => toggleCheck(key)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F5F9FD] transition-colors cursor-pointer text-left">
              {checklist[key]
                ? <CheckCircle2 size={18} className="text-[#6D99F2] flex-shrink-0" />
                : <Circle size={18} className="text-[#D8E4EC] flex-shrink-0" />
              }
              <span className={`text-sm ${checklist[key] ? 'line-through text-[#7A8FA3]' : 'text-[#4A5C6B]'}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Outreach log */}
      <div className="bg-white rounded-xl border border-[#D8E4EC] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#263746] font-['Inter']">LinkedIn Outreach Log</h3>
          <button onClick={addOutreach} className="flex items-center gap-1.5 text-xs font-medium text-[#6D99F2] hover:text-[#263746] cursor-pointer transition-colors">
            <Plus size={14} /> Add outreach
          </button>
        </div>

        {outreach.length === 0 && (
          <p className="text-sm text-[#7A8FA3] italic text-center py-6">No outreach logged yet.</p>
        )}

        {outreach.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-[#D8E4EC]">
                <tr>
                  {['Person','Company','Their Role','Date Connected','Message sent','Response','Follow-up date','Notes',''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#4A5C6B] px-2 py-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {outreach.map(o => (
                  <tr key={o.id} className="border-b border-[#EEF3FA] last:border-0">
                    <td className="px-2 py-2"><input className={inputCls} value={o.person} onChange={e => updOutreach(o.id,'person',e.target.value)} placeholder="Name" /></td>
                    <td className="px-2 py-2"><input className={inputCls} value={o.company} onChange={e => updOutreach(o.id,'company',e.target.value)} placeholder="Company" /></td>
                    <td className="px-2 py-2"><input className={inputCls} value={o.role} onChange={e => updOutreach(o.id,'role',e.target.value)} placeholder="Role" /></td>
                    <td className="px-2 py-2"><input className={inputCls} type="date" value={o.dateConnected} onChange={e => updOutreach(o.id,'dateConnected',e.target.value)} /></td>
                    <td className="px-2 py-2"><input className={inputCls} value={o.message} onChange={e => updOutreach(o.id,'message',e.target.value)} placeholder="Message summary" /></td>
                    <td className="px-2 py-2"><input className={inputCls} value={o.response} onChange={e => updOutreach(o.id,'response',e.target.value)} placeholder="Response" /></td>
                    <td className="px-2 py-2"><input className={inputCls} type="date" value={o.followUp} onChange={e => updOutreach(o.id,'followUp',e.target.value)} /></td>
                    <td className="px-2 py-2"><input className={inputCls} value={o.notes} onChange={e => updOutreach(o.id,'notes',e.target.value)} placeholder="Notes" /></td>
                    <td className="px-2 py-2"><button onClick={() => removeOutreach(o.id)} className="text-[#FF5E5B] hover:text-red-700 cursor-pointer"><Trash2 size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
