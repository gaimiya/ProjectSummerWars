import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Layout } from './components/Layout'
import { EmployeeList } from './pages/Employees/EmployeeList'
import { EmployeeNew } from './pages/Employees/EmployeeNew'
import { EmployeeDetail } from './pages/Employees/EmployeeDetail'
import { Login } from './pages/Login'
import { FormSettings } from './pages/Settings/FormSettings'
import { auth } from './api/client'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const Private = ({ children }: { children: ReactNode }) =>
  USE_MOCK || auth.has() ? <Layout>{children}</Layout> : <Navigate to="/login" replace />

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/employees" element={<Private><EmployeeList /></Private>} />
        <Route path="/employees/new" element={<Private><EmployeeNew /></Private>} />
        <Route path="/employees/:no" element={<Private><EmployeeDetail /></Private>} />
        <Route path="/settings/forms" element={<Private><FormSettings /></Private>} />
        <Route path="*" element={<Navigate to="/employees" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
