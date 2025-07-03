import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useUserProfile } from "@/contexts/UserProfileContext"
import {
  Home,
  Users,
  GraduationCap,
  UserCheck,
  BarChart3,
  DollarSign,
  MessageCircle,
  BookOpen
} from "lucide-react"

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
    name: "Chat", 
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

export function MobileNavbar() {
  const location = useLocation()
  const { profile } = useUserProfile()

  // Filtrar navegação baseada no papel do usuário
  const filteredNavigation = navigation.filter(item => 
    profile?.tipo_usuario && item.roles.includes(profile.tipo_usuario)
  )

  const isActive = (href: string) => location.pathname === href

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 lg:hidden">
      <div className={cn(
        "grid h-16",
        filteredNavigation.length <= 4 ? "grid-cols-4" : 
        filteredNavigation.length <= 5 ? "grid-cols-5" :
        filteredNavigation.length <= 6 ? "grid-cols-6" : "grid-cols-7"
      )}>
        {filteredNavigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
              isActive(item.href)
                ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate text-[10px]">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
