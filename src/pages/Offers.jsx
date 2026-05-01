import { useData } from '../context/DataContext'
import { Plus, Trash2 } from 'lucide-react'

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-2 py-1.5 text-xs text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"
const RESPONSE_OPTIONS = ['','Considering','Accepted','Declined','Negotiating','Withdrawn']

const DECISION_COLORS = {
  Accepted: 'bg-emerald-50 text-emerald-700',
  Declined: 'bg-red-50 text-[#FF5E5B]',
  Negotiating: 'bg-amber-50 text-amber-700',
  Considering: 'bg-[#EEF3FA] text-[#6D99F2]',
}

function newOffer() {
  return { id: Date.now(), role: '', company: '', offerDate: '', salary: '', benefits: '', startDate: '', response: '', negotiation: '', decision: '', acceptedSalary: '', notes: '' }
}

export default function Offers() {
  const { data, update } = useData()
  const offers = data.offers || []

  function set(next) { update('offers', next) }
  function add() { set([...offers, newOffer()]) }
  function remove(id) { set(offers.filter(o => o.id !== id)) }
  function upd(id, field, value) { set(offers.map(o => o.id === id ? { ...o, [field]: value } : o)) }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Offers</h2>
          <p className="text-sm text-[#5A7080] italic font-['Playfair_Display']">Log every offer. Salary, benefits, negotiation, decision.</p>
        </div>
        <button onClick={add} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
          <Plus size={16} /> Log offer
        </button>
      </div>

      {offers.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] p-12 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-[#7A8FA3] text-sm">No offers yet. They're coming.</p>
        </div>
      )}

      <div className="space-y-4">
        {offers.map(o => (
          <div key={o.id} className="bg-white rounded-xl border border-[#D8E4EC] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-[#263746]">{o.role || 'New offer'}{o.company ? ` at ${o.company}` : ''}</p>
                {o.decision && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${DECISION_COLORS[o.decision] || 'bg-[#F5F9FD] text-[#7A8FA3]'}`}>{o.decision}</span>
                )}
              </div>
              <button onClick={() => remove(o.id)} className="text-[#FF5E5B] hover:text-red-700 cursor-pointer"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Role</label><input className={inputCls} value={o.role} onChange={e => upd(o.id,'role',e.target.value)} placeholder="Job title" /></div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Company</label><input className={inputCls} value={o.company} onChange={e => upd(o.id,'company',e.target.value)} placeholder="Company" /></div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Offer Date</label><input className={inputCls} type="date" value={o.offerDate} onChange={e => upd(o.id,'offerDate',e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Salary Offered</label><input className={inputCls} value={o.salary} onChange={e => upd(o.id,'salary',e.target.value)} placeholder="e.g. $95,000" /></div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Final Accepted Salary</label><input className={inputCls} value={o.acceptedSalary} onChange={e => upd(o.id,'acceptedSalary',e.target.value)} placeholder="e.g. $100,000" /></div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Proposed Start Date</label><input className={inputCls} type="date" value={o.startDate} onChange={e => upd(o.id,'startDate',e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Your Response</label>
                <select className={inputCls} value={o.response} onChange={e => upd(o.id,'response',e.target.value)}>
                  {RESPONSE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Final Decision</label>
                <select className={inputCls} value={o.decision} onChange={e => upd(o.id,'decision',e.target.value)}>
                  {RESPONSE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Benefits Summary</label><input className={inputCls} value={o.benefits} onChange={e => upd(o.id,'benefits',e.target.value)} placeholder="Key benefits" /></div>
              <div className="col-span-2 lg:col-span-3"><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Negotiation Points</label><textarea className={inputCls} rows={2} value={o.negotiation} onChange={e => upd(o.id,'negotiation',e.target.value)} placeholder="What you negotiated" /></div>
              <div className="col-span-2 lg:col-span-3"><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Notes</label><textarea className={inputCls} rows={2} value={o.notes} onChange={e => upd(o.id,'notes',e.target.value)} placeholder="Anything else" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
