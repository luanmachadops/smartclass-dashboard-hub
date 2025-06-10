
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { GraduationCap, Users, UserCheck, CheckCircle } from "lucide-react"

export default function Dashboard() {
  const stats = [
    {
      title: "Total de Alunos",
      value: "128",
      icon: GraduationCap,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/50"
    },
    {
      title: "Total de Turmas", 
      value: "12",
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/50"
    },
    {
      title: "Professores Ativos",
      value: "8", 
      icon: UserCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/50"
    },
    {
      title: "Média de Presença",
      value: "92%",
      icon: CheckCircle,
      color: "text-rose-600", 
      bgColor: "bg-rose-100 dark:bg-rose-900/50"
    }
  ]

  const recentClasses = [
    { name: "Violão Iniciante", time: "14:00", students: 12, attendance: 92 },
    { name: "Piano Intermediário", time: "15:30", students: 8, attendance: 88 },
    { name: "Bateria Avançado", time: "16:00", students: 6, attendance: 100 },
    { name: "Canto Popular", time: "17:00", students: 10, attendance: 80 }
  ]

  const topInstruments = [
    { name: "Violão", classes: 5, percentage: 42 },
    { name: "Piano", classes: 3, percentage: 25 },
    { name: "Bateria", classes: 2, percentage: 17 },
    { name: "Canto", classes: 2, percentage: 17 }
  ]

  return (
    <DashboardLayout title="Resumo da Escola">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center ${stat.bgColor}`}>
                    <stat.icon className={`h-7 w-7 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Classes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Turmas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentClasses.map((classItem, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-semibold text-foreground">{classItem.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {classItem.time} • {classItem.students} alunos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{classItem.attendance}%</p>
                      <p className="text-xs text-muted-foreground">Presença</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Instruments */}
          <Card>
            <CardHeader>
              <CardTitle>Instrumentos Mais Populares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topInstruments.map((instrument, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{instrument.name}</span>
                      <span className="text-muted-foreground">{instrument.classes} turmas</span>
                    </div>
                    <Progress value={instrument.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                <h3 className="font-semibold text-foreground">Nova Turma</h3>
                <p className="text-sm text-muted-foreground mt-1">Criar uma nova turma</p>
              </div>
              <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                <h3 className="font-semibold text-foreground">Registrar Aluno</h3>
                <p className="text-sm text-muted-foreground mt-1">Adicionar novo aluno</p>
              </div>
              <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                <h3 className="font-semibold text-foreground">Fazer Chamada</h3>
                <p className="text-sm text-muted-foreground mt-1">Registrar presença</p>
              </div>
              <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                <h3 className="font-semibold text-foreground">Gerar Relatório</h3>
                <p className="text-sm text-muted-foreground mt-1">Ver estatísticas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
