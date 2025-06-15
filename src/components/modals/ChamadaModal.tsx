
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users } from "lucide-react"

interface ChamadaModalProps {
  trigger: React.ReactNode
  turma: {
    nome: string
    horario: string
    dia: string
    professores: string[]
  }
}

export function ChamadaModal({ trigger, turma }: ChamadaModalProps) {
  const [open, setOpen] = useState(false)
  
  const alunosDaTurma = [
    { id: 1, nome: "Ana Silva", presente: false },
    { id: 2, nome: "Carlos Santos", presente: false },
    { id: 3, nome: "Maria Oliveira", presente: false },
    { id: 4, nome: "João Costa", presente: false },
    { id: 5, nome: "Paula Lima", presente: false },
  ]

  const [presencas, setPresencas] = useState(
    alunosDaTurma.reduce((acc, aluno) => ({ ...acc, [aluno.id]: false }), {})
  )

  const handlePresencaChange = (alunoId: number, presente: boolean) => {
    setPresencas({ ...presencas, [alunoId]: presente })
  }

  const handleSalvarChamada = () => {
    console.log("Chamada salva:", presencas)
    setOpen(false)
  }

  const totalPresentes = Object.values(presencas).filter(Boolean).length
  const percentualPresenca = Math.round((totalPresentes / alunosDaTurma.length) * 100)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Fazer Chamada - {turma.nome}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{turma.dia}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{turma.horario}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{alunosDaTurma.length} alunos</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {turma.professores.map((professor) => (
              <Badge key={professor} variant="outline">
                {professor}
              </Badge>
            ))}
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Lista de Presença</h3>
              <Badge variant={percentualPresenca >= 80 ? "default" : "destructive"}>
                {percentualPresenca}% presente
              </Badge>
            </div>
            
            <div className="space-y-3">
              {alunosDaTurma.map((aluno) => (
                <div key={aluno.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`aluno-${aluno.id}`}
                    checked={presencas[aluno.id]}
                    onCheckedChange={(checked) => handlePresencaChange(aluno.id, !!checked)}
                  />
                  <label 
                    htmlFor={`aluno-${aluno.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {aluno.nome}
                  </label>
                  <Badge variant={presencas[aluno.id] ? "default" : "secondary"}>
                    {presencas[aluno.id] ? "Presente" : "Ausente"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarChamada}>
              Salvar Chamada
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
