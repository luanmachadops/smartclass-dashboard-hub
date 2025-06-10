
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search, Mail, Phone, Users, Calendar, Star } from "lucide-react"

export default function Professores() {
  const professores = [
    {
      id: 1,
      nome: "Carlos Silva",
      email: "carlos.silva@escola.com",
      telefone: "(11) 99999-9999",
      especialidade: "Violão",
      turmas: 2,
      totalAlunos: 18,
      avaliacao: 4.8,
      dataContratacao: "2023-08-15",
      status: "ativo"
    },
    {
      id: 2,
      nome: "Ana Costa",
      email: "ana.costa@escola.com", 
      telefone: "(11) 88888-8888",
      especialidade: "Piano",
      turmas: 1,
      totalAlunos: 8,
      avaliacao: 4.9,
      dataContratacao: "2023-09-01",
      status: "ativo"
    },
    {
      id: 3,
      nome: "João Santos",
      email: "joao.santos@escola.com",
      telefone: "(11) 77777-7777", 
      especialidade: "Bateria",
      turmas: 1,
      totalAlunos: 6,
      avaliacao: 4.7,
      dataContratacao: "2024-01-10",
      status: "ativo"
    },
    {
      id: 4,
      nome: "Maria Oliveira",
      email: "maria.oliveira@escola.com",
      telefone: "(11) 66666-6666",
      especialidade: "Canto", 
      turmas: 1,
      totalAlunos: 10,
      avaliacao: 4.6,
      dataContratacao: "2023-07-20",
      status: "ativo"
    },
    {
      id: 5,
      nome: "Pedro Lima",
      email: "pedro.lima@escola.com",
      telefone: "(11) 55555-5555",
      especialidade: "Guitarra",
      turmas: 1,
      totalAlunos: 7,
      avaliacao: 4.5,
      dataContratacao: "2024-02-15",
      status: "licenca"
    }
  ]

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
      valor: professores.filter(p => p.status === "ativo").length.toString(),
      icon: Calendar,
      cor: "text-green-600",
      fundo: "bg-green-100 dark:bg-green-900/50"
    },
    {
      titulo: "Avaliação Média",
      valor: `${(professores.reduce((acc, p) => acc + p.avaliacao, 0) / professores.length).toFixed(1)}⭐`,
      icon: Star,
      cor: "text-yellow-600", 
      fundo: "bg-yellow-100 dark:bg-yellow-900/50"
    }
  ]

  return (
    <DashboardLayout title="Gestão de Professores">
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
                placeholder="Pesquisar professores por nome, especialidade ou email..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Professores */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Professores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {professores.map((professor) => (
                <div key={professor.id} className="p-6 border border-border rounded-lg hover:bg-muted/50 transition-colors">
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
                          <Badge variant={professor.status === "ativo" ? "default" : "secondary"}>
                            {professor.status === "ativo" ? "Ativo" : "Licença"}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium text-foreground">{professor.avaliacao}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{professor.email}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{professor.telefone}</span>
                          </div>
                          
                          <div className="text-sm">
                            <span className="text-muted-foreground">Especialidade: </span>
                            <Badge variant="outline">{professor.especialidade}</Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{professor.turmas} turmas • {professor.totalAlunos} alunos</span>
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="text-muted-foreground">Contratado em: </span>
                          <span className="font-medium text-foreground">
                            {new Date(professor.dataContratacao).toLocaleDateString('pt-BR')}
                          </span>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
