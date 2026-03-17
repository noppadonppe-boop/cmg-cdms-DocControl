import { User, Building2, Bell, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SECTIONS = [
  { icon: User, label: 'Profile' },
  { icon: Building2, label: 'Project' },
  { icon: Bell, label: 'Notifications' },
  { icon: Shield, label: 'Permissions' },
]

export default function SettingsPage() {
  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and project preferences</p>
      </div>

      {/* Nav Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {SECTIONS.map(({ icon: Icon, label }, i) => (
          <button
            key={label}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              i === 0
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Profile Section */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Profile Information</CardTitle>
          <CardDescription>Update your display name and contact details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              U
            </div>
            <Button variant="outline" size="sm">Change Avatar</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Display Name</label>
              <Input defaultValue="User Name" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input defaultValue="user@company.com" className="h-9 text-sm" disabled />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Role</label>
              <Input defaultValue="Admin" className="h-9 text-sm" disabled />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button size="sm">Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Project Section */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Project Settings</CardTitle>
          <CardDescription>Configure transmittal numbering and document categories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Transmittal In Prefix</label>
              <Input defaultValue="TR-IN" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Transmittal Out Prefix</label>
              <Input defaultValue="TR-OUT" className="h-9 text-sm" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button size="sm">Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
