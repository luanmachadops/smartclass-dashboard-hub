
import { DashboardLayout } from "@/components/DashboardLayout"
import { AddTurmaModal } from "@/components/modals/AddTurmaModal"
import { AddAlunoModal } from "@/components/modals/AddAlunoModal"
import { ChamadaModal } from "@/components/modals/ChamadaModal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { GraduationCap, Users, UserCheck, CheckCircle } from "lucide-react"
import { useTurmas } from "@/hooks/useTurmas"
import { useAlunos } from "@/hooks/useAlunos"
import { useProfessores } from "@/hooks/useProfessores"
import { Skeleton } from "@/components/ui/skeleton"

export default function Dashboard() {
  const { turmas, loading: turmasLoading } = useTurmas()
  const { alunos, loading: alunosLoading } = useAlunos()
  const { professores, loading: professoresLoading } = useProfessores()

  const loading = turmasLoading || alunosLoading || professoresLoading

  if (loading) {
    return (
      <DashboardLayout title="Resumo da Escola">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const stats = [
    {
      title: "Total de Alunos",
      value: alunos.length.toString(),
      icon: GraduationCap,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/50"
    },
    {
      title: "Total de Turmas", 
      value: turmas.length.toString(),
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/50"
    },
    {
      title: "Professores Ativos",
      value: professores.filter(p => p.ativo).length.toString(), 
      icon: UserCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/50"
    },
    {
      title: "Média de Presença",
      value: turmas.length > 0 ? `${Math.round(turmas.reduce((acc, t) => acc + (t.presenca || 0), 0) / turmas.length)}%` : "0%",
      icon: CheckCircle,
      color: "text-rose-600", 
      bgColor: "bg-rose-100 dark:bg-rose-900/50"
    }
  ]

  const recentClasses = turmas.slice(0, 4).map(turma => ({
    name: turma.nome,
    time: `${turma.horario_inicio} - ${turma.horario_fim}`,
    students: turma.alunos || 0,
    attendance: turma.presenca || 0,
    professores: turma.professores || []
  }))

  const instrumentCounts = turmas.reduce((acc, turma) => {
    acc[turma.instrumento] = (acc[turma.instrumento] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topInstruments = Object.entries(instrumentCounts)
    .map(([name, classes]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      classes,
      percentage: Math.round((classes / turmas.length) * 100)
    }))
    .sort((a, b) => b.classes - a.classes)
    .slice(0, 4)

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
              {recentClasses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma turma encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentClasses.map((classItem, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-semibold text-foreground">{classItem.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {classItem.time} • {classItem.students} alunos
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{classItem.attendance}%</p>
                          <p className="text-xs text-muted-foreground">Presença</p>
                        </div>
                        <ChamadaModal
                          trigger={
                            <Button size="sm" variant="outline">
                              Chamada
                            </Button>
                          }
                          turma={{
                            nome: classItem.name,
                            horario: classItem.time,
                            dia: "Hoje",
                            professores: classItem.professores
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Instruments */}
          <Card>
            <CardHeader>
              <CardTitle>Instrumentos Mais Populares</CardTitle>
            </CardHeader>
            <CardContent>
              {topInstruments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum dado disponível</p>
                </div>
              ) : (
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
              )}
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
              <AddTurmaModal
                trigger={
                  <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                    <h3 className="font-semibold text-foreground">Nova Turma</h3>
                    <p className="text-sm text-muted-foreground mt-1">Criar uma nova turma</p>
                  </div>
                }
              />
              <AddAlunoModal
                trigger={
                  <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                    <h3 className="font-semibold text-foreground">Registrar Aluno</h3>
                    <p className="text-sm text-muted-foreground mt-1">Adicionar novo aluno</p>
                  </div>
                }
              />
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
