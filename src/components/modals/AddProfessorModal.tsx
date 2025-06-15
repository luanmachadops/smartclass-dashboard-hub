
import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddProfessorModalProps {
  trigger: React.ReactNode;
  onProfessorAdded?: () => void;
}

export function AddProfessorModal({ trigger, onProfessorAdded }: AddProfessorModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    valor_hora: ""
  });
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [novaEspecialidade, setNovaEspecialidade] = useState("");

  const adicionarEspecialidade = () => {
    if (novaEspecialidade.trim() && !especialidades.includes(novaEspecialidade.trim())) {
      setEspecialidades([...especialidades, novaEspecialidade.trim()]);
      setNovaEspecialidade("");
    }
  };

  const removerEspecialidade = (especialidade: string) => {
    setEspecialidades(especialidades.filter(e => e !== especialidade));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('professores')
        .insert([{
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone || null,
          especialidades: especialidades.length > 0 ? especialidades : null,
          valor_hora: formData.valor_hora ? parseFloat(formData.valor_hora) : null,
          ativo: true
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Professor adicionado com sucesso!');
      setOpen(false);
      setFormData({ nome: "", email: "", telefone: "", valor_hora: "" });
      setEspecialidades([]);
      onProfessorAdded?.();
    } catch (error) {
      console.error('Erro ao adicionar professor:', error);
      toast.error('Erro ao adicionar professor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Professor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="nome">Nome completo *</Label>
            <Input 
              id="nome" 
              value={formData.nome} 
              onChange={e => setFormData({...formData, nome: e.target.value})} 
              required 
              placeholder="Nome do professor" 
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input 
              id="email" 
              type="email"
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
              placeholder="email@exemplo.com" 
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input 
              id="telefone" 
              value={formData.telefone} 
              onChange={e => setFormData({...formData, telefone: e.target.value})} 
              placeholder="(11) 99999-9999" 
            />
          </div>

          <div>
            <Label htmlFor="valor_hora">Valor por hora (R$)</Label>
            <Input 
              id="valor_hora" 
              type="number" 
              step="0.01"
              value={formData.valor_hora} 
              onChange={e => setFormData({...formData, valor_hora: e.target.value})} 
              placeholder="50.00" 
            />
          </div>

          <div>
            <Label>Especialidades</Label>
            <div className="flex gap-2 mb-2">
              <Input 
                value={novaEspecialidade}
                onChange={(e) => setNovaEspecialidade(e.target.value)}
                placeholder="Piano, Violão, Bateria..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarEspecialidade())}
              />
              <Button type="button" onClick={adicionarEspecialidade} variant="outline">
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {especialidades.map((esp, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {esp}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removerEspecialidade(esp)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
