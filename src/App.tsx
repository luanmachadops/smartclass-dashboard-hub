
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "@/components/ThemeProvider"
import { AuthProvider } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import Index from "@/pages/Index"
import Auth from "@/pages/Auth"
import Dashboard from "@/pages/Dashboard"
import Turmas from "@/pages/Turmas"
import Alunos from "@/pages/Alunos"
import Professores from "@/pages/Professores"
import Relatorios from "@/pages/Relatorios"
import Financeiro from "@/pages/Financeiro"
import NotFound from "@/pages/NotFound"
import { Toaster } from "@/components/ui/sonner"
import "./App.css"

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="smartclass-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/register" element={<Navigate to="/auth" replace />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/turmas" element={
              <ProtectedRoute>
                <Turmas />
              </ProtectedRoute>
            } />
            <Route path="/alunos" element={
              <ProtectedRoute>
                <Alunos />
              </ProtectedRoute>
            } />
            <Route path="/professores" element={
              <ProtectedRoute>
                <Professores />
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute>
                <Relatorios />
              </ProtectedRoute>
            } />
            <Route path="/financeiro" element={
              <ProtectedRoute>
                <Financeiro />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
