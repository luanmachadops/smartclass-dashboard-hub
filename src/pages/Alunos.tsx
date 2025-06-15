
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Mail, Phone, Users, GraduationCap, CalendarDays, Plus, MessageCircle } from "lucide-react"
import { useAlunos } from "@/hooks/useAlunos"
import { useState } from "react"

export default function Alunos() {
  const { alunos, loading } = useAlunos()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredAlunos = alunos.filter(aluno =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.turma.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const alunosAtivos = alunos.filter(a => a.ativo)
  const presencaMedia = alunos.length > 0 
    ? alunos.reduce((acc, aluno) => acc + aluno.presenca, 0) / alunos.length 
    : 0

  const estatisticas = [
    {
      titulo: "Total de Alunos",
      valor: alunos.length.toString(),
      icon: Users,
      cor: "text-blue-600",
      fundo: "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10",
      gradiente: "from-blue-400 to-blue-600"
    },
    {
      titulo: "Alunos Ativos", 
      valor: alunosAtivos.length.toString(),
      icon: GraduationCap,
      cor: "text-emerald-600",
      fundo: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10",
      gradiente: "from-emerald-400 to-emerald-600"
    },
    {
      titulo: "Presença Média",
      valor: `${presencaMedia.toFixed(1)}%`,
      icon: CalendarDays,
      cor: "text-amber-600", 
      fundo: "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10",
      gradiente: "from-amber-400 to-amber-600"
    }
  ]

  if (loading) {
    return (
      <DashboardLayout title="Gestão de Alunos">
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
          <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 border-white/20 shadow-xl">
            <CardContent className="p-6">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 border-white/20 shadow-xl">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-36 w-full" />
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
      <div className="space-y-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {estatisticas.map((stat, index) => (
            <Card key={index} className="group backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl ${stat.fundo} flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/30 group-hover:scale-110 transition-transform duration-300`}>
                    <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${stat.gradiente} flex items-center justify-center`}>
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.titulo}</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">{stat.valor}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Barra de Pesquisa e Botão Adicionar */}
        <div className="flex gap-4">
          <Card className="flex-1 backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="Pesquisar alunos por nome, email ou turma..."
                  className="pl-12 h-12 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border-white/30 focus:border-blue-400/50 focus:ring-blue-400/30 rounded-xl font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          <Button className="h-16 px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-xl hover:shadow-2xl border-0 rounded-xl font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 backdrop-blur-sm">
            <Plus className="h-5 w-5 mr-2" />
            Novo Aluno
          </Button>
        </div>

        {/* Lista de Alunos */}
        <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 border-white/20 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Todos os Alunos ({filteredAlunos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAlunos.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  {searchTerm ? "Nenhum aluno encontrado com esse termo de busca" : "Nenhum aluno cadastrado ainda"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlunos.map((aluno) => (
                  <div key={aluno.id} className="group p-6 backdrop-blur-sm bg-white/60 dark:bg-gray-700/60 rounded-2xl border border-white/30 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-5 flex-1">
                        <Avatar className="h-14 w-14 ring-2 ring-white/50 shadow-lg">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold text-lg">
                            {aluno.nome.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{aluno.nome}</h3>
                            <Badge 
                              variant={aluno.ativo ? "default" : "secondary"}
                              className={`${
                                aluno.ativo 
                                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0" 
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                              } px-3 py-1 rounded-full font-medium shadow-sm`}
                            >
                              {aluno.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30">
                              <CalendarDays className="h-4 w-4 text-amber-600" />
                              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{aluno.presenca}%</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {aluno.email && (
                              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                  <Mail className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="font-medium">{aluno.email}</span>
                              </div>
                            )}
                            
                            {aluno.telefone && (
                              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                                  <Phone className="h-4 w-4 text-emerald-600" />
                                </div>
                                <a 
                                  href={`https://wa.me/55${aluno.telefone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium hover:text-emerald-600 transition-colors"
                                >
                                  {aluno.telefone}
                                </a>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-3 text-sm">
                              <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                                <GraduationCap className="h-4 w-4 text-purple-600" />
                              </div>
                              <span className="font-semibold text-purple-700 dark:text-purple-400">{aluno.turma}</span>
                            </div>

                            <div className="text-sm">
                              <span className="text-gray-500">Matrícula: </span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {new Date(aluno.dataMatricula).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>

                          {aluno.responsavel && (
                            <div className="text-sm bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 backdrop-blur-sm">
                              <span className="text-gray-500">Responsável: </span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">{aluno.responsavel}</span>
                              {aluno.telefone_responsavel && (
                                <>
                                  <span className="text-gray-500 ml-4">Tel: </span>
                                  <a 
                                    href={`https://wa.me/55${aluno.telefone_responsavel.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                                  >
                                    {aluno.telefone_responsavel}
                                  </a>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {aluno.telefone && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl"
                            asChild
                          >
                            <a 
                              href={`https://wa.me/55${aluno.telefone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              WhatsApp
                            </a>
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl"
                        >
                          Ver Detalhes
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl"
                        >
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
