
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus } from "lucide-react";
import { useProfessores } from "@/hooks/useProfessores";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdicionarProfessorTurmaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turmaId: string;
  onSuccess: () => void;
}

export function AdicionarProfessorTurmaModal({ open, onOpenChange, turmaId, onSuccess }: AdicionarProfessorTurmaModalProps) {
  const { professores } = useProfessores();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const professoresFiltrados = professores.filter(professor =>
    professor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdicionarProfessor = async (professorId: string) => {
    try {
      setLoading(true);
      
      // Verificar se já existe a associação
      const { data: existing } = await supabase
        .from("turma_professores")
        .select("id")
        .eq("turma_id", turmaId)
        .eq("professor_id", professorId)
        .single();
      
      if (existing) {
        toast.error("Professor já está associado a esta turma");
        return;
      }
      
      const { error } = await supabase
        .from("turma_professores")
        .insert({
          turma_id: turmaId,
          professor_id: professorId
        });
      
      if (error) throw error;
      
      toast.success("Professor adicionado à turma com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao adicionar professor:', error);
      toast.error("Erro ao adicionar professor à turma");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Professor</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="search">Buscar professor</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                placeholder="Digite o nome do professor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {professoresFiltrados.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchTerm ? 'Nenhum professor encontrado' : 'Nenhum professor disponível'}
              </div>
            ) : (
              professoresFiltrados.map((professor) => (
                <div key={professor.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{professor.nome.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{professor.nome}</p>
                      <p className="text-sm text-gray-500">{professor.email}</p>
                      {professor.especialidades && professor.especialidades.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {professor.especialidades.slice(0, 2).map((esp, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {esp}
                            </Badge>
                          ))}
                          {professor.especialidades.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{professor.especialidades.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAdicionarProfessor(professor.id)}
                    disabled={loading}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Adicionar
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
