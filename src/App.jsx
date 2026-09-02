import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { ExpenseProvider } from './context/ExpenseContext'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import Overview from './pages/Overview'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Team from './pages/Team'
import Transactions from './pages/Transactions'
import Vendors from './pages/Vendors'
import Shops from './pages/Shops'
import Analytics from './pages/Analytics'
import Approvals from './pages/Approvals'
import Books from './pages/Books'
import Business from './pages/Business'
import Clients from './pages/Clients'

export default function App() {
  return (
    <ExpenseProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Overview />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ExpenseProvider>
  )
}
