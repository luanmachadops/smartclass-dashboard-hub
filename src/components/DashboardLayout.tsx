import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/Logo"
import { ThemeToggle } from "@/components/ThemeToggle"
import { MobileNavbar } from "@/components/MobileNavbar"
import { useAuth } from "@/contexts/AuthContext"
import { useUserProfile } from "@/contexts/UserProfileContext"
import {
  Menu,
  Home,
  Users,
  GraduationCap,
  UserCheck,
  BarChart3,
  DollarSign,
  MessageCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

const navigation = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: Home, 
    roles: ['diretor', 'admin', 'professor', 'aluno', 'secretario'] 
  },
  { 
    name: "Turmas", 
    href: "/turmas", 
    icon: Users, 
    roles: ['diretor', 'admin', 'secretario', 'professor'] 
  },
  { 
    name: "Cursos", 
    href: "/cursos", 
    icon: BookOpen, 
    roles: ['diretor', 'admin'] 
  },
  { 
    name: "Alunos", 
    href: "/alunos", 
    icon: GraduationCap, 
    roles: ['diretor', 'admin', 'secretario', 'professor'] 
  },
  { 
    name: "Professores", 
    href: "/professores", 
    icon: UserCheck, 
    roles: ['diretor', 'admin', 'secretario'] 
  },
  { 
    name: "Comunicação", 
    href: "/comunicacao", 
    icon: MessageCircle, 
    roles: ['diretor', 'admin', 'professor', 'aluno', 'secretario'] 
  },
  { 
    name: "Relatórios", 
    href: "/relatorios", 
    icon: BarChart3, 
    roles: ['diretor', 'admin'] 
  },
  { 
    name: "Financeiro", 
    href: "/financeiro", 
    icon: DollarSign, 
    roles: ['diretor', 'admin', 'secretario'] 
  },
]

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { profile } = useUserProfile()

  // Filtrar navegação baseada no papel do usuário
  const filteredNavigation = navigation.filter(item => 
    profile?.tipo_usuario && item.roles.includes(profile.tipo_usuario)
  )

  const isActive = (href: string) => location.pathname === href

  const handleLogout = async () => {
    await signOut()
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        "flex h-16 shrink-0 items-center border-b border-gray-200 dark:border-gray-700 px-4 transition-all duration-300",
        sidebarCollapsed ? "justify-center" : "justify-between"
      )}>
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          {!sidebarCollapsed && (
            <span className="text-lg font-semibold animate-fade-in">SmartClass</span>
          )}
        </div>
        {!sidebarCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(true)}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Collapse button when sidebar is collapsed */}
      {sidebarCollapsed && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(false)}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105",
              isActive(item.href)
                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            )}
            title={sidebarCollapsed ? item.name : undefined}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
              sidebarCollapsed ? "mx-auto" : "mr-3"
            )} />
            {!sidebarCollapsed && (
              <span className="animate-fade-in">{item.name}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* User info and logout */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        {!sidebarCollapsed && (
          <div className="mb-3 animate-fade-in">
            <Link 
              to="/profile" 
              className="block hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md p-2 transition-colors"
            >
              <div className="text-sm text-muted-foreground truncate">
                {user?.email}
              </div>
              {profile && (
                <div className="text-xs text-muted-foreground/80 capitalize">
                  {profile.tipo_usuario} • {profile.nome_completo}
                </div>
              )}
            </Link>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "transition-all duration-200 hover:scale-105 border-gray-200 dark:border-gray-700",
            sidebarCollapsed ? "w-8 h-8 p-0" : "w-full justify-start gap-2"
          )}
          title={sidebarCollapsed ? "Sair" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!sidebarCollapsed && <span>Sair</span>}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300",
        sidebarCollapsed ? "lg:w-16" : "lg:w-72"
      )}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-white dark:bg-gray-900">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-72"
      )}>
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden border-gray-200 dark:border-gray-700">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Abrir sidebar</span>
              </Button>
            </SheetTrigger>
          </Sheet>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              {title && (
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNavbar />
    </div>
  )
}
