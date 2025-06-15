
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Users, GraduationCap, User } from "lucide-react"
import { useAlunos } from "@/hooks/useAlunos"
import { useProfessores } from "@/hooks/useProfessores"
import { useTurmas } from "@/hooks/useTurmas"

interface NewConversationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectContact: (contact: { id: string; name: string; type: 'aluno' | 'professor' | 'turma' }) => void
}

type FilterType = 'todos' | 'alunos' | 'professores' | 'turmas'

export function NewConversationModal({ open, onOpenChange, onSelectContact }: NewConversationModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos')
  
  const { alunos, loading: alunosLoading } = useAlunos()
  const { professores, loading: professoresLoading } = useProfessores()
  const { turmas, loading: turmasLoading } = useTurmas()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const filteredContacts = () => {
    let contacts: Array<{ id: string; name: string; type: 'aluno' | 'professor' | 'turma'; email?: string; instrumento?: string }> = []

    // Adicionar alunos
    if (activeFilter === 'todos' || activeFilter === 'alunos') {
      contacts.push(...alunos.map(aluno => ({
        id: aluno.id,
        name: aluno.nome,
        type: 'aluno' as const,
        email: aluno.email || undefined,
        instrumento: aluno.instrumento || undefined
      })))
    }

    // Adicionar professores
    if (activeFilter === 'todos' || activeFilter === 'professores') {
      contacts.push(...professores.map(professor => ({
        id: professor.id,
        name: professor.nome,
        type: 'professor' as const,
        email: professor.email
      })))
    }

    // Adicionar turmas
    if (activeFilter === 'todos' || activeFilter === 'turmas') {
      contacts.push(...turmas.map(turma => ({
        id: turma.id,
        name: turma.nome,
        type: 'turma' as const,
        instrumento: turma.instrumento
      })))
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      contacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.instrumento?.toLowerCase().includes(searchLower)
      )
    }

    return contacts
  }

  const getContactIcon = (type: 'aluno' | 'professor' | 'turma') => {
    switch (type) {
      case 'aluno':
        return <User className="h-4 w-4" />
      case 'professor':
        return <GraduationCap className="h-4 w-4" />
      case 'turma':
        return <Users className="h-4 w-4" />
    }
  }

  const getContactBadgeColor = (type: 'aluno' | 'professor' | 'turma') => {
    switch (type) {
      case 'aluno':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'professor':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'turma':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    }
  }

  const isLoading = alunosLoading || professoresLoading || turmasLoading
  const contacts = filteredContacts()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={activeFilter === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('todos')}
            >
              Todos
            </Button>
            <Button
              variant={activeFilter === 'alunos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('alunos')}
            >
              <User className="h-4 w-4 mr-1" />
              Alunos
            </Button>
            <Button
              variant={activeFilter === 'professores' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('professores')}
            >
              <GraduationCap className="h-4 w-4 mr-1" />
              Professores
            </Button>
            <Button
              variant={activeFilter === 'turmas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('turmas')}
            >
              <Users className="h-4 w-4 mr-1" />
              Turmas
            </Button>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, email ou instrumento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de contatos */}
          <div className="flex-1 overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Search className="h-8 w-8 mb-2" />
                <p>Nenhum contato encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={`${contact.type}-${contact.id}`}
                    onClick={() => onSelectContact(contact)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {contact.name}
                        </h3>
                        <Badge className={`text-xs ${getContactBadgeColor(contact.type)}`}>
                          {contact.type === 'aluno' ? 'Aluno' : 
                           contact.type === 'professor' ? 'Professor' : 'Turma'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        {getContactIcon(contact.type)}
                        {contact.email && (
                          <span className="truncate">{contact.email}</span>
                        )}
                        {contact.instrumento && (
                          <span className="truncate">
                            {contact.email ? ` • ${contact.instrumento}` : contact.instrumento}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
