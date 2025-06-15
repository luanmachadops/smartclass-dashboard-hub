import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlunos } from "@/hooks/useAlunos";
import { useTurmas } from "@/hooks/useTurmas";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload } from "lucide-react";
import { Confetti } from "../ui/Confetti";
interface AddAlunoModalProps {
  trigger: React.ReactNode;
}
export function AddAlunoModal({
  trigger
}: AddAlunoModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const {
    createAluno
  } = useAlunos();
  const {
    turmas
  } = useTurmas();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    turma: "",
    responsavel: "",
    telefoneResponsavel: "",
    instrumento: "",
    foto: null as File | null
  });
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        foto: file
      });
      const reader = new FileReader();
      reader.onload = e => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await createAluno(formData);
    if (result.success) {
      setOpen(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1800);
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        turma: "",
        responsavel: "",
        telefoneResponsavel: "",
        instrumento: "",
        foto: null
      });
      setPreviewImage(null);
    }
    setLoading(false);
  };
  const instrumentos = [
    "Piano", "Violão", "Guitarra", "Baixo", "Bateria", "Violino", "Violoncelo",
    "Flauta", "Saxofone", "Trompete", "Trombone", "Clarinete", "Canto", "Ukulele",
    "Teclado", "Harmônica"
  ];
  return <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[500px] animate-fade-in animate-duration-300"
          style={{
            animation: open ? 'fade-in 0.4s both' : 'fade-out 0.4s both'
          }}
        >
          <DialogHeader>
            <DialogTitle>Registrar Novo Aluno</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* FOTO */}
            <div className="flex flex-col items-center space-y-4 transition-transform duration-300 animate-scale-in">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-2 ring-gray-200">
                  <AvatarImage src={previewImage || "/placeholder.svg"} className="object-fill" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                    {formData.nome ? formData.nome.split(' ').map(n => n[0]).join('').substring(0, 2) : <Camera className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <Label htmlFor="foto" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 
                    bg-white border-2 border-dashed border-gray-300
                    rounded-lg transition-colors
                    hover:bg-blue-50 hover:border-blue-400
                    active:bg-blue-100"
                  >
                    <Upload className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Escolher Foto</span>
                  </div>
                </Label>
                <Input id="foto" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
            </div>
            {/* Nome */}
            <div>
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input id="nome" value={formData.nome} onChange={e => setFormData({
              ...formData,
              nome: e.target.value
            })} placeholder="Nome do aluno" required />
            </div>
            {/* Instrumento */}
            <div>
              <Label htmlFor="instrumento">Instrumento</Label>
              <Select onValueChange={value => setFormData({
              ...formData,
              instrumento: value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o instrumento" />
                </SelectTrigger>
                <SelectContent>
                  {instrumentos.map(instrumento => <SelectItem key={instrumento} value={instrumento}>
                      {instrumento}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Email e Telefone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({
                ...formData,
                email: e.target.value
              })} placeholder="email@exemplo.com" />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" value={formData.telefone} onChange={e => setFormData({
                ...formData,
                telefone: e.target.value
              })} placeholder="(11) 99999-9999" />
              </div>
            </div>
            {/* Turma */}
            <div>
              <Label htmlFor="turma">Turma</Label>
              <Select onValueChange={value => setFormData({
              ...formData,
              turma: value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.filter(t => t.ativa).map(turma => <SelectItem key={turma.id} value={turma.nome}>
                      {turma.nome}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Responsável */}
            <div>
              <Label htmlFor="responsavel">Responsável</Label>
              <Input id="responsavel" value={formData.responsavel} onChange={e => setFormData({
              ...formData,
              responsavel: e.target.value
            })} placeholder="Nome do responsável" />
            </div>
            {/* Telefone Responsável */}
            <div>
              <Label htmlFor="telefoneResponsavel">Telefone do Responsável</Label>
              <Input id="telefoneResponsavel" value={formData.telefoneResponsavel} onChange={e => setFormData({
              ...formData,
              telefoneResponsavel: e.target.value
            })} placeholder="(11) 99999-9999" />
            </div>
            {/* Botões */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="rounded-xl border-slate-300 text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className={`relative overflow-hidden ${loading ? "animate-pulse" : "hover:shadow-lg hover:scale-105 transition-transform rounded-xl"}`}
              >
                {loading ? "Registrando..." : "Registrar Aluno"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {showConfetti && <Confetti />}
    </>;
}
