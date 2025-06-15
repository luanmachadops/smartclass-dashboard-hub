
import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useAlunos } from "@/hooks/useAlunos";
import { useTurmas } from "@/hooks/useTurmas";

interface AddAlunoModalProps {
  trigger: React.ReactNode;
}

export function AddAlunoModal({ trigger }: AddAlunoModalProps) {
  const { createAluno } = useAlunos();
  const { turmas } = useTurmas();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [turma, setTurma] = useState("");
  const [instrumento, setInstrumento] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await createAluno({
      nome,
      email,
      telefone,
      turma,
      instrumento,
    });
    setLoading(false);
    handleClose();
  };

  function handleClose() {
    setOpen(false);
    // Reset states for next open
    setTimeout(() => {
      setNome("");
      setEmail("");
      setTelefone("");
      setTurma("");
      setInstrumento("");
      setLoading(false);
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Novo Aluno</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="Nome completo"
            />
          </div>
          <div>
            <Label htmlFor="instrumento">Instrumento</Label>
            <Input
              id="instrumento"
              value={instrumento}
              onChange={e => setInstrumento(e.target.value)}
              placeholder="Instrumento do aluno"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <Label htmlFor="turma">Turma</Label>
            <Select value={turma} onValueChange={setTurma}>
              <SelectTrigger id="turma">
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.filter(t => t.ativa).map(t => (
                  <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading} className="rounded-xl">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
