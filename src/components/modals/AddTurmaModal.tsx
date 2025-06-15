
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useTurmas } from "@/hooks/useTurmas"
import { useProfessores } from "@/hooks/useProfessores"
import { HorarioAulaForm, HorarioAula } from "@/components/forms/HorarioAulaForm"

interface AddTurmaModalProps {
  trigger: React.ReactNode
}

export function AddTurmaModal({ trigger }: AddTurmaModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { createTurma } = useTurmas()
  const { professores } = useProfessores()
  
  const [formData, setFormData] = useState({
    nome: "",
    instrumento: "",
    nivel: "",
    professores: [] as string[],
    maxAlunos: ""
  })

  const [horarios, setHorarios] = useState<HorarioAula[]>([
    {
      id: "1",
      dia: "",
      horario_inicio: "",
      horario_fim: ""
    }
  ])

  const handleAddProfessor = (professor: string) => {
    if (!formData.professores.includes(professor)) {
      setFormData({
        ...formData,
        professores: [...formData.professores, professor]
      })
    }
  }

  const handleRemoveProfessor = (professor: string) => {
    setFormData({
      ...formData,
      professores: formData.professores.filter(p => p !== professor)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar se pelo menos um horário está preenchido
    const horariosValidos = horarios.filter(h => 
      h.dia && h.horario_inicio && h.horario_fim
    )
    
    if (horariosValidos.length === 0) {
      alert('Adicione pelo menos um horário válido')
      return
    }
    
    setLoading(true)
    
    const dadosParaEnviar = {
      ...formData,
      horarios: horariosValidos
    }
    
    console.log('Enviando dados:', dadosParaEnviar)
    
    const result = await createTurma(dadosParaEnviar)
    
    if (result.success) {
      setOpen(false)
      setFormData({
        nome: "",
        instrumento: "",
        nivel: "",
        professores: [],
        maxAlunos: ""
      })
      setHorarios([{
        id: "1",
        dia: "",
        horario_inicio: "",
        horario_fim: ""
      }])
    }
    
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Turma</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome da Turma</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Violão Iniciante"
                required
              />
            </div>
            <div>
              <Label htmlFor="instrumento">Instrumento</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, instrumento: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="violao">Violão</SelectItem>
                  <SelectItem value="piano">Piano</SelectItem>
                  <SelectItem value="bateria">Bateria</SelectItem>
                  <SelectItem value="guitarra">Guitarra</SelectItem>
                  <SelectItem value="canto">Canto</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nivel">Nível</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, nivel: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maxAlunos">Máx. Alunos (opcional)</Label>
              <Input
                id="maxAlunos"
                type="number"
                value={formData.maxAlunos}
                onChange={(e) => setFormData({ ...formData, maxAlunos: e.target.value })}
                placeholder="15"
                min="1"
              />
            </div>
          </div>

          <HorarioAulaForm 
            horarios={horarios}
            onChange={setHorarios}
          />

          <div>
            <Label>Professores</Label>
            <Select onValueChange={handleAddProfessor}>
              <SelectTrigger>
                <SelectValue placeholder="Adicionar professor" />
              </SelectTrigger>
              <SelectContent>
                {professores.map((professor) => (
                  <SelectItem key={professor.id} value={professor.nome}>
                    {professor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.professores.map((professor) => (
                <Badge key={professor} variant="secondary" className="gap-1">
                  {professor}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveProfessor(professor)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Turma"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
