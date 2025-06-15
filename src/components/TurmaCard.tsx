
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Edit, Trash2, Users, Clock, Calendar } from "lucide-react"

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
    <Card 
      className="group hover:shadow-xl transition-all duration-300 hover:ring-2 hover:ring-offset-2 hover:ring-offset-background hover:ring-blue-500 cursor-pointer w-full"
      onClick={() => onViewDetails(turma)}
    >
      <CardContent className="p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h3 className="text-xl font-bold text-foreground group-hover:text-blue-600 transition-colors truncate">
                {turma.nome}
              </h3>
              <Badge variant={turma.ativa ? "default" : "secondary"} className="text-xs w-fit">
                {turma.ativa ? "ativa" : "pausada"}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-3">
              <span className="font-medium">{turma.instrumento}</span>
              <span className="hidden sm:inline">•</span>
              <span>{turma.nivel}</span>
            </div>
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600 transition-colors"
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
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Professor{(turma.professores?.length || 0) > 1 ? 'es' : ''}</p>
              <p className="text-sm font-medium truncate">
                {turma.professores?.join(", ") || "Sem professor"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alunos</p>
              <p className="text-sm font-medium">{turma.alunos || 0}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Horário</p>
              <p className="text-sm font-medium truncate">{turma.dia_semana}</p>
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
