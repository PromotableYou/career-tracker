import { useData } from '../context/DataContext'
import { Plus, Trash2 } from 'lucide-react'
import FileUpload from '../components/FileUpload'

function newVersion() {
  return { id: Date.now(), roleName: '', file: null, notes: '' }
}

const inputCls = "w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2]/40 bg-white placeholder:text-[#7A8FA3]"

export default function Resumes() {
  const { data, updateNested, update } = useData()
  const masterResume = data.profile?.resumeFile || null
  const masterLink = data.profile?.resumeLink || ''
  const versions = data.resumeVersions || []

  function setMasterFile(file) { updateNested('profile', 'resumeFile', file) }
  function setMasterLink(val) { updateNested('profile', 'resumeLink', val) }

  function setVersions(next) { update('resumeVersions', next) }
  function addVersion() { setVersions([...versions, newVersion()]) }
  function removeVersion(id) { setVersions(versions.filter(v => v.id !== id)) }
  function updVersion(id, field, value) { setVersions(versions.map(v => v.id === id ? { ...v, [field]: value } : v)) }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#263746] mb-1 font-['Inter']">Resumes</h2>
        <p className="text-sm text-[#5A7080] italic font-['Playfair_Display']">Your master resume, tailored with genius, ready for every role.</p>
      </div>

      {/* Master resume */}
      <div className="bg-white rounded-xl border border-[#D8E4EC] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[#263746] font-['Inter']">Master Resume</h3>
            <p className="text-xs text-[#7A8FA3] mt-0.5">Your base resume. Use Resume Genius to tailor it for specific roles.</p>
          </div>
          <a
            href="https://chatgpt.com/g/g-68077c2103e4819185cbb67866443ba4-resume-genius-tooltm-by-promotable-you"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-[#263746] hover:bg-[#1a2832] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors no-underline flex-shrink-0"
          >
            Open Resume Genius
          </a>
        </div>

        <FileUpload
          value={masterResume}
          onChange={setMasterFile}
        />
        <div className="flex items-center gap-2 mt-3">
          <div className="h-px flex-1 bg-[#D8E4EC]" />
          <span className="text-xs text-[#7A8FA3]">or paste a link</span>
          <div className="h-px flex-1 bg-[#D8E4EC]" />
        </div>
        <input
          className={`${inputCls} mt-3`}
          type="url"
          value={masterLink}
          onChange={e => setMasterLink(e.target.value)}
          placeholder="Google Drive / Dropbox link"
        />
      </div>

      {/* Tailored versions */}
      <div className="bg-white rounded-xl border border-[#D8E4EC] p-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="font-semibold text-[#263746] font-['Inter']">Tailored Versions</h3>
            <p className="text-xs text-[#7A8FA3] mt-0.5">Save a tailored version for each role type you're targeting.</p>
          </div>
          <button
            onClick={addVersion}
            className="flex items-center gap-2 bg-[#EEF3FA] hover:bg-[#D0DFF8] text-[#263746] text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer border border-[#D8E4EC]"
          >
            <Plus size={15} /> Add version
          </button>
        </div>

        {versions.length === 0 && (
          <div className="text-center py-10 text-[#7A8FA3] text-sm">
            <p className="mb-1">No tailored versions yet.</p>
            <p>Use Resume Genius to tailor your master resume, then save each version here.</p>
          </div>
        )}

        <div className="space-y-4 mt-4">
          {versions.map(v => (
            <div key={v.id} className="border border-[#D8E4EC] rounded-xl p-4 bg-[#F8F5F2]">
              <div className="flex items-center justify-between mb-3">
                <input
                  className={`${inputCls} text-sm font-semibold bg-white`}
                  value={v.roleName}
                  onChange={e => updVersion(v.id, 'roleName', e.target.value)}
                  placeholder="Role name — e.g. Senior Product Manager"
                />
                <button onClick={() => removeVersion(v.id)} className="text-[#FF5E5B] hover:text-red-700 cursor-pointer ml-3 flex-shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
              <FileUpload
                value={v.file}
                onChange={file => updVersion(v.id, 'file', file)}
              />
              <input
                className={`${inputCls} mt-2 text-xs`}
                value={v.notes}
                onChange={e => updVersion(v.id, 'notes', e.target.value)}
                placeholder="Notes — e.g. Emphasised stakeholder management, removed agency experience"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
