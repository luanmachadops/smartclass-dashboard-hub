import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users } from "lucide-react"
import { useTurmas } from "@/hooks/useTurmas"
import { Skeleton } from "@/components/ui/skeleton"
import { AddTurmaModal } from "@/components/modals/AddTurmaModal"

export default function Turmas() {
  const { turmas, loading } = useTurmas()

  if (loading) {
    return (
      <DashboardLayout title="Turmas">
        <div className="p-6 lg:p-8 space-y-6">
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

  return (
    <DashboardLayout title="Turmas">
      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {turmas.map((turma) => (
            <Card key={turma.id} className="hover:shadow-xl hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <CardTitle>{turma.nome}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{turma.dia_semana || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {typeof turma.horario_inicio === "string" 
                      ? turma.horario_inicio 
                      : (turma.horario_inicio ? String(turma.horario_inicio) : "—")}
                     - 
                    {typeof turma.horario_fim === "string"
                      ? turma.horario_fim 
                      : (turma.horario_fim ? String(turma.horario_fim) : "—")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {typeof turma.alunos === "number"
                      ? turma.alunos
                      : 0} Alunos
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <AddTurmaModal
          trigger={
            <Button>
              Adicionar Turma
            </Button>
          }
        />
      </div>
    </DashboardLayout>
  )
}
