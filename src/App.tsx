import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/useAuthStore'

import LoginPage        from '@/pages/LoginPage'
import ProjectListPage  from '@/pages/ProjectListPage'
import DashboardPage    from '@/pages/DashboardPage'
import WBSPage          from '@/pages/WBSPage'
import SchedulePage     from '@/pages/SchedulePage'
import ResourcePage     from '@/pages/ResourcePage'
import ProcurementPage  from '@/pages/ProcurementPage'
import KanbanPage       from '@/pages/KanbanPage'
import ProgressPage     from '@/pages/ProgressPage'
import DiaryPage        from '@/pages/DiaryPage'
import CostPage         from '@/pages/CostPage'
import IssuePage        from '@/pages/IssuePage'
import QCPage           from '@/pages/QCPage'
import ApprovalPage     from '@/pages/ApprovalPage'
import AnalyticsPage    from '@/pages/AnalyticsPage'
import ReportPage       from '@/pages/ReportPage'
import CloseoutPage     from '@/pages/CloseoutPage'
import EcosystemPage    from '@/pages/EcosystemPage'
import AppLayout        from '@/components/layout/AppLayout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore()
  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-civil-bg">
        <div className="w-8 h-8 border-2 border-civil-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const { setUser, setInitialized } = useAuthStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid:         firebaseUser.uid,
          email:       firebaseUser.email ?? '',
          displayName: firebaseUser.displayName ?? 'User',
          role:        'pm',
          photoURL:    firebaseUser.photoURL ?? undefined,
        })
      } else {
        setUser(null)
      }
      setInitialized(true)
    })
    return () => unsub()
  }, [setUser, setInitialized])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/projects" replace />} />
          <Route path="projects"                    element={<ProjectListPage />} />
          <Route path="projects/:id"                element={<DashboardPage />} />
          <Route path="projects/:id/wbs"            element={<WBSPage />} />
          <Route path="projects/:id/schedule"       element={<SchedulePage />} />
          <Route path="projects/:id/resources"      element={<ResourcePage />} />
          <Route path="projects/:id/procurement"    element={<ProcurementPage />} />
          <Route path="projects/:id/kanban"         element={<KanbanPage />} />
          <Route path="projects/:id/progress"       element={<ProgressPage />} />
          <Route path="projects/:id/diary"          element={<DiaryPage />} />
          <Route path="projects/:id/cost"           element={<CostPage />} />
          <Route path="projects/:id/issues"         element={<IssuePage />} />
          <Route path="projects/:id/quality"        element={<QCPage />} />
          <Route path="projects/:id/approvals"      element={<ApprovalPage />} />
          <Route path="projects/:id/analytics"      element={<AnalyticsPage />} />
          <Route path="projects/:id/reports"        element={<ReportPage />} />
          <Route path="projects/:id/closeout"       element={<CloseoutPage />} />
          <Route path="projects/:id/ecosystem"      element={<EcosystemPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
