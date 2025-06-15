
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"

export interface HorarioAula {
  id: string
  dia: string
  horario_inicio: string
  horario_fim: string
}

interface HorarioAulaFormProps {
  horarios: HorarioAula[]
  onChange: (horarios: HorarioAula[]) => void
}

export function HorarioAulaForm({ horarios, onChange }: HorarioAulaFormProps) {
  const diasSemana = [
    "Segunda-feira",
    "Terça-feira", 
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo"
  ]

  const adicionarHorario = () => {
    const novoHorario: HorarioAula = {
      id: Date.now().toString(),
      dia: "",
      horario_inicio: "",
      horario_fim: ""
    }
    onChange([...horarios, novoHorario])
  }

  const removerHorario = (id: string) => {
    onChange(horarios.filter(h => h.id !== id))
  }

  const atualizarHorario = (id: string, campo: keyof HorarioAula, valor: string) => {
    onChange(horarios.map(h => 
      h.id === id ? { ...h, [campo]: valor } : h
    ))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Horários das Aulas</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={adicionarHorario}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Horário
        </Button>
      </div>
      
      {horarios.map((horario, index) => (
        <Card key={horario.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Horário {index + 1}
              </CardTitle>
              {horarios.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removerHorario(horario.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`dia-${horario.id}`}>Dia da Semana</Label>
              <Select 
                value={horario.dia}
                onValueChange={(value) => atualizarHorario(horario.id, 'dia', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {diasSemana.map(dia => (
                    <SelectItem key={dia} value={dia}>{dia}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`inicio-${horario.id}`}>Horário Início</Label>
                <Input
                  id={`inicio-${horario.id}`}
                  type="time"
                  value={horario.horario_inicio}
                  onChange={(e) => atualizarHorario(horario.id, 'horario_inicio', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor={`fim-${horario.id}`}>Horário Fim</Label>
                <Input
                  id={`fim-${horario.id}`}
                  type="time"
                  value={horario.horario_fim}
                  onChange={(e) => atualizarHorario(horario.id, 'horario_fim', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {horarios.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <p>Nenhum horário adicionado</p>
          <p className="text-sm">Clique em "Adicionar Horário" para começar</p>
        </div>
      )}
    </div>
  )
}
