import { Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NoProjectSelected() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
        <Building2 size={28} className="text-blue-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-800">No Project Selected</h2>
      <p className="text-sm text-gray-500 mt-2 max-w-xs">
        Select an active project from the top navigation bar, or create a new one to get started.
      </p>
      <Button
        variant="outline"
        className="mt-5"
        onClick={() => navigate('/projects')}
      >
        Go to Project Management
      </Button>
    </div>
  )
}
