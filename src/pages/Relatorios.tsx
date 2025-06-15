import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Download, FileBarChart, Users, TrendingUp, Calendar } from "lucide-react"
import { useState } from "react"

// Dados de exemplo para os gráficos
const attendanceData = [
  { name: 'Jan', presenca: 85 },
  { name: 'Fev', presenca: 88 },
  { name: 'Mar', presenca: 92 },
  { name: 'Abr', presenca: 90 },
  { name: 'Mai', presenca: 85 },
  { name: 'Jun', presenca: 89 },
]

const instrumentData = [
  { name: 'Violão', value: 35 },
  { name: 'Piano', value: 25 },
  { name: 'Bateria', value: 20 },
  { name: 'Canto', value: 15 },
  { name: 'Outros', value: 5 },
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function Relatorios() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('6m')
  
  return (
    <DashboardLayout title="Relatórios">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Filtros e Controles */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Análise de Desempenho</h2>
            <p className="text-muted-foreground">Visualize métricas e tendências da escola</p>
          </div>
          
          <div className="flex gap-2">
            <Select defaultValue="6m" onValueChange={setPeriodoSelecionado}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Último mês</SelectItem>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
        
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-xl hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Alunos</p>
                  <p className="text-2xl font-bold">248</p>
                  <p className="text-xs text-green-600">+12% vs período anterior</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-xl hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Retenção</p>
                  <p className="text-2xl font-bold">92%</p>
                  <p className="text-xs text-green-600">+3% vs período anterior</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-xl hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média de Presença</p>
                  <p className="text-2xl font-bold">88%</p>
                  <p className="text-xs text-red-600">-2% vs período anterior</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-xl hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <FileBarChart className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Novas Matrículas</p>
                  <p className="text-2xl font-bold">32</p>
                  <p className="text-xs text-green-600">+8% vs período anterior</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Gráficos */}
        <Tabs defaultValue="presenca" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="presenca">Presença</TabsTrigger>
            <TabsTrigger value="instrumentos">Instrumentos</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
          </TabsList>
          
          <TabsContent value="presenca">
            <Card className="hover:shadow-xl hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <CardTitle>Taxa de Presença por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={attendanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Presença']} />
                      <Bar dataKey="presenca" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="instrumentos">
            <Card className="hover:shadow-xl hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <CardTitle>Distribuição de Alunos por Instrumento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={instrumentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {instrumentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Alunos']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="financeiro">
            <Card className="hover:shadow-xl hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <CardTitle>Relatório Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-60">
                  <p className="text-muted-foreground">Dados financeiros serão exibidos aqui</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="desempenho">
            <Card className="hover:shadow-xl hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <CardTitle>Desempenho dos Alunos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-60">
                  <p className="text-muted-foreground">Dados de desempenho serão exibidos aqui</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Relatórios Disponíveis */}
        <Card className="hover:shadow-xl hover:scale-105 transition-transform duration-300">
          <CardHeader>
            <CardTitle>Relatórios Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto py-4 px-4 justify-start gap-3">
                <Users className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Relatório de Alunos</p>
                  <p className="text-xs text-muted-foreground">Dados completos de todos os alunos</p>
                </div>
              </Button>
              
              <Button variant="outline" className="h-auto py-4 px-4 justify-start gap-3">
                <Calendar className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Relatório de Presença</p>
                  <p className="text-xs text-muted-foreground">Histórico de presença por turma</p>
                </div>
              </Button>
              
              <Button variant="outline" className="h-auto py-4 px-4 justify-start gap-3">
                <TrendingUp className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Relatório Financeiro</p>
                  <p className="text-xs text-muted-foreground">Receitas e despesas detalhadas</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
