
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search, Mail, Phone, GraduationCap, TrendingUp, Calendar } from "lucide-react"

export default function Alunos() {
  const alunos = [
    {
      id: 1,
      nome: "Ana Silva",
      email: "ana.silva@email.com",
      telefone: "(11) 99999-9999",
      turma: "Piano Intermediário",
      presenca: 95,
      dataMatricula: "2024-01-15",
      status: "ativo"
    },
    {
      id: 2,
      nome: "Carlos Santos",
      email: "carlos.santos@email.com", 
      telefone: "(11) 88888-8888",
      turma: "Violão Iniciante",
      presenca: 88,
      dataMatricula: "2024-02-01",
      status: "ativo"
    },
    {
      id: 3,
      nome: "Maria Oliveira",
      email: "maria.oliveira@email.com",
      telefone: "(11) 77777-7777", 
      turma: "Canto Popular",
      presenca: 92,
      dataMatricula: "2024-01-20",
      status: "ativo"
    },
    {
      id: 4,
      nome: "João Costa",
      email: "joao.costa@email.com",
      telefone: "(11) 66666-6666",
      turma: "Bateria Avançado", 
      presenca: 100,
      dataMatricula: "2023-12-10",
      status: "ativo"
    },
    {
      id: 5,
      nome: "Paula Lima",
      email: "paula.lima@email.com",
      telefone: "(11) 55555-5555",
      turma: "Guitarra Rock",
      presenca: 75,
      dataMatricula: "2024-03-05",
      status: "inativo"
    }
  ]

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
      valor: alunos.filter(a => a.status === "ativo").length.toString(),
      icon: TrendingUp,
      cor: "text-green-600",
      fundo: "bg-green-100 dark:bg-green-900/50"
    },
    {
      titulo: "Presença Média",
      valor: `${Math.round(alunos.reduce((acc, a) => acc + a.presenca, 0) / alunos.length)}%`,
      icon: Calendar,
      cor: "text-purple-600", 
      fundo: "bg-purple-100 dark:bg-purple-900/50"
    }
  ]

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

        {/* Barra de Pesquisa */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar alunos por nome, email ou turma..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Alunos */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alunos.map((aluno) => (
                <div key={aluno.id} className="p-6 border border-border rounded-lg hover:bg-muted/50 transition-colors">
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
                          <Badge variant={aluno.status === "ativo" ? "default" : "secondary"}>
                            {aluno.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{aluno.email}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{aluno.telefone}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="h-4 w-4" />
                            <span>{aluno.turma}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">Presença: </span>
                            <span className={`font-medium ${
                              aluno.presenca >= 90 ? 'text-green-600' : 
                              aluno.presenca >= 75 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {aluno.presenca}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Matrícula: </span>
                            <span className="font-medium text-foreground">
                              {new Date(aluno.dataMatricula).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
