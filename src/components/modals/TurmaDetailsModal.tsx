
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  Users, 
  UserPlus, 
  Plus,
  MapPin,
  Phone,
  Mail,
  BookOpen,
  UserCheck
} from "lucide-react";
import { MatricularAlunoModal } from "./MatricularAlunoModal";
import { AdicionarProfessorTurmaModal } from "./AdicionarProfessorTurmaModal";
import { CriarAulaModal } from "./CriarAulaModal";
import { useAlunos } from "@/hooks/useAlunos";
import { useAulas } from "@/hooks/useAulas";
import { useProfessores } from "@/hooks/useProfessores";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface TurmaDetailsModalProps {
  turma: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TurmaDetailsModal({ turma, open, onOpenChange }: TurmaDetailsModalProps) {
  const [matricularModalOpen, setMatricularModalOpen] = useState(false);
  const [professorModalOpen, setProfessorModalOpen] = useState(false);
  const [aulaModalOpen, setAulaModalOpen] = useState(false);
  const [professoresDaTurma, setProfessoresDaTurma] = useState<any[]>([]);
  const [loadingProfessores, setLoadingProfessores] = useState(false);
  
  // Sempre chamar os hooks na mesma ordem, independentemente de turma existir
  const { alunos, loading: alunosLoading } = useAlunos();
  const { aulas, loading: aulasLoading, refetch: refetchAulas } = useAulas(turma?.id || '');
  const { professores } = useProfessores();

  // Calcular dados apenas se turma existir
  const alunosDaTurma = turma ? alunos.filter(aluno => aluno.turma_id === turma.id) : [];

  const fetchProfessoresDaTurma = async () => {
    if (!turma?.id) return;
    
    setLoadingProfessores(true);
    try {
      const { data, error } = await supabase
        .from('turma_professores')
        .select(`
          professor_id,
          professores (
            id,
            nome,
            email,
            telefone,
            especialidades
          )
        `)
        .eq('turma_id', turma.id);

      if (error) throw error;

      const professoresData = data?.map(tp => tp.professores).filter(Boolean) || [];
      setProfessoresDaTurma(professoresData);
    } catch (error) {
      console.error('Erro ao carregar professores da turma:', error);
      toast.error('Erro ao carregar professores da turma');
    } finally {
      setLoadingProfessores(false);
    }
  };

  const handleRemoverProfessor = async (professorId: string) => {
    try {
      const { error } = await supabase
        .from('turma_professores')
        .delete()
        .eq('turma_id', turma.id)
        .eq('professor_id', professorId);

      if (error) throw error;

      toast.success('Professor removido da turma com sucesso!');
      fetchProfessoresDaTurma();
    } catch (error) {
      console.error('Erro ao remover professor:', error);
      toast.error('Erro ao remover professor da turma');
    }
  };

  const handleRefreshData = () => {
    refetchAulas();
    fetchProfessoresDaTurma();
  };

  useEffect(() => {
    if (open && turma?.id) {
      fetchProfessoresDaTurma();
    }
  }, [open, turma?.id]);

  // Se não há turma, não renderizar o modal
  if (!turma) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {turma.nome}
              <Badge variant={turma.ativa ? "default" : "secondary"}>
                {turma.ativa ? "Ativa" : "Inativa"}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Instrumento:</span>
                  <span>{turma.instrumento}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Horário:</span>
                  <span>{turma.dia_semana} - {turma.horario_inicio} às {turma.horario_fim}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Alunos:</span>
                  <span>{alunosDaTurma.length}/{turma.vagas_total || 15}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="aulas" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="aulas">Aulas</TabsTrigger>
              <TabsTrigger value="alunos">Alunos</TabsTrigger>
              <TabsTrigger value="professores">Professores</TabsTrigger>
            </TabsList>

            <TabsContent value="aulas" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Cronograma de Aulas</h3>
                <Button onClick={() => setAulaModalOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Aula
                </Button>
              </div>
              
              {aulasLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando aulas...
                </div>
              ) : aulas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma aula agendada</p>
                  <Button onClick={() => setAulaModalOpen(true)} variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira aula
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {aulas.map((aula) => (
                    <Card key={aula.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(aula.data_aula), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </span>
                              <Badge variant={
                                aula.status === 'realizada' ? 'default' : 
                                aula.status === 'cancelada' ? 'destructive' : 'secondary'
                              }>
                                {aula.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{aula.horario_inicio} - {aula.horario_fim}</span>
                            </div>
                            {aula.professor && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Users className="h-4 w-4" />
                                <span>Professor: {aula.professor.nome}</span>
                              </div>
                            )}
                            {aula.observacoes && (
                              <p className="text-sm text-muted-foreground mt-2">{aula.observacoes}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="alunos" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Alunos Matriculados</h3>
                <Button onClick={() => setMatricularModalOpen(true)} size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Matricular Aluno
                </Button>
              </div>
              
              {alunosLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando alunos...
                </div>
              ) : alunosDaTurma.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum aluno matriculado</p>
                  <Button onClick={() => setMatricularModalOpen(true)} variant="outline" className="mt-4">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Matricular primeiro aluno
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {alunosDaTurma.map((aluno) => (
                    <Card key={aluno.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={aluno.foto_url} />
                            <AvatarFallback>{aluno.nome.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium">{aluno.nome}</h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {aluno.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3" />
                                  <span>{aluno.email}</span>
                                </div>
                              )}
                              {aluno.telefone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  <span>{aluno.telefone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {aluno.instrumento && (
                            <Badge variant="outline">{aluno.instrumento}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="professores" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Professores da Turma</h3>
                <Button onClick={() => setProfessorModalOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Professor
                </Button>
              </div>
              
              {loadingProfessores ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando professores...
                </div>
              ) : professoresDaTurma.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum professor adicionado</p>
                  <Button onClick={() => setProfessorModalOpen(true)} variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar primeiro professor
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {professoresDaTurma.map((professor) => (
                    <Card key={professor.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white font-semibold">
                                {professor.nome.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-medium">{professor.nome}</h4>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3" />
                                  <span>{professor.email}</span>
                                </div>
                                {professor.telefone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    <span>{professor.telefone}</span>
                                  </div>
                                )}
                              </div>
                              {professor.especialidades && professor.especialidades.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {professor.especialidades.slice(0, 3).map((esp: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {esp}
                                    </Badge>
                                  ))}
                                  {professor.especialidades.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{professor.especialidades.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoverProfessor(professor.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remover
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <MatricularAlunoModal
        open={matricularModalOpen}
        onOpenChange={setMatricularModalOpen}
        turmaId={turma?.id}
        onSuccess={handleRefreshData}
      />

      <AdicionarProfessorTurmaModal
        open={professorModalOpen}
        onOpenChange={setProfessorModalOpen}
        turmaId={turma?.id}
        onSuccess={handleRefreshData}
      />

      <CriarAulaModal
        open={aulaModalOpen}
        onOpenChange={setAulaModalOpen}
        turmaId={turma?.id}
        onSuccess={handleRefreshData}
      />
    </>
  );
}
