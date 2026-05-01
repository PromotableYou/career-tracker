import { useData } from '../context/DataContext'
import { Plus, Trash2 } from 'lucide-react'

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-2 py-1.5 text-xs text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"

function newRow() {
  return { id: Date.now(), role: '', company: '', advertised: '', highest: '', lowest: '', nonFinancial: '', notes: '', decision: '' }
}

export default function Salary() {
  const { data, update } = useData()
  const rows = data.salary || []

  function set(next) { update('salary', next) }
  function add() { set([...rows, newRow()]) }
  function remove(id) { set(rows.filter(r => r.id !== id)) }
  function upd(id, field, value) { set(rows.map(r => r.id === id ? { ...r, [field]: value } : r)) }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Salary</h2>
          <p className="text-sm text-[#5A7080] italic font-['Playfair_Display']">Know your worth. If they can't meet your highest value, consider non-financial ways to increase the role's value.</p>
        </div>
        <button onClick={add} className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors">
          <Plus size={16} /> Add role
        </button>
      </div>

      {rows.length === 0 && (
        <div className="bg-white rounded-xl border border-[#D8E4EC] p-12 text-center">
          <div className="text-4xl mb-3">💰</div>
          <p className="text-[#7A8FA3] text-sm">No salary data yet. Add a role to get started.</p>
        </div>
      )}

      <div className="space-y-4">
        {rows.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-[#D8E4EC] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-[#263746]">{r.role || 'New role'}{r.company ? ` at ${r.company}` : ''}</p>
              <button onClick={() => remove(r.id)} className="text-[#FF5E5B] hover:text-red-700 cursor-pointer"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Role</label><input className={inputCls} value={r.role} onChange={e => upd(r.id,'role',e.target.value)} placeholder="Job title" /></div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Company</label><input className={inputCls} value={r.company} onChange={e => upd(r.id,'company',e.target.value)} placeholder="Company" /></div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Advertised Salary</label><input className={inputCls} value={r.advertised} onChange={e => upd(r.id,'advertised',e.target.value)} placeholder="e.g. $90,000" /></div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Your Highest $ Value</label><input className={inputCls} value={r.highest} onChange={e => upd(r.id,'highest',e.target.value)} placeholder="e.g. $110,000" /></div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Your Lowest $ Value</label><input className={inputCls} value={r.lowest} onChange={e => upd(r.id,'lowest',e.target.value)} placeholder="e.g. $85,000" /></div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Non-Financial Value</label><input className={inputCls} value={r.nonFinancial} onChange={e => upd(r.id,'nonFinancial',e.target.value)} placeholder="e.g. Flexible WFH, extra leave" /></div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Decision</label><input className={inputCls} value={r.decision} onChange={e => upd(r.id,'decision',e.target.value)} placeholder="Accept / Negotiate / Decline" /></div>
              <div><label className="block text-xs font-medium text-[#4A5C6B] mb-1">Negotiation Notes</label><input className={inputCls} value={r.notes} onChange={e => upd(r.id,'notes',e.target.value)} placeholder="Notes" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
