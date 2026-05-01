import { useData } from '../context/DataContext'
import { Plus, Trash2 } from 'lucide-react'

const TYPE_OPTIONS = ['','Peer','Mentor','Recruiter','Hiring Manager','Alumni','Former colleague','Industry contact','Other']
const DEPTH_OPTIONS = ['','Weak tie','Acquaintance','Established','Strong']
const NETWORK_AREAS = ['','Target company','Target industry','Target role','General career','Alumni network','Other']

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-2 py-1.5 text-xs text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"

function newContact() {
  return { id: Date.now(), person: '', role: '', contact: '', goal: '', area: '', type: '', depth: '', leverage: '', strategy: '', lastContact: '' }
}

export default function Networking() {
  const { data, update } = useData()
  const contacts = data.networking || []

  function set(next) { update('networking', next) }
  function add() { set([...contacts, newContact()]) }
  function remove(id) { set(contacts.filter(c => c.id !== id)) }
  function upd(id, field, value) { set(contacts.map(c => c.id === id ? { ...c, [field]: value } : c)) }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Networking</h2>
          <p className="text-sm text-[#5A7080] italic font-['Playfair_Display']">Your network map. Who you know, how you know them, relationship depth.</p>
        </div>
        <button onClick={add} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
          <Plus size={16} /> Add contact
        </button>
      </div>

      {contacts.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] p-12 text-center">
          <div className="text-4xl mb-3">🤝</div>
          <p className="text-[#7A8FA3] text-sm">No contacts yet. Start building your network map.</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#D8E4EC] overflow-hidden">
        {contacts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F8F5F2] border-b border-[#D8E4EC]">
                <tr>
                  {['Person','Their Role','Contact Details','Goal','Network Area','Type','Relationship','Leverage Area','Strategy','Last Contact',''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#4A5C6B] px-3 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id} className="border-b border-[#EEF3FA] last:border-0 hover:bg-[#F5F9FD]">
                    <td className="px-3 py-2"><input className={inputCls} value={c.person} onChange={e => upd(c.id,'person',e.target.value)} placeholder="Name" /></td>
                    <td className="px-3 py-2"><input className={inputCls} value={c.role} onChange={e => upd(c.id,'role',e.target.value)} placeholder="Their role" /></td>
                    <td className="px-3 py-2"><input className={inputCls} value={c.contact} onChange={e => upd(c.id,'contact',e.target.value)} placeholder="LinkedIn / email" /></td>
                    <td className="px-3 py-2">
                      <select className={inputCls} value={c.goal} onChange={e => upd(c.id,'goal',e.target.value)}>
                        {['','Current role','Career goal'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select className={inputCls} value={c.area} onChange={e => upd(c.id,'area',e.target.value)}>
                        {NETWORK_AREAS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select className={inputCls} value={c.type} onChange={e => upd(c.id,'type',e.target.value)}>
                        {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select className={inputCls} value={c.depth} onChange={e => upd(c.id,'depth',e.target.value)}>
                        {DEPTH_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2"><input className={inputCls} value={c.leverage} onChange={e => upd(c.id,'leverage',e.target.value)} placeholder="How they can help" /></td>
                    <td className="px-3 py-2"><input className={inputCls} value={c.strategy} onChange={e => upd(c.id,'strategy',e.target.value)} placeholder="Next step" /></td>
                    <td className="px-3 py-2"><input className={inputCls} type="date" value={c.lastContact} onChange={e => upd(c.id,'lastContact',e.target.value)} /></td>
                    <td className="px-3 py-2"><button onClick={() => remove(c.id)} className="text-[#FF5E5B] hover:text-red-700 cursor-pointer"><Trash2 size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {contacts.length > 0 && (
        <div className="mt-4 flex justify-between items-center text-xs text-[#7A8FA3]">
          <span>{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
          <button onClick={add} className="text-[#6D99F2] hover:underline cursor-pointer">+ Add contact</button>
        </div>
      )}
    </div>
  )
}
