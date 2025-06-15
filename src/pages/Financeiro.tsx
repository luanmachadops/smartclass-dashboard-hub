import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Wallet, BarChart, FileText } from "lucide-react"
import { useState, useEffect } from 'react'

export default function Financeiro() {
  const [totalReceitas, setTotalReceitas] = useState(0)
  const [totalDespesas, setTotalDespesas] = useState(0)
  const [saldoAtual, setSaldoAtual] = useState(0)

  useEffect(() => {
    // Simulação de dados financeiros (substitua por dados reais)
    const receitas = 15000
    const despesas = 8000

    setTotalReceitas(receitas)
    setTotalDespesas(despesas)
    setSaldoAtual(receitas - despesas)
  }, [])

  return (
    <DashboardLayout title="Financeiro">
      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/** Exemplo de card de resumo financeiro */}
          <Card className="hover:shadow-xl hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <CardTitle>Receitas Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="rounded-full p-3 bg-green-100 text-green-600">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R$ {totalReceitas.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total de entradas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <CardTitle>Despesas Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="rounded-full p-3 bg-red-100 text-red-600">
                  <BarChart className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R$ {totalDespesas.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total de saídas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <CardTitle>Saldo Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="rounded-full p-3 bg-blue-100 text-blue-600">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R$ {saldoAtual.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Saldo disponível</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="hover:shadow-xl hover:scale-105 transition-transform duration-300">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="gap-2 w-full">
                <Wallet className="h-4 w-4" />
                Registrar Receita
              </Button>
              <Button className="gap-2 w-full">
                <BarChart className="h-4 w-4" />
                Registrar Despesa
              </Button>
              <Button className="gap-2 w-full">
                <Calendar className="h-4 w-4" />
                Agendar Pagamento
              </Button>
              <Button className="gap-2 w-full">
                <FileText className="h-4 w-4" />
                Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
