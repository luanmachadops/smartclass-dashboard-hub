
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Mail, Phone, GraduationCap, Calendar, TrendingUp, MessageCircle } from "lucide-react"

interface AlunoDetailsProps {
  trigger: React.ReactNode
  aluno: {
    id: number
    nome: string
    email: string
    telefone: string
    turma: string
    presenca: number
    dataMatricula: string
    status: string
  }
}

export function AlunoDetails({ trigger, aluno }: AlunoDetailsProps) {
  const handleWhatsApp = () => {
    const phone = aluno.telefone.replace(/\D/g, '')
    const message = `Olá ${aluno.nome}! Como vai seus estudos de música?`
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleEmail = () => {
    const subject = `Escola de Música - ${aluno.nome}`
    const body = `Olá ${aluno.nome},\n\nEsperamos que esteja bem!\n\nAtenciosamente,\nEscola de Música`
    window.open(`mailto:${aluno.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  const frequenciaRecente = [
    { data: "15/12", presente: true },
    { data: "08/12", presente: true },
    { data: "01/12", presente: false },
    { data: "24/11", presente: true },
    { data: "17/11", presente: true },
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Aluno</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="text-lg">
                {aluno.nome.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold">{aluno.nome}</h3>
                <Badge variant={aluno.status === "ativo" ? "default" : "secondary"}>
                  {aluno.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span>{aluno.turma}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Matrícula: {new Date(aluno.dataMatricula).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleEmail}
            >
              <Mail className="h-4 w-4" />
              {aluno.email}
            </Button>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-4 w-4" />
              {aluno.telefone}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Frequência Geral</span>
              <span className={`text-sm font-bold ${
                aluno.presenca >= 90 ? 'text-green-600' : 
                aluno.presenca >= 75 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {aluno.presenca}%
              </span>
            </div>
            <Progress value={aluno.presenca} className="h-2" />
          </div>

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Frequência Recente
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {frequenciaRecente.map((dia, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{dia.data}</div>
                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-medium ${
                    dia.presente 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/50'
                  }`}>
                    {dia.presente ? '✓' : '✗'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline">Editar Dados</Button>
            <Button>Enviar Mensagem</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
