
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck } from "lucide-react";
import { useAlunos } from "@/hooks/useAlunos";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MatricularAlunoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turmaId: string;
  onSuccess: () => void;
}

export function MatricularAlunoModal({ open, onOpenChange, turmaId, onSuccess }: MatricularAlunoModalProps) {
  const { alunos } = useAlunos();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Filtrar alunos que não estão matriculados em nenhuma turma
  const alunosDisponiveis = alunos.filter(aluno => 
    !aluno.turma_id && 
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMatricularAluno = async (alunoId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("alunos")
        .update({ turma_id: turmaId })
        .eq("id", alunoId);
      
      if (error) throw error;
      
      toast.success("Aluno matriculado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao matricular aluno:', error);
      toast.error("Erro ao matricular aluno");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Matricular Aluno</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="search">Buscar aluno</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                placeholder="Digite o nome do aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {alunosDisponiveis.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno disponível para matrícula'}
              </div>
            ) : (
              alunosDisponiveis.map((aluno) => (
                <div key={aluno.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={aluno.foto_url} />
                      <AvatarFallback>{aluno.nome.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{aluno.nome}</p>
                      <p className="text-sm text-gray-500">{aluno.email}</p>
                      {aluno.instrumento && (
                        <Badge variant="outline" className="text-xs">
                          {aluno.instrumento}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleMatricularAluno(aluno.id)}
                    disabled={loading}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Matricular
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
