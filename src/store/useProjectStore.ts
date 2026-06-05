import { create } from 'zustand'
import { Project, Activity, ProjectKPI } from '@/lib/types'

interface ProjectStore {
  // State
  projects: Project[]
  activeProject: Project | null
  activities: Activity[]
  kpi: ProjectKPI | null
  loading: boolean

  // Actions
  setProjects: (projects: Project[]) => void
  setActiveProject: (project: Project | null) => void
  setActivities: (activities: Activity[]) => void
  setKPI: (kpi: ProjectKPI) => void
  setLoading: (loading: boolean) => void
  updateActivityProgress: (id: string, progress: number) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  activeProject: null,
  activities: [],
  kpi: null,
  loading: false,

  setProjects:      (projects)      => set({ projects }),
  setActiveProject: (activeProject) => set({ activeProject }),
  setActivities:    (activities)    => set({ activities }),
  setKPI:           (kpi)           => set({ kpi }),
  setLoading:       (loading)       => set({ loading }),

  updateActivityProgress: (id, progress) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id ? { ...a, progress } : a
      ),
    })),
}))
