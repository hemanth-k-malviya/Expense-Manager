import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import PublicLayout from './components/PublicLayout'
import AuthActionRedirect from './components/AuthActionRedirect'
import { GuestRoute, ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ExpenseProvider } from './context/ExpenseContext'
import { APP_HOME } from './lib/site'
import Analytics from './pages/Analytics'
import Approvals from './pages/Approvals'
import Books from './pages/Books'
import Budgets from './pages/Budgets'
import Business from './pages/Business'
import Clients from './pages/Clients'
import Goals from './pages/Goals'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import Overview from './pages/Overview'
import About from './pages/public/About'
import Contact from './pages/public/Contact'
import Disclaimer from './pages/public/Disclaimer'
import GuideArticle from './pages/public/GuideArticle'
import Guides from './pages/public/Guides'
import Landing from './pages/public/Landing'
import NotFound from './pages/public/NotFound'
import Privacy from './pages/public/Privacy'
import Terms from './pages/public/Terms'
import Register from './pages/Register'
import Reports from './pages/Reports'
import ResetPassword from './pages/ResetPassword'
import Settings from './pages/Settings'
import Shops from './pages/Shops'
import Team from './pages/Team'
import Transactions from './pages/Transactions'
import Vendors from './pages/Vendors'

function AuthenticatedShell() {
  const { user } = useAuth()
  return (
    <ExpenseProvider key={`${user.uid}:${user.email || ''}`}>
      <Layout />
    </ExpenseProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthActionRedirect>
          <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/guides/:slug" element={<GuideArticle />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
          </Route>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPassword />
              </GuestRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/__/auth/action" element={<ResetPassword />} />
          <Route
            element={
              <ProtectedRoute>
                <AuthenticatedShell />
              </ProtectedRoute>
            }
          >
            <Route path={APP_HOME} element={<Overview />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/books" element={<Books />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/pricing" element={<Navigate to="/business" replace />} />
            <Route path="/business" element={<Business />} />
            <Route path="/team" element={<Team />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/shops" element={<Shops />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        </AuthActionRedirect>
      </BrowserRouter>
    </AuthProvider>
  )
}
