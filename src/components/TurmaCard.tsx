
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Edit, Trash2, Users, Calendar, MapPin, Clock } from "lucide-react"

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
    vagas_total?: number
    vagas_ocupadas?: number
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

  // Calcular taxa de ocupação real
  const taxaOcupacao = turma.vagas_total > 0 
    ? Math.round(((turma.alunos || 0) / turma.vagas_total) * 100)
    : 0

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer w-full max-w-sm mx-auto"
      onClick={() => onViewDetails(turma)}
    >
      <CardContent className="p-4">
        {/* Header com nome e ações */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors truncate">
              {turma.nome}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={turma.ativa ? "default" : "secondary"} className="text-xs">
                {turma.ativa ? "Ativa" : "Pausada"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {turma.nivel}
              </Badge>
            </div>
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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

        {/* Informações do instrumento */}
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium truncate">{turma.instrumento}</span>
        </div>

        {/* Professor */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex -space-x-1">
            {turma.professores?.slice(0, 2).map((professor, index) => (
              <Avatar key={index} className="h-7 w-7 border-2 border-background">
                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {professor.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            ))}
            {(turma.professores?.length || 0) > 2 && (
              <Avatar className="h-7 w-7 border-2 border-background">
                <AvatarFallback className="text-xs bg-gray-400 text-white">
                  +{(turma.professores?.length || 0) - 2}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Professor</p>
            <p className="text-sm font-medium truncate">
              {turma.professores?.join(", ") || "Sem professor"}
            </p>
          </div>
        </div>
        
        {/* Informações em grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground">Alunos</p>
            <p className="text-sm font-bold">{turma.alunos || 0}/{turma.vagas_total || 0}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground">Horário</p>
            <p className="text-xs font-medium">{turma.dia_semana}</p>
            <p className="text-xs text-muted-foreground">{turma.horario_inicio}-{turma.horario_fim}</p>
          </div>
        </div>

        {/* Taxa de Ocupação */}
        <div className="space-y-2 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Taxa de ocupação</span>
            <Badge 
              variant={taxaOcupacao >= 80 ? "default" : taxaOcupacao >= 50 ? "secondary" : "outline"}
              className="text-xs"
            >
              {taxaOcupacao}%
            </Badge>
          </div>
          <Progress 
            value={taxaOcupacao} 
            className="h-2"
          />
        </div>

        {/* Presença */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Presença média</span>
            <Badge 
              variant={getPresencaBadgeVariant(turma.presenca || 0)}
              className="text-xs"
            >
              {turma.presenca || 0}%
            </Badge>
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
