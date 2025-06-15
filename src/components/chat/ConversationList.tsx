import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Users, Plus } from "lucide-react"
import { useState } from "react"
import { NewConversationModal } from "./NewConversationModal"

interface Conversation {
  id: string
  title: string | null
  is_group_chat: boolean
  updated_at: string
  lastMessage?: {
    text_content: string | null
    created_at: string
    sender_name?: string
  }
  participant?: {
    nome: string
    foto_url?: string
  }
  unread_count?: number
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversationId: string | null
  onSelectConversation: (id: string) => void
  loading: boolean
  searchTerm: string
  onSearchChange: (term: string) => void
  onStartNewConversation?: (contact: { id: string; name: string; type: 'aluno' | 'professor' | 'turma' }) => void
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  loading,
  searchTerm,
  onSearchChange,
  onStartNewConversation
}: ConversationListProps) {
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    }
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const handleStartNewConversation = (contact: { id: string; name: string; type: 'aluno' | 'professor' | 'turma' }) => {
    setShowNewConversationModal(false)
    onStartNewConversation?.(contact)
  }

  if (loading) {
    return (
      <div className="w-80 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-r border-white/20">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        </div>
        <div className="p-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 mb-2">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-80 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-r border-white/20 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          {/* Botão Nova Conversa */}
          <Button
            onClick={() => setShowNewConversationModal(true)}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Conversa
          </Button>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white/80 dark:bg-gray-700/80 border-white/30 focus:border-blue-400/50 rounded-xl"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Users className="h-8 w-8 mb-2" />
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`flex items-center gap-3 p-4 cursor-pointer border-l-4 transition-all hover:bg-white/40 dark:hover:bg-gray-700/40 ${
                  selectedConversationId === conversation.id
                    ? 'bg-white/60 dark:bg-gray-700/60 border-blue-500'
                    : 'border-transparent'
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    {conversation.is_group_chat ? (
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white font-semibold">
                        <Users className="h-6 w-6" />
                      </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage src={conversation.participant?.foto_url} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                          {getInitials(conversation.participant?.nome || conversation.title || 'U')}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  {conversation.unread_count && conversation.unread_count > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                      {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                    </Badge>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {conversation.is_group_chat 
                        ? conversation.title 
                        : conversation.participant?.nome || 'Usuário'
                      }
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.updated_at)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {conversation.lastMessage?.text_content || 'Nenhuma mensagem'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <NewConversationModal
        open={showNewConversationModal}
        onOpenChange={setShowNewConversationModal}
        onSelectContact={handleStartNewConversation}
      />
    </>
  )
}
