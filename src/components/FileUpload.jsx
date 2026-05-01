import { useRef } from 'react'
import { Upload, FileText, X, ExternalLink } from 'lucide-react'

const MAX_BYTES = 3 * 1024 * 1024 // 3MB

export default function FileUpload({ label, value, onChange, accept = '.pdf,.doc,.docx' }) {
  const inputRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_BYTES) {
      alert(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please keep resumes under 3MB.`)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      onChange({
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result, // base64 data URL
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function openFile() {
    if (!value?.data) return
    const win = window.open()
    win.document.write(`<iframe src="${value.data}" style="width:100%;height:100%;border:none"></iframe>`)
  }

  function clear(e) {
    e.stopPropagation()
    onChange(null)
  }

  const sizeKB = value?.size ? (value.size / 1024).toFixed(0) : null

  return (
    <div>
      {label && <label className="block text-xs font-medium text-[#4A5C6B] mb-1">{label}</label>}

      {value?.name ? (
        // File uploaded state
        <div className="flex items-center gap-2 p-2.5 bg-[#EEF3FA] border border-[#6D99F2]/30 rounded-lg">
          <FileText size={16} className="text-[#6D99F2] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#263746] truncate">{value.name}</p>
            {sizeKB && <p className="text-[10px] text-[#7A8FA3]">{sizeKB}KB</p>}
          </div>
          <button onClick={openFile} title="View file" className="text-[#6D99F2] hover:text-[#263746] cursor-pointer flex-shrink-0">
            <ExternalLink size={14} />
          </button>
          <button onClick={clear} title="Remove" className="text-[#7A8FA3] hover:text-[#FF5E5B] cursor-pointer flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      ) : (
        // Upload prompt state
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center gap-2 p-2.5 border border-dashed border-[#D8E4EC] rounded-lg hover:border-[#6D99F2] hover:bg-[#F5F9FD] transition-colors cursor-pointer text-left group"
        >
          <Upload size={15} className="text-[#7A8FA3] group-hover:text-[#6D99F2] flex-shrink-0" />
          <span className="text-xs text-[#7A8FA3] group-hover:text-[#4A5C6B]">Upload file (PDF, Word · max 3MB)</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
