import { useState, useEffect, useCallback } from 'react'
import { GlobalStyles } from './components/GlobalStyles'
import { Sidebar } from './components/Sidebar'
import { Toast } from './components/UI'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilesPage } from './pages/ProfilesPage'
import { InvitationsPage } from './pages/InvitationsPage'
import { api } from './api'
import type { PageKey, DashboardStats, ToastInfo, ToastType } from './types'

export default function App() {
  const [token, setToken] = useState<string | null>(null)
  const [page, setPage] = useState<PageKey>('dashboard')
  const [toast, setToast] = useState<ToastInfo | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    pending: 0,
    approved: 0,
    published: 0,
    totalCodes: 0,
    usedCodes: 0,
  })

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type, key: Date.now() })
  }, [])

  // Load basic stats when authenticated
  useEffect(() => {
    if (!token) return
    api.getPendingProfiles().then(res => {
      setStats(prev => ({ ...prev, pending: res.data?.total || 0 }))
    }).catch(() => {})
  }, [token, page])

  const handleLogin = (t: string) => {
    api.setToken(t)
    setToken(t)
  }

  const handleLogout = () => {
    api.setToken(null)
    setToken(null)
    setPage('dashboard')
  }

  // Not logged in -> show login page
  if (!token) {
    return (
      <>
        <GlobalStyles />
        <LoginPage onLogin={handleLogin} />
      </>
    )
  }

  // Logged in -> show admin panel
  return (
    <>
      <GlobalStyles />
      <Sidebar active={page} onNav={setPage} onLogout={handleLogout} />

      <div style={{ marginLeft: 240, minHeight: '100vh', padding: '32px 40px' }}>
        {page === 'dashboard' && (
          <DashboardPage stats={stats} onNav={setPage} />
        )}
        {page === 'profiles' && (
          <ProfilesPage showToast={showToast} />
        )}
        {page === 'invitations' && (
          <InvitationsPage showToast={showToast} />
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </>
  )
}
