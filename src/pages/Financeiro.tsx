import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
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
import { useFinanceiro } from "@/hooks/useFinanceiro"
import { useTurmas } from "@/hooks/useTurmas"

export default function Financeiro() {
  const { financeiro, loading: loadingFinanceiro } = useFinanceiro()
  const { turmas, loading: loadingTurmas } = useTurmas()

  // Calcular estatísticas baseadas nos dados reais
  const receitaTotal = financeiro
    .filter(item => item.tipo === 'receita' && item.status === 'pago')
    .reduce((total, item) => total + Number(item.valor), 0)

  const mensalidadesPagas = financeiro.filter(item => 
    item.categoria === 'mensalidade' && item.status === 'pago'
  ).length

  const mensalidadesTotal = financeiro.filter(item => 
    item.categoria === 'mensalidade'
  ).length

  const percentualPago = mensalidadesTotal > 0 ? 
    Math.round((mensalidadesPagas / mensalidadesTotal) * 100) : 0

  const mensalidadesPendentes = financeiro.filter(item => 
    item.categoria === 'mensalidade' && item.status !== 'pago'
  )

  const estatisticasFinanceiras = [
    {
      titulo: "Receita Mensal",
      valor: `R$ ${receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      mudanca: "+8.2%",
      tendencia: "up",
      icon: DollarSign,
      cor: "text-green-600",
      fundo: "bg-green-100 dark:bg-green-900/50"
    },
    {
      titulo: "Mensalidades Pagas",
      valor: `${percentualPago}%`,
      mudanca: "+2.1%",
      tendencia: "up",
      icon: CheckCircle,
      cor: "text-blue-600",
      fundo: "bg-blue-100 dark:bg-blue-900/50"
    },
    {
      titulo: "Inadimplência",
      valor: `${100 - percentualPago}%`,
      mudanca: "-1.5%",
      tendencia: "down",
      icon: AlertTriangle,
      cor: "text-red-600",
      fundo: "bg-red-100 dark:bg-red-900/50"
    },
    {
      titulo: "Mensalidades Pendentes",
      valor: mensalidadesPendentes.length.toString(),
      mudanca: "-3",
      tendencia: "down",
      icon: Clock,
      cor: "text-orange-600",
      fundo: "bg-orange-100 dark:bg-orange-900/50"
    }
  ]

  // Calcular receita por turma
  const receitaPorTurma = turmas.map(turma => {
    const alunosCount = turma.alunos || 0
    const valorMensal = turma.valor_mensal || 150
    const receita = alunosCount * valorMensal
    const percentual = receitaTotal > 0 ? Math.round((receita / receitaTotal) * 100) : 0

    return {
      turma: turma.nome,
      alunos: alunosCount,
      receita,
      percentual: Math.min(percentual, 100)
    }
  })

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

  const getDiasAtraso = (dataVencimento: string) => {
    const hoje = new Date()
    const vencimento = new Date(dataVencimento)
    const diffTime = hoje.getTime() - vencimento.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  if (loadingFinanceiro || loadingTurmas) {
    return (
      <DashboardLayout title="Gestão Financeira">
        <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Gestão Financeira">
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8">
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
                  Mensalidades Pendentes ({mensalidadesPendentes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mensalidadesPendentes.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">Todas as mensalidades estão em dia!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mensalidadesPendentes.slice(0, 5).map((mensalidade) => {
                      const diasAtraso = getDiasAtraso(mensalidade.data_vencimento)
                      const status = diasAtraso > 30 ? 'critico' : diasAtraso > 0 ? 'atrasado' : 'pendente'
                      
                      return (
                        <div key={mensalidade.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-medium">{mensalidade.aluno?.nome || 'Aluno não identificado'}</h4>
                              <Badge variant={getStatusBadge(status)}>
                                {status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{mensalidade.descricao}</p>
                            {diasAtraso > 0 && (
                              <p className={`text-sm font-medium ${getStatusColor(status)}`}>
                                {diasAtraso} dias de atraso
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">R$ {Number(mensalidade.valor).toFixed(2)}</p>
                            <Button size="sm" variant="outline">
                              Cobrar
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
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
                {receitaPorTurma.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma turma cadastrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receitaPorTurma.map((turma, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{turma.turma}</span>
                          <span className="text-muted-foreground">R$ {turma.receita.toLocaleString('pt-BR')}</span>
                        </div>
                        <Progress value={turma.percentual} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {turma.alunos} alunos
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
      </div>
    </DashboardLayout>
  )
}
