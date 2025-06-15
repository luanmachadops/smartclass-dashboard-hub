
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"

export default function Financeiro() {
  const estatisticasFinanceiras = [
    {
      titulo: "Receita Mensal",
      valor: "R$ 12.450",
      mudanca: "+8.2%",
      tendencia: "up",
      icon: DollarSign,
      cor: "text-green-600",
      fundo: "bg-green-100 dark:bg-green-900/50"
    },
    {
      titulo: "Mensalidades Pagas",
      valor: "89%",
      mudanca: "+2.1%",
      tendencia: "up",
      icon: CheckCircle,
      cor: "text-blue-600",
      fundo: "bg-blue-100 dark:bg-blue-900/50"
    },
    {
      titulo: "Inadimplência",
      valor: "11%",
      mudanca: "-1.5%",
      tendencia: "down",
      icon: AlertTriangle,
      cor: "text-red-600",
      fundo: "bg-red-100 dark:bg-red-900/50"
    },
    {
      titulo: "Mensalidades Pendentes",
      valor: "14",
      mudanca: "-3",
      tendencia: "down",
      icon: Clock,
      cor: "text-orange-600",
      fundo: "bg-orange-100 dark:bg-orange-900/50"
    }
  ]

  const mensalidadesPendentes = [
    { aluno: "Ana Silva", turma: "Piano Intermediário", valor: 180, diasAtraso: 5, status: "atrasado" },
    { aluno: "Carlos Santos", turma: "Violão Iniciante", valor: 150, diasAtraso: 12, status: "atrasado" },
    { aluno: "Maria Oliveira", turma: "Canto Popular", valor: 200, diasAtraso: 2, status: "pendente" },
    { aluno: "João Costa", turma: "Bateria Avançado", valor: 220, diasAtraso: 8, status: "atrasado" },
    { aluno: "Paula Lima", turma: "Guitarra Rock", valor: 190, diasAtraso: 15, status: "critico" }
  ]

  const receitaPorTurma = [
    { turma: "Piano Intermediário", alunos: 8, receita: 1440, percentual: 23 },
    { turma: "Violão Iniciante", alunos: 12, receita: 1800, percentual: 29 },
    { turma: "Bateria Avançado", alunos: 6, receita: 1320, percentual: 21 },
    { turma: "Canto Popular", alunos: 10, receita: 2000, percentual: 32 },
    { turma: "Guitarra Rock", alunos: 7, receita: 1330, percentual: 21 }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "atrasado": return "text-orange-600"
      case "critico": return "text-red-600"
      case "pendente": return "text-yellow-600"
      default: return "text-muted-foreground"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "atrasado": return "destructive"
      case "critico": return "destructive"
      case "pendente": return "secondary"
      default: return "outline"
    }
  }

  return (
    <DashboardLayout title="Gestão Financeira">
      <div className="space-y-6">
        {/* Estatísticas Financeiras */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {estatisticasFinanceiras.map((stat, index) => (
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mensalidades Pendentes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Mensalidades Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mensalidadesPendentes.map((mensalidade, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium">{mensalidade.aluno}</h4>
                        <Badge variant={getStatusBadge(mensalidade.status)}>
                          {mensalidade.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{mensalidade.turma}</p>
                      <p className={`text-sm font-medium ${getStatusColor(mensalidade.status)}`}>
                        {mensalidade.diasAtraso} dias de atraso
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">R$ {mensalidade.valor}</p>
                      <Button size="sm" variant="outline">
                        Cobrar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Receita por Turma */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Receita por Turma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {receitaPorTurma.map((turma, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{turma.turma}</span>
                      <span className="text-muted-foreground">R$ {turma.receita}</span>
                    </div>
                    <Progress value={turma.percentual} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {turma.alunos} alunos
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas Financeiras */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Financeiras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <DollarSign className="h-6 w-6" />
                <span>Nova Cobrança</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span>Relatório Mensal</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <CreditCard className="h-6 w-6" />
                <span>Registrar Pagamento</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>Análise Anual</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
