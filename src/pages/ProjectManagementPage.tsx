import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { useProject } from '@/contexts/ProjectContext'
import { useUser } from '@/contexts/UserContext'
import { useEditLock } from '@/hooks/useEditLock'
import EditLockBanner from '@/components/EditLockBanner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { Project } from '@/types'
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  Calendar,
  CheckCircle2,
  Loader2,
  Building2,
  AlertTriangle,
} from 'lucide-react'

const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

const LOCK_PATH = 'CMG-cdms-DocControl/root/projects'

export default function ProjectManagementPage() {
  const { currentUser } = useAuth()
  const { userProfile } = useUser()
  const { availableProjects, selectedProject, changeSelectedProject, loadingProjects } = useProject()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [confirmDeleteProject, setConfirmDeleteProject] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { acquireLock, releaseLock, forceReleaseLock, isLockedByOther, isLockedByMe, lockedByName } = useEditLock(LOCK_PATH)

  const canManage = userProfile?.role === 'MasterAdmin' || userProfile?.role === 'Admin' || userProfile?.role === 'Manager'

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
  })

  function startEdit(project: Project, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingProject(project)
    setValue('name', project.name)
    setValue('description', project.description ?? '')
    setSuccessMessage(null)
  }

  function cancelEdit() {
    setEditingProject(null)
    reset()
    setSuccessMessage(null)
  }

  async function onSubmit(values: ProjectFormValues) {
    if (!currentUser) return
    setIsSubmitting(true)
    setSuccessMessage(null)

    try {
      await forceReleaseLock()
      await acquireLock()

      if (editingProject) {
        // ── Update existing project ──
        const [{ doc, updateDoc }, { db }] = await Promise.all([
          import('firebase/firestore'),
          import('@/services/firebase'),
        ])
        await updateDoc(doc(db, 'CMG-cdms-DocControl', 'root', 'projects', editingProject.projectId), {
          name: values.name,
          description: values.description ?? '',
        })
        setSuccessMessage(`Project "${values.name}" updated successfully!`)
        setEditingProject(null)
        reset()
      } else {
        // ── Create new project ──
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
      }
    } catch (err) {
      console.error('Failed to save project:', err)
    } finally {
      setIsSubmitting(false)
      await releaseLock()
    }
  }

  async function handleDelete() {
    if (!confirmDeleteProject) return
    setIsDeleting(true)
    try {
      const [{ doc, deleteDoc }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('@/services/firebase'),
      ])
      await deleteDoc(doc(db, 'CMG-cdms-DocControl', 'root', 'projects', confirmDeleteProject.projectId))
      setConfirmDeleteProject(null)
      if (editingProject?.projectId === confirmDeleteProject.projectId) cancelEdit()
    } catch (err) {
      console.error('Failed to delete project:', err)
    } finally {
      setIsDeleting(false)
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
        {/* ── Create / Edit Form ── */}
        <div className="lg:col-span-1">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                {editingProject ? (
                  <><Pencil size={16} className="text-amber-500" /> Edit Project</>
                ) : (
                  <><Plus size={16} className="text-blue-600" /> Create New Project</>
                )}
              </CardTitle>
              <CardDescription>
                {editingProject
                  ? `Editing: ${editingProject.name}`
                  : 'You will be added as Admin automatically.'}
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

                <div className="flex gap-2">
                  {editingProject && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={cancelEdit}
                      disabled={isSubmitting}
                    >
                      <X size={15} className="mr-1.5" /> Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className={`${editingProject ? 'flex-1' : 'w-full'} ${editingProject ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                    disabled={isSubmitting || !currentUser}
                  >
                    {isSubmitting ? (
                      <><Loader2 size={15} className="mr-2 animate-spin" />{editingProject ? 'Saving…' : 'Creating…'}</>
                    ) : editingProject ? (
                      <><CheckCircle2 size={15} className="mr-2" /> Save Changes</>
                    ) : (
                      <><Plus size={15} className="mr-2" /> Create Project</>
                    )}
                  </Button>
                </div>
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
                Click a project to make it active. {canManage && 'Use ✏️ / 🗑️ to edit or delete.'}
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
                  <p className="text-xs text-gray-400 mt-1">Create your first project using the form on the left.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableProjects.map((project) => {
                    const isActive = selectedProject?.projectId === project.projectId
                    const isEditing = editingProject?.projectId === project.projectId
                    const userRole = currentUser ? project.roles?.[currentUser.uid] ?? 'Member' : 'Member'
                    const memberCount = project.memberIds?.length ?? 1

                    return (
                      <div
                        key={project.projectId}
                        className={`group relative p-4 rounded-lg border transition-all ${
                          isEditing
                            ? 'border-amber-300 bg-amber-50 ring-1 ring-amber-200'
                            : isActive
                            ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200'
                            : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50'
                        }`}
                      >
                        {/* Clickable area */}
                        <button
                          className="w-full text-left"
                          onClick={() => changeSelectedProject(project.projectId)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                                isEditing ? 'bg-amber-500' : isActive ? 'bg-blue-600' : 'bg-gray-100'
                              }`}>
                                <Building2 size={16} className={isEditing || isActive ? 'text-white' : 'text-gray-500'} />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-semibold truncate ${
                                  isEditing ? 'text-amber-900' : isActive ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {project.name}
                                </p>
                                {project.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{project.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <Users size={11} />{memberCount} member{memberCount !== 1 ? 's' : ''}
                                  </span>
                                  {project.createdAt && (
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                      <Calendar size={11} />
                                      {new Date((project.createdAt as { seconds: number }).seconds * 1000).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <Badge
                                className={`text-xs ${
                                  isEditing ? 'bg-amber-500 text-white' : isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {isEditing ? 'Editing' : isActive ? 'Active' : 'Switch'}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs capitalize ${
                                  userRole === 'Admin' || userRole === 'MasterAdmin'
                                    ? 'border-purple-200 text-purple-700 bg-purple-50'
                                    : 'border-gray-200 text-gray-600'
                                }`}
                              >
                                {userRole}
                              </Badge>
                            </div>
                          </div>
                        </button>

                        {/* Edit / Delete action buttons */}
                        {canManage && (
                          <div className="absolute top-3 right-[90px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => startEdit(project, e)}
                              title="Edit project"
                              className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteProject(project) }}
                              title="Delete project"
                              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Delete Confirmation Dialog ── */}
      {confirmDeleteProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Project</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ต้องการลบโครงการ <span className="font-semibold text-gray-800">"{confirmDeleteProject.name}"</span> ใช่หรือไม่?
                </p>
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ การลบโครงการจะไม่ลบ Transmittal และ Document ที่เกี่ยวข้อง
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteProject(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <><Loader2 size={14} className="mr-1.5 animate-spin" /> Deleting…</> : <><Trash2 size={14} className="mr-1.5" /> Delete</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
