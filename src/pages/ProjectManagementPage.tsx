import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { useProject } from '@/contexts/ProjectContext'
import { useEditLock } from '@/hooks/useEditLock'
import EditLockBanner from '@/components/EditLockBanner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  FolderOpen,
  Plus,
  Users,
  Calendar,
  CheckCircle2,
  Loader2,
  Building2,
} from 'lucide-react'

const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

const LOCK_PATH = 'CMG-cdms-DocControl/root/projects'

export default function ProjectManagementPage() {
  const { currentUser } = useAuth()
  const { availableProjects, selectedProject, changeSelectedProject, loadingProjects } = useProject()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { acquireLock, releaseLock, isLockedByOther, isLockedByMe, lockedByName } = useEditLock(LOCK_PATH)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
  })

  async function onSubmit(values: ProjectFormValues) {
    if (!currentUser) return
    setIsSubmitting(true)
    setSuccessMessage(null)

    try {
      // Check lock before saving
      if (isLockedByOther) {
        alert(`ไม่สามารถบันทึกได้ — ${lockedByName} กำลังแก้ไขอยู่`)
        return
      }
      const locked = await acquireLock()
      if (!locked) {
        alert(`ไม่สามารถล็อกได้ — มีผู้ใช้อื่นกำลังบันทึกอยู่`)
        return
      }

      const [{ collection, addDoc, serverTimestamp }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('@/services/firebase'),
      ])
      await addDoc(collection(db, 'CMG-cdms-DocControl', 'root', 'projects'), {
        name: values.name,
        description: values.description ?? '',
        memberIds: [currentUser.uid],
        roles: { [currentUser.uid]: 'Admin' },
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
      })
      reset()
      setSuccessMessage(`Project "${values.name}" created successfully!`)
    } catch (err) {
      console.error('Failed to create project:', err)
    } finally {
      setIsSubmitting(false)
      await releaseLock()
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create new projects and manage your project memberships.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Create Project Form ── */}
        <div className="lg:col-span-1">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus size={16} className="text-blue-600" />
                Create New Project
              </CardTitle>
              <CardDescription>
                You will be added as Admin automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditLockBanner lockedByName={lockedByName} isLockedByMe={isLockedByMe} />
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Project Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('name')}
                    placeholder="e.g. CMG Tower – Phase 1"
                    className="h-9 text-sm"
                    disabled={isSubmitting}
                    onFocus={() => { if (!isLockedByOther) acquireLock() }}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <Textarea
                    {...register('description')}
                    placeholder="Brief description of this project…"
                    className="text-sm resize-none"
                    rows={3}
                    disabled={isSubmitting}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description.message}</p>
                  )}
                </div>

                {/* Success message */}
                {successMessage && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 border border-green-200">
                    <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                    <p className="text-xs text-green-700">{successMessage}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !currentUser}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="mr-2 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <Plus size={15} className="mr-2" />
                      Create Project
                    </>
                  )}
                </Button>

                {!currentUser && (
                  <p className="text-xs text-center text-gray-400">
                    Sign in to create projects.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ── Project List ── */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen size={16} className="text-blue-600" />
                  My Projects
                </CardTitle>
                {!loadingProjects && (
                  <span className="text-xs text-gray-400 font-medium">
                    {availableProjects.length} project{availableProjects.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <CardDescription>
                Projects where you are a member. Click a project to make it active.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProjects ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Loading projects…
                </div>
              ) : availableProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Building2 size={22} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">No projects yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create your first project using the form on the left.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableProjects.map((project) => {
                    const isActive = selectedProject?.projectId === project.projectId
                    const userRole = currentUser
                      ? project.roles?.[currentUser.uid] ?? 'Member'
                      : 'Member'
                    const memberCount = project.memberIds?.length ?? 1

                    return (
                      <button
                        key={project.projectId}
                        onClick={() => changeSelectedProject(project.projectId)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          isActive
                            ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200'
                            : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                              isActive ? 'bg-blue-600' : 'bg-gray-100'
                            }`}>
                              <Building2
                                size={16}
                                className={isActive ? 'text-white' : 'text-gray-500'}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold truncate ${
                                isActive ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {project.name}
                              </p>
                              {project.description && (
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                  {project.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <Users size={11} />
                                  {memberCount} member{memberCount !== 1 ? 's' : ''}
                                </span>
                                {project.createdAt && (
                                  <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <Calendar size={11} />
                                    {new Date(
                                      (project.createdAt as { seconds: number }).seconds * 1000
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <Badge
                              variant={isActive ? 'default' : 'secondary'}
                              className={`text-xs ${
                                isActive
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {isActive ? 'Active' : 'Switch'}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${
                                userRole === 'Admin'
                                  ? 'border-purple-200 text-purple-700 bg-purple-50'
                                  : 'border-gray-200 text-gray-600'
                              }`}
                            >
                              {userRole}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
