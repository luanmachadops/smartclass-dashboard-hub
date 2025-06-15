
import { DashboardLayout } from "@/components/DashboardLayout"
import { AddTurmaModal } from "@/components/modals/AddTurmaModal"
import { ChamadaModal } from "@/components/modals/ChamadaModal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Edit, Trash2, Users, Clock, Calendar, Plus, Eye } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useTurmas } from "@/hooks/useTurmas"
import { Skeleton } from "@/components/ui/skeleton"

export default function Turmas() {
  const { turmas, loading, deleteTurma } = useTurmas()

  const handleViewDetails = (turma: any) => {
    console.log("Ver detalhes da turma:", turma)
  }

  if (loading) {
    return (
      <DashboardLayout title="Gestão de Turmas">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Gestão de Turmas">
      <div className="space-y-6">
        {/* Header com estatísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Turmas</p>
                  <p className="text-2xl font-bold text-foreground">{turmas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Turmas Ativas</p>
                  <p className="text-2xl font-bold text-foreground">
                    {turmas.filter(t => t.ativa).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média de Presença</p>
                  <p className="text-2xl font-bold text-foreground">
                    {turmas.length > 0 ? Math.round(turmas.reduce((acc, t) => acc + (t.presenca || 0), 0) / turmas.length) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botão Adicionar Turma */}
        <div className="flex justify-end">
          <AddTurmaModal
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Turma
              </Button>
            }
          />
        </div>

        {/* Lista de Turmas */}
        <Card>
          <CardHeader>
            <CardTitle>Todas as Turmas</CardTitle>
          </CardHeader>
          <CardContent>
            {turmas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma turma encontrada</p>
                <p className="text-sm text-muted-foreground mt-2">Comece criando sua primeira turma</p>
              </div>
            ) : (
              <div className="space-y-4">
                {turmas.map((turma) => (
                  <div 
                    key={turma.id} 
                    className="p-6 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(turma)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{turma.nome}</h3>
                          <Badge variant={turma.ativa ? "default" : "secondary"}>
                            {turma.ativa ? "ativa" : "pausada"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex -space-x-1">
                              {turma.professores?.map((professor, index) => (
                                <Avatar key={index} className="h-6 w-6 border-2 border-background">
                                  <AvatarFallback className="text-xs">
                                    {professor.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <span>{turma.professores?.join(", ") || "Sem professor"}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{turma.alunos} alunos</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{turma.horario_inicio} - {turma.horario_fim}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{turma.dia_semana}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Presença média</span>
                            <span className="font-medium text-foreground">{turma.presenca || 0}%</span>
                          </div>
                          <Progress value={turma.presenca || 0} className="h-2" />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                        <ChamadaModal
                          trigger={
                            <Button variant="outline" size="sm">
                              Chamada
                            </Button>
                          }
                          turma={{
                            nome: turma.nome,
                            horario: `${turma.horario_inicio} - ${turma.horario_fim}`,
                            dia: turma.dia_semana,
                            professores: turma.professores || []
                          }}
                        />
                        <Button variant="outline" size="sm" className="gap-2">
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Turma</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a turma "{turma.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTurma(turma.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
