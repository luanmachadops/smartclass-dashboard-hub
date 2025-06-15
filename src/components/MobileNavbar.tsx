
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Home,
  Users,
  GraduationCap,
  UserCheck,
  BarChart3,
  DollarSign,
  MessageCircle
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Turmas", href: "/turmas", icon: Users },
  { name: "Alunos", href: "/alunos", icon: GraduationCap },
  { name: "Professores", href: "/professores", icon: UserCheck },
  { name: "Chat", href: "/comunicacao", icon: MessageCircle },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign },
]

export function MobileNavbar() {
  const location = useLocation()

  const isActive = (href: string) => location.pathname === href

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 lg:hidden">
      <div className="grid grid-cols-7 h-16">
        {navigation.map((item) => (
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
