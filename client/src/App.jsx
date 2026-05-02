import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import BottomNav      from './components/BottomNav'
import SideNav        from './components/SideNav'
import TopBar         from './components/TopBar'
import ProtectedRoute from './components/ProtectedRoute'
import { PageTitleProvider } from './context/PageTitleContext'

const LoginPage          = lazy(() => import('./pages/LoginPage'))
const DiscoveryPage      = lazy(() => import('./pages/DiscoveryPage'))
const LibraryPage        = lazy(() => import('./pages/LibraryPage'))
const TrendingPage       = lazy(() => import('./pages/TrendingPage'))
const ProfilePage        = lazy(() => import('./pages/ProfilePage'))
const CategoryPage       = lazy(() => import('./pages/CategoryPage'))
const SearchResultsPage  = lazy(() => import('./pages/SearchResultsPage'))

function Spinner() {
  return <div className="page-spinner"><div className="spinner" /></div>
}

function App() {
  return (
    <Routes>
      {/* Public — no shell */}
      <Route path="/login" element={
        <Suspense fallback={<Spinner />}>
          <LoginPage />
        </Suspense>
      } />

      {/* Protected — full app shell */}
      <Route path="/*" element={
        <ProtectedRoute>
          <PageTitleProvider>
            <div className="app-shell">
              <SideNav />
              <div className="main-wrapper">
                <TopBar />
                <Suspense fallback={<Spinner />}>
                  <Routes>
                    <Route path="/"              element={<Navigate to="/discover" replace />} />
                    <Route path="/discover"      element={<DiscoveryPage />} />
                    <Route path="/library"       element={<LibraryPage />} />
                    <Route path="/trending"      element={<TrendingPage />} />
                    <Route path="/profile"       element={<ProfilePage />} />
                    <Route path="/category/:type" element={<CategoryPage />} />
                    <Route path="/search"        element={<SearchResultsPage />} />
                  </Routes>
                </Suspense>
                <BottomNav />
              </div>
            </div>
          </PageTitleProvider>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App
