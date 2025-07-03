
import { useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AdicionarCursoModal } from "@/components/cursos/AdicionarCursoModal"
import { BookOpen, Users, TrendingUp, Search, Plus } from "lucide-react"
import { useCursos } from "@/hooks/useCursos"
import { useTurmas } from "@/hooks/useTurmas"
import { useAlunos } from "@/hooks/useAlunos"
import { CursoCard } from "@/components/cursos/CursoCard"
import { DashboardCursos } from "@/components/cursos/DashboardCursos"

export default function Cursos() {
  const { cursos, loading, refetch } = useCursos()
  const { turmas } = useTurmas()
  const { alunos } = useAlunos()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCursos = cursos.filter(curso =>
    curso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curso.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calcular estatísticas
  const totalCursos = cursos.length
  const cursosAtivos = cursos.filter(c => c.ativo).length
  const totalTurmas = turmas.length
  const totalAlunos = alunos.length

  // Calcular presença média geral
  const presencaMedia = turmas.length > 0 
    ? Math.round(turmas.reduce((acc, t) => acc + (t.presenca || 0), 0) / turmas.length)
    : 0

  if (loading) {
    return (
      <DashboardLayout title="Cursos">
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
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Cursos">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCursos}</div>
              <p className="text-xs text-muted-foreground">
                {cursosAtivos} ativos
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Turmas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTurmas}</div>
              <p className="text-xs text-muted-foreground">
                Distribuídas nos cursos
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
                Geral dos cursos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Barra de ações */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <AdicionarCursoModal 
            trigger={
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Curso
              </Button>
            }
            onSuccess={refetch}
          />
        </div>

        {/* Grid de cursos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCursos.map(curso => (
            <CursoCard 
              key={curso.id} 
              curso={curso}
              onClick={() => {
                console.log('Visualizar detalhes do curso:', curso.nome)
              }}
            />
          ))}
        </div>

        {filteredCursos.length === 0 && (
          <Card className="p-8 text-center">
            <CardContent>
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'Nenhum curso encontrado' : 'Nenhum curso cadastrado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca'
                  : 'Comece criando seu primeiro curso'
                }
              </p>
              {!searchTerm && (
                <AdicionarCursoModal 
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Curso
                    </Button>
                  }
                  onSuccess={refetch}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Dashboard avançado */}
        <DashboardCursos />
      </div>
    </DashboardLayout>
  )
}
