
import { useState, useRef } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useAlunos } from "@/hooks/useAlunos";
import { useTurmas } from "@/hooks/useTurmas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let foto_url = "";

    // Upload da foto, se houve arquivo selecionado
    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop();
      const fileName = `${nome.replace(/\s/g, "_").toLowerCase()}_${Date.now()}.${ext}`;
      const { data, error } = await supabase
        .storage
        .from("alunos-fotos")
        .upload(fileName, fotoFile);

      if (error) {
        toast.error("Erro ao fazer upload da foto");
        setLoading(false);
        return;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage.from("alunos-fotos").getPublicUrl(fileName);
      foto_url = urlData.publicUrl ?? "";
    }

    const result = await createAluno({
      nome,
      email,
      telefone,
      turma,
      instrumento,
      foto_url
    });

    setLoading(false);
    if (result?.success) {
      handleClose();
    }
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
      setFotoFile(null);
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          <div>
            <Label htmlFor="foto">Foto</Label>
            <Input
              ref={fileInputRef}
              id="foto"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            {fotoFile && (
              <span className="text-xs text-gray-500 mt-1">{fotoFile.name}</span>
            )}
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
