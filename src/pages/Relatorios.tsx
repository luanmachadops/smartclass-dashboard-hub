
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar, 
  Users, 
  GraduationCap,
  FileText
} from "lucide-react"

export default function Relatorios() {
  const estatisticasGerais = [
    {
      titulo: "Frequência Geral",
      valor: "89%",
      mudanca: "+2.5%",
      tendencia: "up",
      icon: TrendingUp,
      cor: "text-green-600",
      fundo: "bg-green-100 dark:bg-green-900/50"
    },
    {
      titulo: "Novos Alunos",
      valor: "18",
      mudanca: "+12.3%", 
      tendencia: "up",
      icon: GraduationCap,
      cor: "text-blue-600",
      fundo: "bg-blue-100 dark:bg-blue-900/50"
    },
    {
      titulo: "Taxa de Evasão",
      valor: "5.2%",
      mudanca: "-1.8%",
      tendencia: "down", 
      icon: TrendingDown,
      cor: "text-red-600",
      fundo: "bg-red-100 dark:bg-red-900/50"
    },
    {
      titulo: "Turmas Ativas",
      valor: "12",
      mudanca: "+2",
      tendencia: "up",
      icon: Users,
      cor: "text-purple-600",
      fundo: "bg-purple-100 dark:bg-purple-900/50"
    }
  ]

  const frequenciaTurmas = [
    { nome: "Violão Iniciante", presenca: 92, alunos: 12 },
    { nome: "Piano Intermediário", presenca: 88, alunos: 8 },
    { nome: "Bateria Avançado", presenca: 100, alunos: 6 },
    { nome: "Canto Popular", presenca: 80, alunos: 10 },
    { nome: "Guitarra Rock", presenca: 85, alunos: 7 }
  ]

  const professoresPerformance = [
    { nome: "João Santos", turmas: 1, presencaMedia: 100, avaliacao: 4.9 },
    { nome: "Carlos Silva", turmas: 2, presencaMedia: 92, avaliacao: 4.8 },
    { nome: "Ana Costa", turmas: 1, presencaMedia: 88, avaliacao: 4.9 },
    { nome: "Pedro Lima", turmas: 1, presencaMedia: 85, avaliacao: 4.5 },
    { nome: "Maria Oliveira", turmas: 1, presencaMedia: 80, avaliacao: 4.6 }
  ]

  const relatoriosDisponiveis = [
    {
      titulo: "Relatório de Frequência Mensal",
      descricao: "Análise detalhada da presença por turma e aluno",
      periodo: "Dezembro 2024",
      formato: "PDF"
    },
    {
      titulo: "Relatório de Performance dos Professores",
      descricao: "Avaliação e estatísticas dos educadores",
      periodo: "Semestre 2/2024", 
      formato: "Excel"
    },
    {
      titulo: "Relatório Financeiro",
      descricao: "Receitas, gastos e análise de inadimplência",
      periodo: "Ano 2024",
      formato: "PDF"
    },
    {
      titulo: "Relatório de Satisfação",
      descricao: "Pesquisa de satisfação com alunos e responsáveis",
      periodo: "Dezembro 2024",
      formato: "PDF"
    }
  ]

  return (
    <DashboardLayout title="Relatórios e Análises">
      <div className="space-y-6">
        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {estatisticasGerais.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${stat.fundo} flex items-center justify-center`}>
                      <stat.icon className={`h-5 w-5 ${stat.cor}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.titulo}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.valor}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${
                    stat.tendencia === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.mudanca}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Frequência por Turma */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Frequência por Turma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {frequenciaTurmas.map((turma, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">{turma.nome}</span>
                      <span className="text-muted-foreground">{turma.presenca}% • {turma.alunos} alunos</span>
                    </div>
                    <Progress value={turma.presenca} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance dos Professores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Performance dos Professores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {professoresPerformance.map((professor, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-foreground">{professor.nome}</h4>
                      <Badge variant="outline">⭐ {professor.avaliacao}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {professor.turmas} turma(s) • Presença média: {professor.presencaMedia}%
                    </div>
                    <Progress value={professor.presencaMedia} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Relatórios Disponíveis para Download */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatórios Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatoriosDisponiveis.map((relatorio, index) => (
                <div key={index} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-foreground">{relatorio.titulo}</h4>
                    <Badge variant="secondary">{relatorio.formato}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{relatorio.descricao}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{relatorio.periodo}</span>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Baixar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Gerar Novo Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <BarChart3 className="h-6 w-6" />
                <span>Frequência</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>Professores</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <GraduationCap className="h-6 w-6" />
                <span>Alunos</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>Financeiro</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
