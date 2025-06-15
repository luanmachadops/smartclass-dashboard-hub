
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock } from "lucide-react";
import { useProfessores } from "@/hooks/useProfessores";
import { useAulas } from "@/hooks/useAulas";

interface CriarAulaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turmaId: string;
  onSuccess: () => void;
}

export function CriarAulaModal({ open, onOpenChange, turmaId, onSuccess }: CriarAulaModalProps) {
  const { professores } = useProfessores();
  const { createAula } = useAulas();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    professor_id: "",
    data_aula: "",
    horario_inicio: "",
    horario_fim: "",
    observacoes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.professor_id || !formData.data_aula || !formData.horario_inicio || !formData.horario_fim) {
      return;
    }
    
    setLoading(true);
    
    const result = await createAula({
      turma_id: turmaId,
      professor_id: formData.professor_id,
      data_aula: formData.data_aula,
      horario_inicio: formData.horario_inicio,
      horario_fim: formData.horario_fim,
      observacoes: formData.observacoes || undefined
    });
    
    setLoading(false);
    
    if (result.success) {
      setFormData({
        professor_id: "",
        data_aula: "",
        horario_inicio: "",
        horario_fim: "",
        observacoes: ""
      });
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Aula</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="professor">Professor *</Label>
            <Select value={formData.professor_id} onValueChange={(value) => setFormData(prev => ({ ...prev, professor_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um professor" />
              </SelectTrigger>
              <SelectContent>
                {professores.map((professor) => (
                  <SelectItem key={professor.id} value={professor.id}>
                    {professor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="data_aula">Data da Aula *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="data_aula"
                type="date"
                value={formData.data_aula}
                onChange={(e) => setFormData(prev => ({ ...prev, data_aula: e.target.value }))}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="horario_inicio">Início *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="horario_inicio"
                  type="time"
                  value={formData.horario_inicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, horario_inicio: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="horario_fim">Fim *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="horario_fim"
                  type="time"
                  value={formData.horario_fim}
                  onChange={(e) => setFormData(prev => ({ ...prev, horario_fim: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações sobre a aula..."
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Aula"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
