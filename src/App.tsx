import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SchoolProvider } from "./contexts/SchoolContext";
import { UserProfileProvider } from "./contexts/UserProfileContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import {
  LazyDashboard,
  LazyAlunos,
  LazyProfessores,
  LazyTurmas,
  LazyComunicacao,
  LazyFinanceiro,
  LazyCursos,
  LazyRelatorios,
  LazyProfile,
} from "./components/LazyRoute";
import { monitoring } from "./services/monitoring";
import { useRouteMonitoring } from "./hooks/useRouteMonitoring";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmailConfirmation from "./pages/EmailConfirmation";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { AccessibilityProvider } from "./components/AccessibilityProvider";
import "./App.css";
import "./styles/accessibility.css";
import { useEffect } from "react";

// Componente para monitoramento de rotas
const RouteMonitor = () => {
  useRouteMonitoring();
  return null;
};

function App() {
  useEffect(() => {
    monitoring.init();
  }, []);

  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <TooltipProvider>
          <BrowserRouter>
            <RouteMonitor />
            <AuthProvider>
              <SchoolProvider>
                <UserProfileProvider>
                  <div className="min-h-screen bg-background font-sans antialiased">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<Navigate to="/auth" replace />} />
                      <Route path="/register" element={<Navigate to="/auth" replace />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/email-confirmation" element={<EmailConfirmation />} />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <LazyDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/alunos"
                        element={
                          <ProtectedRoute>
                            <LazyAlunos />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/professores"
                        element={
                          <ProtectedRoute>
                            <LazyProfessores />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/turmas"
                        element={
                          <ProtectedRoute>
                            <LazyTurmas />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/cursos"
                        element={
                          <ProtectedRoute>
                            <LazyCursos />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/financeiro"
                        element={
                          <ProtectedRoute>
                            <LazyFinanceiro />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/comunicacao"
                        element={
                          <ProtectedRoute>
                            <LazyComunicacao />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/relatorios"
                        element={
                          <ProtectedRoute>
                            <LazyRelatorios />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <LazyProfile />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                  <Toaster />
                </UserProfileProvider>
              </SchoolProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default App;
