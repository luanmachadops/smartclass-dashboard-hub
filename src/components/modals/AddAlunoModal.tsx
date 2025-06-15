
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAlunos } from "@/hooks/useAlunos"
import { useTurmas } from "@/hooks/useTurmas"

interface AddAlunoModalProps {
  trigger: React.ReactNode
}

export function AddAlunoModal({ trigger }: AddAlunoModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { createAluno } = useAlunos()
  const { turmas } = useTurmas()
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    turma: "",
    responsavel: "",
    telefoneResponsavel: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await createAluno(formData)
    
    if (result.success) {
      setOpen(false)
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        turma: "",
        responsavel: "",
        telefoneResponsavel: ""
      })
    }
    
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Novo Aluno</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome do aluno"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="turma">Turma</Label>
            <Select onValueChange={(value) => setFormData({ ...formData, turma: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.filter(t => t.ativa).map((turma) => (
                  <SelectItem key={turma.id} value={turma.nome}>
                    {turma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="responsavel">Responsável (opcional)</Label>
            <Input
              id="responsavel"
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              placeholder="Nome do responsável"
            />
          </div>

          <div>
            <Label htmlFor="telefoneResponsavel">Telefone do Responsável (opcional)</Label>
            <Input
              id="telefoneResponsavel"
              value={formData.telefoneResponsavel}
              onChange={(e) => setFormData({ ...formData, telefoneResponsavel: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Aluno"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
