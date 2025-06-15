
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Phone, GraduationCap, Calendar, TrendingUp, MessageCircle, MapPin, User, Music } from "lucide-react"
import { Aluno } from "@/types/aluno"

interface AlunoDetailsProps {
  trigger: React.ReactNode
  aluno: Aluno
}

export function AlunoDetails({ trigger, aluno }: AlunoDetailsProps) {
  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const handleWhatsApp = () => {
    if (!aluno.telefone) return
    const phone = aluno.telefone.replace(/\D/g, '')
    const message = `Olá ${aluno.nome}! Como vão seus estudos de música?`
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleEmail = () => {
    if (!aluno.email) return
    const subject = `Escola de Música - ${aluno.nome}`
    const body = `Olá ${aluno.nome},\n\nEsperamos que esteja bem!\n\nAtenciosamente,\nEscola de Música`
    window.open(`mailto:${aluno.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  // Simulando dados de frequência (em uma aplicação real, viria do banco de dados)
  const presencaGeral = Math.round(Math.random() * 20 + 75)
  const frequenciaRecente = [
    { data: "15/12", presente: true },
    { data: "08/12", presente: true },
    { data: "01/12", presente: Math.random() > 0.3 },
    { data: "24/11", presente: true },
    { data: "17/11", presente: Math.random() > 0.3 },
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Aluno
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header com foto e informações básicas */}
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20 ring-4 ring-blue-100 dark:ring-blue-900">
              <AvatarImage src={aluno.foto_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-xl">
                {getInitials(aluno.nome)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{aluno.nome}</h3>
                <Badge variant={aluno.ativo ? "default" : "secondary"} className="px-3 py-1">
                  {aluno.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aluno.instrumento && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Music className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Instrumento</p>
                      <p className="font-semibold">{aluno.instrumento}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Turma</p>
                    <p className="font-semibold">{aluno.turma?.nome || 'Sem turma'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Matrícula</p>
                    <p className="font-semibold">
                      {aluno.created_at ? new Date(aluno.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Frequência</p>
                    <p className={`font-bold ${
                      presencaGeral >= 90 ? 'text-green-600' : 
                      presencaGeral >= 75 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {presencaGeral}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informações de contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aluno.email && (
              <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" onClick={handleEmail}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium truncate">{aluno.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {aluno.telefone && (
              <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" onClick={handleWhatsApp}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">WhatsApp</p>
                      <p className="font-medium">{aluno.telefone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Informações adicionais */}
          {(aluno.endereco || aluno.data_nascimento) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aluno.endereco && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Endereço</p>
                        <p className="font-medium">{aluno.endereco}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {aluno.data_nascimento && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Data de Nascimento</p>
                        <p className="font-medium">
                          {new Date(aluno.data_nascimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Responsável */}
          {aluno.responsavel && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Responsável</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{aluno.responsavel}</p>
                    {aluno.telefone_responsavel && (
                      <p className="text-sm text-gray-500">Tel: {aluno.telefone_responsavel}</p>
                    )}
                  </div>
                  {aluno.telefone_responsavel && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <a 
                        href={`https://wa.me/55${aluno.telefone_responsavel.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progresso de frequência */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Frequência Geral</h4>
                  <span className={`font-bold ${
                    presencaGeral >= 90 ? 'text-green-600' : 
                    presencaGeral >= 75 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {presencaGeral}%
                  </span>
                </div>
                <Progress value={presencaGeral} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Frequência recente */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Frequência Recente
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {frequenciaRecente.map((dia, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-500 mb-2">{dia.data}</div>
                    <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center text-sm font-bold ${
                      dia.presente 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                    }`}>
                      {dia.presente ? '✓' : '✗'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="flex-1">
              Editar Dados
            </Button>
            <Button className="flex-1">
              Enviar Mensagem
            </Button>
            {aluno.telefone && (
              <Button variant="outline" asChild>
                <a 
                  href={`https://wa.me/55${aluno.telefone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
