
import { useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { AddAlunoModal } from "@/components/modals/AddAlunoModal"
import { AlunoDetails } from "@/components/details/AlunoDetails"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { GraduationCap, Search, Users, UserCheck, UserX, Plus } from "lucide-react"
import { useAlunos } from "@/hooks/useAlunos"

export default function Alunos() {
  const { alunos, loading } = useAlunos()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAluno, setSelectedAluno] = useState<any>(null)

  const filteredAlunos = alunos.filter(aluno =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (aluno.email && aluno.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const alunosAtivos = alunos.filter(aluno => aluno.ativo)
  const alunosInativos = alunos.filter(aluno => !aluno.ativo)

  const estatisticas = [
    {
      titulo: "Total de Alunos",
      valor: alunos.length,
      icon: GraduationCap,
      cor: "text-blue-600",
      fundo: "bg-blue-100 dark:bg-blue-900/50"
    },
    {
      titulo: "Alunos Ativos",
      valor: alunosAtivos.length,
      icon: UserCheck,
      cor: "text-green-600",
      fundo: "bg-green-100 dark:bg-green-900/50"
    },
    {
      titulo: "Alunos Inativos",
      valor: alunosInativos.length,
      icon: UserX,
      cor: "text-red-600",
      fundo: "bg-red-100 dark:bg-red-900/50"
    }
  ]

  const handleDeleteAluno = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este aluno?')) {
      console.log('Deletar aluno:', id)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Gestão de Alunos">
        <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    <Skeleton className="h-24 w-full" />
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
    <DashboardLayout title="Gestão de Alunos">
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {estatisticas.map((stat, index) => (
              <Card key={index} className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full ${stat.fundo} flex items-center justify-center`}>
                        <stat.icon className={`h-6 w-6 ${stat.cor}`} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.titulo}</p>
                        <p className="text-3xl font-bold text-foreground">{stat.valor}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Barra de pesquisa e botão adicionar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Buscar aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              />
            </div>
            <AddAlunoModal
              trigger={
                <Button className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Adicionar Aluno
                </Button>
              }
            />
          </div>

          {/* Lista de Alunos */}
          <div className="space-y-4">
            {filteredAlunos.length === 0 ? (
              <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 border-white/20 shadow-xl">
                <CardContent className="text-center py-12">
                  <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-4">
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "Tente ajustar sua pesquisa" : "Comece adicionando o primeiro aluno"}
                  </p>
                  {!searchTerm && (
                    <AddAlunoModal
                      trigger={
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Adicionar primeiro aluno
                        </Button>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredAlunos.map((aluno) => (
                <Card key={aluno.id} className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                            {aluno.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{aluno.nome}</h3>
                            <Badge variant={aluno.ativo ? "default" : "secondary"}>
                              {aluno.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          {aluno.email && (
                            <p className="text-sm text-muted-foreground">{aluno.email}</p>
                          )}
                          {aluno.telefone && (
                            <p className="text-sm text-muted-foreground">{aluno.telefone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAluno(aluno)}
                        >
                          Ver Detalhes
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAluno(aluno.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Modal de Detalhes */}
          {selectedAluno && (
            <AlunoDetails
              aluno={selectedAluno}
              onClose={() => setSelectedAluno(null)}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
