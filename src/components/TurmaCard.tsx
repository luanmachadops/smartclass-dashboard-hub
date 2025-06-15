
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ChamadaModal } from "@/components/modals/ChamadaModal"
import { Edit, Trash2, Users, Clock, Calendar, Eye, UserCheck } from "lucide-react"

interface TurmaCardProps {
  turma: {
    id: string
    nome: string
    instrumento: string
    nivel: string
    dia_semana: string
    horario_inicio: string
    horario_fim: string
    ativa: boolean
    professores?: string[]
    alunos?: number
    presenca?: number
  }
  onDelete: (id: string) => void
  onViewDetails: (turma: any) => void
}

export function TurmaCard({ turma, onDelete, onViewDetails }: TurmaCardProps) {
  const getPresencaColor = (presenca: number) => {
    if (presenca >= 90) return "text-green-600"
    if (presenca >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  const getPresencaBadgeVariant = (presenca: number) => {
    if (presenca >= 90) return "default"
    if (presenca >= 75) return "secondary"
    return "destructive"
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-foreground group-hover:text-blue-600 transition-colors">
                {turma.nome}
              </h3>
              <Badge variant={turma.ativa ? "default" : "secondary"} className="text-xs">
                {turma.ativa ? "ativa" : "pausada"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span className="font-medium">{turma.instrumento}</span>
              <span>•</span>
              <span>{turma.nivel}</span>
            </div>
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                    onClick={() => onViewDetails(turma)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver detalhes</TooltipContent>
              </Tooltip>

              <ChamadaModal
                trigger={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Fazer chamada</TooltipContent>
                  </Tooltip>
                }
                turma={{
                  nome: turma.nome,
                  horario: `${turma.horario_inicio} - ${turma.horario_fim}`,
                  dia: turma.dia_semana,
                  professores: turma.professores || []
                }}
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar turma</TooltipContent>
              </Tooltip>

              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Excluir turma</TooltipContent>
                </Tooltip>
                
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Turma</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir a turma "{turma.nome}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(turma.id)}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {turma.professores?.slice(0, 2).map((professor, index) => (
                <Avatar key={index} className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {professor.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
              {(turma.professores?.length || 0) > 2 && (
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="text-xs bg-gray-400 text-white">
                    +{(turma.professores?.length || 0) - 2}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Professor{(turma.professores?.length || 0) > 1 ? 'es' : ''}</p>
              <p className="text-sm font-medium truncate max-w-32">
                {turma.professores?.join(", ") || "Sem professor"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alunos</p>
              <p className="text-sm font-medium">{turma.alunos || 0}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Horário</p>
              <p className="text-sm font-medium">{turma.dia_semana}</p>
              <p className="text-xs text-muted-foreground">{turma.horario_inicio} - {turma.horario_fim}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Presença média</span>
            <div className="flex items-center gap-2">
              <Badge 
                variant={getPresencaBadgeVariant(turma.presenca || 0)}
                className="text-xs"
              >
                {turma.presenca || 0}%
              </Badge>
            </div>
          </div>
          <Progress 
            value={turma.presenca || 0} 
            className="h-2" 
          />
        </div>
      </CardContent>
    </Card>
  )
}
