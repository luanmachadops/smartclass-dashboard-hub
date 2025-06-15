
import { useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { AddTurmaModal } from "@/components/modals/AddTurmaModal"
import { TurmaDetailsModal } from "@/components/modals/TurmaDetailsModal"
import { TurmaCard } from "@/components/TurmaCard"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Clock, Plus } from "lucide-react"
import { useTurmas } from "@/hooks/useTurmas"
import { Skeleton } from "@/components/ui/skeleton"

export default function Turmas() {
  const { turmas, loading, deleteTurma } = useTurmas()
  const [selectedTurma, setSelectedTurma] = useState<any>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  const handleViewDetails = (turma: any) => {
    setSelectedTurma(turma)
    setDetailsModalOpen(true)
  }

  if (loading) {
    return (
      <DashboardLayout title="Gestão de Turmas">
        <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 lg:p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Gestão de Turmas">
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header com estatísticas rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:shadow-lg transition-shadow">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Total de Turmas</p>
                    <p className="text-3xl font-bold">{turmas.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:shadow-lg transition-shadow">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-100">Turmas Ativas</p>
                    <p className="text-3xl font-bold">
                      {turmas.filter(t => t.ativa).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Calendar className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 lg:p-6">
                 <div className="flex items-center justify-between">
                  <div>
                      <p className="text-sm text-purple-100">Média de Presença</p>
                      <p className="text-3xl font-bold">
                        {turmas.length > 0 ? Math.round(turmas.reduce((acc, t) => acc + (t.presenca || 0), 0) / turmas.length) : 0}%
                      </p>
                  </div>
                   <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Clock className="h-6 w-6" />
                    </div>
                  </div>
              </CardContent>
            </Card>
          </div>

          {/* Botão Adicionar Turma */}
          <div className="flex justify-center sm:justify-end">
            <AddTurmaModal
              trigger={
                <Button className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Criar Turma
                </Button>
              }
            />
          </div>

          {/* Lista de Turmas */}
          <div>
            <div className="mb-6 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-foreground">Todas as Turmas</h2>
              <p className="text-muted-foreground">Clique em uma turma para ver os detalhes e gerenciar aulas</p>
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
              <div className="space-y-4 lg:space-y-6">
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

          {/* Modal de Detalhes */}
          <TurmaDetailsModal
            turma={selectedTurma}
            open={detailsModalOpen}
            onOpenChange={setDetailsModalOpen}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
