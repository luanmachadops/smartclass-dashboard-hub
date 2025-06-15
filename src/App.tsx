
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "@/components/ThemeProvider"
import Index from "@/pages/Index"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
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
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/turmas" element={<Turmas />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/professores" element={<Professores />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </ThemeProvider>
  )
}

export default App
