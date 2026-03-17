import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProjectProvider } from '@/contexts/ProjectContext'
import { UserProvider } from '@/contexts/UserContext'
import MainLayout from '@/components/MainLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PublicRoute from '@/components/PublicRoute'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import TransmittalInPage from '@/pages/TransmittalInPage'
import TransmittalOutPage from '@/pages/TransmittalOutPage'
import DocumentRegisterPage from '@/pages/DocumentRegisterPage'
import SettingsPage from '@/pages/SettingsPage'
import ProjectManagementPage from '@/pages/ProjectManagementPage'
import UserManagementPage from '@/pages/UserManagementPage'
import ErrorBoundary from '@/components/ErrorBoundary'

function App() {
  return (
    <AuthProvider>
      <UserProvider>
      <ProjectProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<ErrorBoundary><MainLayout /></ErrorBoundary>}>
                <Route path="/dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
                <Route path="/transmittal-in" element={<ErrorBoundary><TransmittalInPage /></ErrorBoundary>} />
                <Route path="/transmittal-out" element={<ErrorBoundary><TransmittalOutPage /></ErrorBoundary>} />
                <Route path="/documents" element={<ErrorBoundary><DocumentRegisterPage /></ErrorBoundary>} />
                <Route path="/projects" element={<ErrorBoundary><ProjectManagementPage /></ErrorBoundary>} />
                <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
                <Route path="/users" element={<ErrorBoundary><UserManagementPage /></ErrorBoundary>} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ProjectProvider>
      </UserProvider>
    </AuthProvider>
  )
}

export default App
