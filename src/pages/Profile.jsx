import { useData } from '../context/DataContext'

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#263746] mb-1">{label}</label>
      {hint && <p className="text-xs text-[#7A8FA3] mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"

export default function Profile() {
  const { data, updateNested } = useData()
  const { profile } = data

  function set(field, value) { updateNested('profile', field, value) }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Profile & Targets</h2>
        <p className="text-sm text-[#5A7080] italic font-['Playfair_Display']">Set your foundations. Everything else pulls from here.</p>
      </div>

      <div className="bg-white rounded-xl border border-[#D8E4EC] p-6 mb-6">
        <h3 className="font-semibold text-[#263746] mb-4 font-['Inter']">Your Details</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name"><input className={inputCls} value={profile.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Shaniah" /></Field>
            <Field label="Email"><input className={inputCls} type="email" value={profile.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Coach Name"><input className={inputCls} value={profile.coach} onChange={e => set('coach', e.target.value)} placeholder="Your career coach" /></Field>
            <Field label="Program Start Date"><input className={inputCls} type="date" value={profile.startDate} onChange={e => set('startDate', e.target.value)} /></Field>
          </div>
          <Field label="Target Role / Industry"><input className={inputCls} value={profile.targetRole} onChange={e => set('targetRole', e.target.value)} placeholder="e.g. Senior PM" /></Field>
          <Field label="LinkedIn URL"><input className={inputCls} type="url" value={profile.linkedinUrl} onChange={e => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/you" /></Field>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#D8E4EC] p-6 mb-6">
        <h3 className="font-semibold text-[#263746] mb-1 font-['Inter']">Weekly Targets</h3>
        <p className="text-sm text-[#7A8FA3] mb-4">Default is 5 applications and 3 networking actions per week.</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Weekly Application Target"><input className={inputCls} type="number" min="1" value={profile.weeklyAppTarget} onChange={e => set('weeklyAppTarget', +e.target.value)} /></Field>
          <Field label="Weekly Networking Target"><input className={inputCls} type="number" min="1" value={profile.weeklyNetworkTarget} onChange={e => set('weeklyNetworkTarget', +e.target.value)} /></Field>
        </div>
      </div>

    </div>
  )
}
