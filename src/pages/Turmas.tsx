
import { useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { TurmaCard } from "@/components/TurmaCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Clock, Users, TrendingUp, Search, Plus } from "lucide-react"
import { useTurmas } from "@/hooks/useTurmas"
import { AddTurmaModal } from "@/components/modals/AddTurmaModal"

export default function Turmas() {
  const { turmas, loading, deleteTurma } = useTurmas()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTurmas = turmas.filter(turma =>
    turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.instrumento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.nivel.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calcular estatísticas
  const totalTurmas = turmas.length
  const turmasAtivas = turmas.filter(t => t.ativa).length
  const totalAlunos = turmas.reduce((acc, t) => acc + (t.alunos || 0), 0)
  const presencaMedia = turmas.length > 0 
    ? Math.round(turmas.reduce((acc, t) => acc + (t.presenca || 0), 0) / turmas.length)
    : 0

  const handleViewDetails = (turma: any) => {
    console.log('Visualizar detalhes da turma:', turma.nome)
  }

  if (loading) {
    return (
      <DashboardLayout title="Turmas">
        <div className="p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-40 w-full" />
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
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Turmas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTurmas}</div>
              <p className="text-xs text-muted-foreground">
                {turmasAtivas} ativas
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAlunos}</div>
              <p className="text-xs text-muted-foreground">
                Matriculados
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presença Média</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presencaMedia}%</div>
              <p className="text-xs text-muted-foreground">
                Geral das turmas
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">
                Vagas preenchidas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Barra de ações */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar turmas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <AddTurmaModal
            trigger={
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Turma
              </Button>
            }
          />
        </div>

        {/* Grid de turmas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTurmas.map((turma) => (
            <TurmaCard
              key={turma.id}
              turma={turma}
              onDelete={deleteTurma}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>

        {filteredTurmas.length === 0 && (
          <Card className="p-8 text-center">
            <CardContent>
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'Nenhuma turma encontrada' : 'Nenhuma turma cadastrada'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca'
                  : 'Comece criando sua primeira turma'
                }
              </p>
              {!searchTerm && (
                <AddTurmaModal
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Turma
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
