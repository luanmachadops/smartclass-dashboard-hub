
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Mail, Phone, Users, Calendar, Star, Plus } from "lucide-react"
import { useProfessores } from "@/hooks/useProfessores"
import { AddProfessorModal } from "@/components/modals/AddProfessorModal"
import { useState } from "react"

export default function Professores() {
  const { professores, loading, refetch } = useProfessores()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProfessores = professores.filter(professor =>
    professor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.especialidades?.some(esp => esp.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const professoresAtivos = professores.filter(p => p.ativo)
  const avaliacaoMediaGeral = professores.length > 0 
    ? professores.reduce((acc, p) => acc + (p.avaliacao_media || 0), 0) / professores.length
    : 0

  const estatisticas = [
    {
      titulo: "Total de Professores",
      valor: professores.length.toString(),
      icon: Users,
      cor: "text-blue-600",
      fundo: "bg-blue-100 dark:bg-blue-900/50"
    },
    {
      titulo: "Professores Ativos", 
      valor: professoresAtivos.length.toString(),
      icon: Calendar,
      cor: "text-green-600",
      fundo: "bg-green-100 dark:bg-green-900/50"
    },
    {
      titulo: "Avaliação Média",
      valor: `${avaliacaoMediaGeral.toFixed(1)}⭐`,
      icon: Star,
      cor: "text-yellow-600", 
      fundo: "bg-yellow-100 dark:bg-yellow-900/50"
    }
  ]

  if (loading) {
    return (
      <DashboardLayout title="Gestão de Professores">
        <div className="p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Gestão de Professores">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {estatisticas.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${stat.fundo} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.cor}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.titulo}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.valor}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Barra de Pesquisa e Botão Adicionar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar professores..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <AddProfessorModal
            trigger={
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Professor
              </Button>
            }
            onProfessorAdded={refetch}
          />
        </div>

        {/* Lista de Professores */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Professores ({filteredProfessores.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProfessores.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum professor encontrado com esse termo de busca" : "Nenhum professor cadastrado ainda"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProfessores.map((professor) => (
                  <div
                    key={professor.id}
                    className="p-6 border border-border rounded-lg hover:shadow-lg transition-shadow hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback>
                            {professor.nome.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{professor.nome}</h3>
                            <Badge variant={professor.ativo ? "default" : "secondary"}>
                              {professor.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium text-foreground">
                                {professor.avaliacao_media?.toFixed(1) || "0.0"}
                              </span>
                              {professor.total_aulas && (
                                <span className="text-xs text-muted-foreground">
                                  ({professor.total_aulas} aulas)
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span>{professor.email}</span>
                            </div>
                            
                            {professor.telefone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{professor.telefone}</span>
                              </div>
                            )}
                            
                            <div className="text-sm">
                              <span className="text-muted-foreground">Especialidades: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {professor.especialidades?.map((esp, index) => (
                                  <Badge key={index} variant="outline">{esp}</Badge>
                                ))}
                              </div>
                            </div>

                            {professor.valor_hora && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Valor/hora: </span>
                                <span className="font-medium text-foreground">
                                  R$ {professor.valor_hora.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Status: </span>
                              <span className={`font-medium ${professor.ativo ? 'text-green-600' : 'text-red-600'}`}>
                                {professor.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            
                            {professor.presenca_media !== undefined && (
                              <div>
                                <span className="text-muted-foreground">Presença média: </span>
                                <span className="font-medium text-foreground">
                                  {professor.presenca_media}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Ver Horários
                        </Button>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
