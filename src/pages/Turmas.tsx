
import { DashboardLayout } from "@/components/DashboardLayout"
import { AddTurmaModal } from "@/components/modals/AddTurmaModal"
import { TurmaCard } from "@/components/TurmaCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Clock, Plus } from "lucide-react"
import { useTurmas } from "@/hooks/useTurmas"
import { Skeleton } from "@/components/ui/skeleton"

export default function Turmas() {
  const { turmas, loading, deleteTurma } = useTurmas()

  const handleViewDetails = (turma: any) => {
    console.log("Ver detalhes da turma:", turma)
  }

  if (loading) {
    return (
      <DashboardLayout title="Gestão de Turmas">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
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
    <DashboardLayout title="Gestão de Turmas">
      <div className="space-y-6">
        {/* Header com estatísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Turmas</p>
                  <p className="text-2xl font-bold text-foreground">{turmas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Turmas Ativas</p>
                  <p className="text-2xl font-bold text-foreground">
                    {turmas.filter(t => t.ativa).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média de Presença</p>
                  <p className="text-2xl font-bold text-foreground">
                    {turmas.length > 0 ? Math.round(turmas.reduce((acc, t) => acc + (t.presenca || 0), 0) / turmas.length) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botão Adicionar Turma */}
        <div className="flex justify-end">
          <AddTurmaModal
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Turma
              </Button>
            }
          />
        </div>

        {/* Lista de Turmas */}
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground">Todas as Turmas</h2>
            <p className="text-muted-foreground">Gerencie suas turmas e acompanhe o desempenho</p>
          </div>
          
          {turmas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma turma encontrada</h3>
                <p className="text-muted-foreground mb-4">Comece criando sua primeira turma</p>
                <AddTurmaModal
                  trigger={
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Criar primeira turma
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {turmas.map((turma) => (
                <TurmaCard
                  key={turma.id}
                  turma={turma}
                  onDelete={deleteTurma}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
