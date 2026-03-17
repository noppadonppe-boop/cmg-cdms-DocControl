import { AlertTriangle, Lock } from 'lucide-react'

interface Props {
  lockedByName: string | null
  isLockedByMe?: boolean
}

export default function EditLockBanner({ lockedByName, isLockedByMe }: Props) {
  if (isLockedByMe) return null
  if (!lockedByName) return null

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-orange-50 border border-orange-200 text-sm text-orange-700 mb-4">
      <Lock size={15} className="shrink-0 text-orange-500" />
      <span>
        <span className="font-semibold">{lockedByName}</span> กำลังแก้ไขอยู่ — การบันทึกของคุณจะถูกบล็อกจนกว่าอีกฝ่ายจะเสร็จ
      </span>
      <AlertTriangle size={15} className="shrink-0 ml-auto text-orange-400" />
    </div>
  )
}
