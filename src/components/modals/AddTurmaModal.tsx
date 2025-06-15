
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { useTurmas } from "@/hooks/useTurmas"
import { useProfessores } from "@/hooks/useProfessores"

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
    customInstrumento: "",
    nivel: "",
    professores: [] as string[]
  })

  const [showCustomInstrumento, setShowCustomInstrumento] = useState(false)

  const instrumentosDisponiveis = [
    "violao",
    "piano", 
    "bateria",
    "guitarra",
    "canto",
    "baixo",
    "outro"
  ]

  const handleInstrumentoChange = (value: string) => {
    if (value === "outro") {
      setShowCustomInstrumento(true)
      setFormData({ ...formData, instrumento: "" })
    } else {
      setShowCustomInstrumento(false)
      setFormData({ ...formData, instrumento: value, customInstrumento: "" })
    }
  }

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
    
    const instrumentoFinal = showCustomInstrumento 
      ? formData.customInstrumento 
      : formData.instrumento

    if (!instrumentoFinal) {
      alert('Por favor, selecione ou digite um instrumento')
      return
    }
    
    setLoading(true)
    
    const dadosParaEnviar = {
      ...formData,
      instrumento: instrumentoFinal,
      // Horário temporário para compatibilidade
      horarios: [{
        dia: "Segunda-feira",
        horario_inicio: "08:00",
        horario_fim: "09:00"
      }]
    }
    
    console.log('Enviando dados:', dadosParaEnviar)
    
    const result = await createTurma(dadosParaEnviar)
    
    if (result.success) {
      setOpen(false)
      setFormData({
        nome: "",
        instrumento: "",
        customInstrumento: "",
        nivel: "",
        professores: []
      })
      setShowCustomInstrumento(false)
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
          <DialogTitle>Criar Nova Turma</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="nome">Nome da Turma</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Violão Iniciante A"
              required
            />
          </div>

          <div>
            <Label htmlFor="instrumento">Instrumento</Label>
            <Select onValueChange={handleInstrumentoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o instrumento" />
              </SelectTrigger>
              <SelectContent>
                {instrumentosDisponiveis.map((instrumento) => (
                  <SelectItem key={instrumento} value={instrumento}>
                    {instrumento === "outro" ? "Outro..." : 
                     instrumento.charAt(0).toUpperCase() + instrumento.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {showCustomInstrumento && (
              <Input
                className="mt-2"
                value={formData.customInstrumento}
                onChange={(e) => setFormData({ ...formData, customInstrumento: e.target.value })}
                placeholder="Digite o nome do instrumento"
                required
              />
            )}
          </div>

          <div>
            <Label htmlFor="nivel">Nível</Label>
            <Select onValueChange={(value) => setFormData({ ...formData, nivel: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="iniciante">Iniciante</SelectItem>
                <SelectItem value="intermediario">Intermediário</SelectItem>
                <SelectItem value="avancado">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Professores (Opcional)</Label>
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
