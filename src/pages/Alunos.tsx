
import { DashboardLayout } from "@/components/DashboardLayout"
import { AlunoDetails } from "@/components/details/AlunoDetails"
import { AddAlunoModal } from "@/components/modals/AddAlunoModal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Mail, Phone, GraduationCap, TrendingUp, Calendar, Plus, MessageCircle } from "lucide-react"
import { useAlunos } from "@/hooks/useAlunos"
import { useState } from "react"

export default function Alunos() {
  const { alunos, loading } = useAlunos()
  const [searchTerm, setSearchTerm] = useState("")

  const handleWhatsApp = (telefone: string, nome: string) => {
    if (!telefone) return
    const phone = telefone.replace(/\D/g, '')
    const message = `Olá ${nome}! Como vai seus estudos de música?`
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleEmail = (email: string, nome: string) => {
    if (!email) return
    const subject = `Escola de Música - ${nome}`
    const body = `Olá ${nome},\n\nEsperamos que esteja bem!\n\nAtenciosamente,\nEscola de Música`
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  const filteredAlunos = alunos.filter(aluno =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.turma?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const alunosAtivos = alunos.filter(a => a.ativo)
  const presencaMedia = Math.round(Math.random() * 15 + 85) // Temporário até implementar presença real

  const estatisticas = [
    {
      titulo: "Total de Alunos",
      valor: alunos.length.toString(),
      icon: GraduationCap,
      cor: "text-blue-600",
      fundo: "bg-blue-100 dark:bg-blue-900/50"
    },
    {
      titulo: "Alunos Ativos", 
      valor: alunosAtivos.length.toString(),
      icon: TrendingUp,
      cor: "text-green-600",
      fundo: "bg-green-100 dark:bg-green-900/50"
    },
    {
      titulo: "Presença Média",
      valor: `${presencaMedia}%`,
      icon: Calendar,
      cor: "text-purple-600", 
      fundo: "bg-purple-100 dark:bg-purple-900/50"
    }
  ]

  if (loading) {
    return (
      <DashboardLayout title="Gestão de Alunos">
        <div className="space-y-6">
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
    <DashboardLayout title="Gestão de Alunos">
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {estatisticas.map((stat, index) => (
            <Card key={index}>
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
        <div className="flex gap-4">
          <Card className="flex-1">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar alunos por nome, email ou turma..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          <AddAlunoModal
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Aluno
              </Button>
            }
          />
        </div>

        {/* Lista de Alunos */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Alunos ({filteredAlunos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAlunos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum aluno encontrado com esse termo de busca" : "Nenhum aluno cadastrado ainda"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlunos.map((aluno) => (
                  <AlunoDetails
                    key={aluno.id}
                    aluno={{
                      ...aluno,
                      turma: aluno.turma?.nome || "Sem turma",
                      presenca: Math.floor(Math.random() * 20) + 80, // Temporário
                      dataMatricula: new Date().toISOString().split('T')[0] // Temporário
                    }}
                    trigger={
                      <div className="p-6 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback>
                                {aluno.nome.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-foreground">{aluno.nome}</h3>
                                <Badge variant={aluno.ativo ? "default" : "secondary"}>
                                  {aluno.ativo ? "Ativo" : "Inativo"}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                                {aluno.email && (
                                  <div 
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEmail(aluno.email!, aluno.nome)
                                    }}
                                  >
                                    <Mail className="h-4 w-4" />
                                    <span>{aluno.email}</span>
                                  </div>
                                )}
                                
                                {aluno.telefone && (
                                  <div 
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleWhatsApp(aluno.telefone!, aluno.nome)
                                    }}
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                    <span>{aluno.telefone}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <GraduationCap className="h-4 w-4" />
                                  <span>{aluno.turma?.nome || "Sem turma"}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-6 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Status: </span>
                                  <span className={`font-medium ${aluno.ativo ? 'text-green-600' : 'text-red-600'}`}>
                                    {aluno.ativo ? 'Ativo' : 'Inativo'}
                                  </span>
                                </div>
                                {aluno.responsavel && (
                                  <div>
                                    <span className="text-muted-foreground">Responsável: </span>
                                    <span className="font-medium text-foreground">{aluno.responsavel}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </div>
                        </div>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
