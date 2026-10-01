import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { RequireAuth } from './components/layout/RequireAuth'
import { AdminCatalog, AdminIntel, AdminLogs, AdminSettings, AdminStaff } from './pages/admin/AdminPages'
import { CashierDesk, QueueBoard, ShiftRegister } from './pages/cashier/CashierPages'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { ManagerAudit, ManagerFloor, ManagerOverrides, ManagerPayroll } from './pages/manager/ManagerPages'
import { StylistAnalytics, StylistStation } from './pages/stylist/StylistPages'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route element={<RequireAuth roles={['cashier']} />}>
          <Route path="/cashier" element={<CashierDesk />} />
          <Route path="/cashier/queue" element={<QueueBoard />} />
          <Route path="/cashier/shift" element={<ShiftRegister />} />
        </Route>
        <Route element={<RequireAuth roles={['haircutter']} />}>
          <Route path="/stylist" element={<StylistStation />} />
          <Route path="/stylist/analytics" element={<StylistAnalytics />} />
        </Route>
        <Route element={<RequireAuth roles={['manager']} />}>
          <Route path="/manager" element={<ManagerFloor />} />
          <Route path="/manager/audit" element={<ManagerAudit />} />
          <Route path="/manager/payroll" element={<ManagerPayroll />} />
          <Route path="/manager/overrides" element={<ManagerOverrides />} />
        </Route>
        <Route element={<RequireAuth roles={['admin']} />}>
          <Route path="/admin" element={<AdminIntel />} />
          <Route path="/admin/staff" element={<AdminStaff />} />
          <Route path="/admin/catalog" element={<AdminCatalog />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
