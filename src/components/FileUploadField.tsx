import { useRef, useState } from 'react'
import { Paperclip, UploadCloud, X, Loader2, ExternalLink } from 'lucide-react'

interface UploadingFile {
  name: string
  progress: number  // 0–100
  error?: string
}

interface Props {
  /** Array of download URLs already uploaded */
  value: string[]
  onChange: (urls: string[]) => void
  /** Called at upload time per file to get the base storage path */
  generatePath: () => string
  disabled?: boolean
  accept?: string
}

export default function FileUploadField({
  value,
  onChange,
  generatePath,
  disabled = false,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg,.zip',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<Record<string, UploadingFile>>({})
  const [dragOver, setDragOver] = useState(false)

  const isAnyUploading = Object.values(uploading).some((f) => f.progress < 100 && !f.error)

  async function uploadFiles(files: FileList | File[]) {
    const fileArr = Array.from(files)
    if (!fileArr.length) return

    const [{ ref, uploadBytesResumable, getDownloadURL }, { storage }] = await Promise.all([
      import('firebase/storage'),
      import('@/services/firebase'),
    ])

    const basePath = generatePath()

    await Promise.all(
      fileArr.map(async (file) => {
        const id = `${file.name}_${Date.now()}`
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const fileRef = ref(storage, `${basePath}/${safeName}`)

        setUploading((prev) => ({ ...prev, [id]: { name: file.name, progress: 0 } }))

        try {
          const task = uploadBytesResumable(fileRef, file)
          await new Promise<void>((resolve, reject) => {
            task.on(
              'state_changed',
              (snap) => {
                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
                setUploading((prev) => ({
                  ...prev,
                  [id]: { name: file.name, progress: pct },
                }))
              },
              (err) => {
                setUploading((prev) => ({
                  ...prev,
                  [id]: { name: file.name, progress: 0, error: 'อัปโหลดไม่สำเร็จ' },
                }))
                reject(err)
              },
              resolve
            )
          })
          const url = await getDownloadURL(fileRef)
          onChange([...value, url])
          // Remove from uploading state after short delay so user sees 100%
          setTimeout(() => {
            setUploading((prev) => {
              const next = { ...prev }
              delete next[id]
              return next
            })
          }, 800)
        } catch {
          // error already set in onError above
        }
      })
    )
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) uploadFiles(e.target.files)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (!disabled && !isAnyUploading && e.dataTransfer.files.length)
      uploadFiles(e.dataTransfer.files)
  }

  function removeFile(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function getFileName(url: string) {
    try {
      const decoded = decodeURIComponent(url)
      const match = decoded.match(/\/o\/(.+?)(?:\?|$)/)
      if (match) {
        const parts = match[1].split('/')
        return parts[parts.length - 1]
      }
      return decoded.split('?')[0].split('/').pop() ?? 'File'
    } catch {
      return 'File'
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
        <Paperclip size={14} className="text-gray-400" />
        Attachments
        <span className="text-gray-400 font-normal text-xs">(optional · multiple files)</span>
      </label>

      {/* ── Uploaded files list ── */}
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((url, i) => (
            <li key={url} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-200 bg-green-50">
              <ExternalLink size={13} className="text-green-600 shrink-0" />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-700 font-medium underline underline-offset-2 truncate flex-1 hover:text-green-800"
              >
                {getFileName(url)}
              </a>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="p-0.5 rounded text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  title="Remove"
                >
                  <X size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ── In-progress uploads ── */}
      {Object.values(uploading).map((f) => (
        <div key={f.name} className="px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 space-y-1">
          <div className="flex items-center gap-2">
            {f.error ? (
              <X size={13} className="text-red-500 shrink-0" />
            ) : (
              <Loader2 size={13} className="text-blue-500 animate-spin shrink-0" />
            )}
            <span className="text-xs text-blue-700 truncate flex-1">{f.name}</span>
            <span className="text-xs text-blue-500 shrink-0">{f.error ?? `${f.progress}%`}</span>
          </div>
          {!f.error && (
            <div className="h-1 rounded-full bg-blue-100 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${f.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}

      {/* ── Drop zone ── */}
      <div
        onClick={() => !disabled && !isAnyUploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled && !isAnyUploading) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-lg border-2 border-dashed transition-colors cursor-pointer
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50'}
          ${disabled || isAnyUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <UploadCloud size={18} className="text-gray-400" />
        <span className="text-xs text-gray-500">
          <span className="text-blue-600 font-medium">Click to upload</span> or drag & drop
        </span>
        <span className="text-xs text-gray-400">PDF, Word, Excel, Image, DWG · Multiple files allowed</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isAnyUploading}
      />
    </div>
  )
}
