
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Calendar, Clock, BookOpen, Plus, UserPlus, CalendarPlus, GraduationCap } from "lucide-react"
import { useAlunos } from "@/hooks/useAlunos"
import { useProfessores } from "@/hooks/useProfessores"

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
    vagas_total?: number
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TurmaDetailsModal({ turma, open, onOpenChange }: TurmaDetailsModalProps) {
  const { alunos } = useAlunos()
  const { professores } = useProfessores()
  const [activeTab, setActiveTab] = useState("alunos")

  if (!turma) return null

  // Filtrar alunos da turma atual (simulação - em produção seria por turma_id)
  const alunosDaTurma = alunos.filter(aluno => 
    aluno.instrumento?.toLowerCase() === turma.instrumento.toLowerCase()
  ).slice(0, turma.alunos || 0)

  // Filtrar professores da turma atual
  const professoresDaTurma = professores.filter(prof => 
    prof.especialidades?.some(esp => 
      esp.toLowerCase().includes(turma.instrumento.toLowerCase())
    )
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">Instrumento</p>
                <p className="font-semibold">{turma.instrumento}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <GraduationCap className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground">Nível</p>
                <p className="font-semibold">{turma.nivel}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-muted-foreground">Horário</p>
                <p className="font-semibold">{turma.dia_semana}</p>
                <p className="text-sm text-muted-foreground">{turma.horario_inicio}-{turma.horario_fim}</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{turma.alunos || 0}</div>
                <div className="text-sm text-muted-foreground">Alunos Matriculados</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{turma.presenca || 0}%</div>
                <div className="text-sm text-muted-foreground">Presença Média</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{professoresDaTurma.length}</div>
                <div className="text-sm text-muted-foreground">Professores</div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Navegação por Tabs */}
          <div className="flex gap-2 border-b">
            <Button 
              variant={activeTab === "alunos" ? "default" : "ghost"}
              onClick={() => setActiveTab("alunos")}
              className="rounded-b-none"
            >
              <Users className="h-4 w-4 mr-2" />
              Alunos ({alunosDaTurma.length})
            </Button>
            <Button 
              variant={activeTab === "professores" ? "default" : "ghost"}
              onClick={() => setActiveTab("professores")}
              className="rounded-b-none"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Professores ({professoresDaTurma.length})
            </Button>
            <Button 
              variant={activeTab === "aulas" ? "default" : "ghost"}
              onClick={() => setActiveTab("aulas")}
              className="rounded-b-none"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Aulas
            </Button>
          </div>

          {/* Conteúdo das Tabs */}
          {activeTab === "alunos" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Alunos da Turma</h3>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Matricular Aluno
                </Button>
              </div>
              
              {alunosDaTurma.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alunosDaTurma.map((aluno) => (
                      <TableRow key={aluno.id}>
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {aluno.nome.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {aluno.nome}
                        </TableCell>
                        <TableCell>{aluno.email || '-'}</TableCell>
                        <TableCell>{aluno.telefone || '-'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Ver Detalhes</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhum aluno matriculado</p>
                    <Button className="mt-4">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Matricular Primeiro Aluno
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "professores" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Professores da Turma</h3>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Professor
                </Button>
              </div>
              
              {professoresDaTurma.length > 0 ? (
                <div className="grid gap-4">
                  {professoresDaTurma.map((professor) => (
                    <Card key={professor.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {professor.nome.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">{professor.nome}</h4>
                            <p className="text-sm text-muted-foreground">{professor.email}</p>
                            <div className="flex gap-1 mt-1">
                              {professor.especialidades?.map((esp, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {esp}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">⭐ {professor.avaliacao_media?.toFixed(1)}</div>
                            <div className="text-xs text-muted-foreground">{professor.total_aulas} aulas</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhum professor atribuído</p>
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Professor
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "aulas" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Cronograma de Aulas</h3>
                <Button size="sm">
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Criar Aula
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhuma aula agendada</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie o primeiro cronograma de aulas para esta turma
                  </p>
                  <Button>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Criar Primeira Aula
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
