
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Calendar, Clock, BookOpen, Plus } from "lucide-react"

interface TurmaDetailsModalProps {
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
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TurmaDetailsModal({ turma, open, onOpenChange }: TurmaDetailsModalProps) {
  if (!turma) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-2xl">{turma.nome}</DialogTitle>
            <Badge variant={turma.ativa ? "default" : "secondary"}>
              {turma.ativa ? "Ativa" : "Pausada"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Instrumento</span>
              </div>
              <p className="text-lg font-semibold">{turma.instrumento}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Nível</span>
              </div>
              <p className="text-lg font-semibold">{turma.nivel}</p>
            </div>
          </div>

          <Separator />

          {/* Horário */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Horário das Aulas</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="font-medium">{turma.dia_semana}</span>
                <span className="text-muted-foreground">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {turma.horario_inicio} - {turma.horario_fim}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Professores */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Professores</span>
              </div>
            </div>
            
            {turma.professores && turma.professores.length > 0 ? (
              <div className="space-y-2">
                {turma.professores.map((professor, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {professor.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{professor}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">Nenhum professor atribuído</p>
            )}
          </div>

          <Separator />

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{turma.alunos || 0}</div>
              <div className="text-sm text-muted-foreground">Alunos Matriculados</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{turma.presenca || 0}%</div>
              <div className="text-sm text-muted-foreground">Presença Média</div>
            </div>
          </div>

          {/* Seção de Aulas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium">Aulas</span>
              </div>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Aula
              </Button>
            </div>
            
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma aula criada ainda</p>
              <p className="text-sm">Clique em "Criar Aula" para começar</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
