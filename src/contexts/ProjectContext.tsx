import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { Project } from '@/types'
import { mockProjects, MOCK_UID } from '@/data/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

interface ProjectContextValue {
  availableProjects: Project[]
  selectedProject: Project | null
  changeSelectedProject: (projectId: string) => void
  loadingProjects: boolean
}

const ProjectContext = createContext<ProjectContextValue>({
  availableProjects: [],
  selectedProject: null,
  changeSelectedProject: () => {},
  loadingProjects: true,
})

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()

  const [availableProjects, setAvailableProjects] = useState<Project[]>(
    USE_MOCK ? mockProjects.filter((p) => p.memberIds.includes(MOCK_UID.alice)) : []
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

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    Promise.all([
      import('firebase/firestore'),
      import('@/services/firebase'),
    ]).then(([{ collection, doc, onSnapshot }, { db }]) => {
      if (cancelled) return

      // Fetch user role first, then decide which projects to show
      const userDocRef = doc(db, 'CMG-cdms-DocControl', 'root', 'users', currentUser.uid)
      const projectsColRef = collection(db, 'CMG-cdms-DocControl', 'root', 'projects')

      // Listen to all projects (MasterAdmin/Admin see all; others filtered client-side)
      unsubscribe = onSnapshot(projectsColRef, async (snapshot) => {
        const allProjects = snapshot.docs.map((d) => ({
          projectId: d.id,
          ...d.data(),
        })) as Project[]

        // Read user role to decide filter
        let role = 'Viewer'
        try {
          const { getDoc } = await import('firebase/firestore')
          const userSnap = await getDoc(userDocRef)
          if (userSnap.exists()) role = userSnap.data().role ?? 'Viewer'
        } catch { /* ignore */ }

        let projects: Project[]
        if (role === 'MasterAdmin' || role === 'Admin') {
          projects = allProjects
        } else {
          const mine = allProjects.filter((p) =>
            Array.isArray(p.memberIds) && p.memberIds.includes(currentUser.uid)
          )
          // Fallback: if user has no memberships yet, show all so they can at least see the app
          projects = mine.length > 0 ? mine : allProjects
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
      })
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [currentUser])

  function changeSelectedProject(projectId: string) {
    const project = availableProjects.find((p) => p.projectId === projectId)
    if (project) setSelectedProject(project)
  }

  return (
    <ProjectContext.Provider
      value={{ availableProjects, selectedProject, changeSelectedProject, loadingProjects }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  return useContext(ProjectContext)
}
