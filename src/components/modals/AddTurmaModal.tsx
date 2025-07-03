import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTurmas } from "@/hooks/useTurmas";
import { toast } from "sonner";

interface AddTurmaModalProps {
  trigger: React.ReactNode;
}

export function AddTurmaModal({ trigger }: AddTurmaModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addTurma } = useTurmas();

  const [formData, setFormData] = useState({
    nome: "",
    instrumento: "",
    nivel: "",
    dia_semana: "",
    horario_inicio: "",
    horario_fim: "",
    vagas_total: "10",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Passa os dados para o hook, que é responsável pela validação e formatação.
      // Apenas converte 'vagas_total' para o tipo numérico esperado.
      const result = await addTurma({
        ...formData,
        vagas_total: formData.vagas_total ? parseInt(formData.vagas_total, 10) : undefined,
      });

      if (result.success) {
        handleClose(); // O hook já exibe a notificação de sucesso.
      }
      // O hook também já exibe a notificação de erro.
    } catch (error) {
      console.error('Erro ao criar turma:', error);
      toast.error("Ocorreu um erro inesperado ao criar a turma.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form state
    setTimeout(() => {
        setFormData({
            nome: "",
            instrumento: "",
            nivel: "",
            dia_semana: "",
            horario_inicio: "",
            horario_fim: "",
            vagas_total: "10",
        });
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Turma</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2">
            <Label htmlFor="nome">Nome da Turma *</Label>
            <Input id="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Iniciação ao Violão" required />
          </div>
          <div>
            <Label htmlFor="instrumento">Instrumento</Label>
            <Input id="instrumento" value={formData.instrumento} onChange={handleChange} placeholder="Violão" />
          </div>
          <div>
            <Label htmlFor="nivel">Nível</Label>
            <Select value={formData.nivel} onValueChange={(value) => handleSelectChange("nivel", value)}>
                <SelectTrigger><SelectValue placeholder="Selecione o nível" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Iniciante">Iniciante</SelectItem>
                    <SelectItem value="Intermediário">Intermediário</SelectItem>
                    <SelectItem value="Avançado">Avançado</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dia_semana">Dia da Semana</Label>
             <Select value={formData.dia_semana} onValueChange={(value) => handleSelectChange("dia_semana", value)}>
                <SelectTrigger><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Segunda-feira">Segunda-feira</SelectItem>
                    <SelectItem value="Terça-feira">Terça-feira</SelectItem>
                    <SelectItem value="Quarta-feira">Quarta-feira</SelectItem>
                    <SelectItem value="Quinta-feira">Quinta-feira</SelectItem>
                    <SelectItem value="Sexta-feira">Sexta-feira</SelectItem>
                    <SelectItem value="Sábado">Sábado</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="vagas_total">Vagas</Label>
            <Input id="vagas_total" type="number" value={formData.vagas_total} onChange={handleChange} placeholder="10" />
          </div>
          <div>
            <Label htmlFor="horario_inicio">Horário de Início</Label>
            <Input id="horario_inicio" type="time" value={formData.horario_inicio} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="horario_fim">Horário de Fim</Label>
            <Input id="horario_fim" type="time" value={formData.horario_fim} onChange={handleChange} />
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-4">
            <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Turma"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
