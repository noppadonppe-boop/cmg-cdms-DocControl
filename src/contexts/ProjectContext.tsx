import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { Project } from '@/types'
import { mockProjects, MOCK_UID } from '@/data/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

interface ProjectContextValue {
  availableProjects: Project[]
  allProjects: Project[]
  selectedProject: Project | null
  changeSelectedProject: (projectId: string) => void
  loadingProjects: boolean
}

const ProjectContext = createContext<ProjectContextValue>({
  availableProjects: [],
  allProjects: [],
  selectedProject: null,
  changeSelectedProject: () => {},
  loadingProjects: true,
})

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()

  const [availableProjects, setAvailableProjects] = useState<Project[]>(
    USE_MOCK ? mockProjects.filter((p) => p.memberIds.includes(MOCK_UID.alice)) : []
  )
  const [allProjects, setAllProjects] = useState<Project[]>(
    USE_MOCK ? mockProjects : []
  )
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    USE_MOCK ? mockProjects[0] ?? null : null
  )
  const [loadingProjects, setLoadingProjects] = useState(!USE_MOCK)

  useEffect(() => {
    if (USE_MOCK) return

    if (!currentUser) {
      setAvailableProjects([])
      setSelectedProject(null)
      setLoadingProjects(false)
      return
    }

    const uid = currentUser.uid

    let unsubProjects: (() => void) | undefined
    let unsubUser: (() => void) | undefined
    let cancelled = false

    // Shared cache — updated by whichever listener fires first
    let cachedProjects: Project[] = []
    let cachedRole = 'Viewer'
    let cachedAssigned: string[] | null = null  // null = never set; [] = set but empty

    function applyFilter() {
      let projects: Project[]
      if (cachedRole === 'MasterAdmin' || cachedRole === 'Admin') {
        projects = cachedProjects
      } else if (cachedRole === 'SiteAdmin' && cachedAssigned !== null) {
        projects = cachedProjects.filter((p) => cachedAssigned!.includes(p.projectId))
      } else if (cachedAssigned !== null) {
        // assignedProjectIds was explicitly set — honour it (even if empty)
        projects = cachedProjects.filter((p) => cachedAssigned!.includes(p.projectId))
      } else {
        // Never configured — fall back to memberIds for backward compat
        const byMember = cachedProjects.filter((p) =>
          Array.isArray(p.memberIds) && p.memberIds.includes(uid)
        )
        projects = byMember.length > 0 ? byMember : cachedProjects
      }

      setAvailableProjects(projects)
      setSelectedProject((prev) => {
        if (prev) {
          const stillExists = projects.find((p) => p.projectId === prev.projectId)
          return stillExists ?? projects[0] ?? null
        }
        return projects[0] ?? null
      })
      setLoadingProjects(false)
    }

    Promise.all([
      import('firebase/firestore'),
      import('@/services/firebase'),
    ]).then(([{ collection, doc, onSnapshot }, { db }]) => {
      if (cancelled) return

      const userDocRef = doc(db, 'CMG-cdms-DocControl', 'root', 'users', currentUser.uid)
      const projectsColRef = collection(db, 'CMG-cdms-DocControl', 'root', 'projects')

      // Listener 1: user doc — updates role + assignedProjectIds reactively
      unsubUser = onSnapshot(userDocRef, (userSnap) => {
        if (cancelled) return
        if (userSnap.exists()) {
          const data = userSnap.data()
          cachedRole = data.role ?? 'Viewer'
          cachedAssigned = Array.isArray(data.assignedProjectIds) ? data.assignedProjectIds : null
        }
        applyFilter()
      })

      // Listener 2: projects collection
      unsubProjects = onSnapshot(projectsColRef, (snapshot) => {
        if (cancelled) return
        cachedProjects = snapshot.docs.map((d) => ({
          projectId: d.id,
          ...d.data(),
        })) as Project[]
        setAllProjects(cachedProjects)
        applyFilter()
      })
    })

    return () => {
      cancelled = true
      unsubProjects?.()
      unsubUser?.()
    }
  }, [currentUser])

  function changeSelectedProject(projectId: string) {
    const project = availableProjects.find((p) => p.projectId === projectId)
    if (project) setSelectedProject(project)
  }

  return (
    <ProjectContext.Provider
      value={{ availableProjects, allProjects, selectedProject, changeSelectedProject, loadingProjects }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  return useContext(ProjectContext)
}
