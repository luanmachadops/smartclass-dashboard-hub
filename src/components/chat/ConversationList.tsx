
import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Conversation } from '@/types/chat'

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversationId: string | null
  onSelectConversation: (id: string) => void
  searchTerm: string
  onSearchChange: (term: string) => void
  loading: boolean
}

const formatTimestamp = (isoString?: string) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  searchTerm,
  onSearchChange,
  loading
}) => {
  const filteredConversations = conversations.filter(conv =>
    conv.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="w-full md:w-1/3 xl:w-1/4 bg-card border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              className="pl-10"
              disabled
            />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:w-1/3 xl:w-1/4 bg-card border-r flex flex-col">
      <div className="p-4 border-b sticky top-0 bg-card z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map(conversation => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`flex items-center gap-4 p-4 border-b w-full text-left transition-colors ${
                selectedConversationId === conversation.id
                  ? 'bg-muted'
                  : 'hover:bg-muted/50'
              }`}
            >
              <img
                src={conversation.recipient.avatarUrl}
                alt={conversation.recipient.name}
                className="h-12 w-12 rounded-full flex-shrink-0 object-cover"
              />
              <div className="flex-grow overflow-hidden">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-foreground truncate">
                    {conversation.recipient.name}
                  </p>
                  {conversation.unreadCount && conversation.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.lastMessage || "Nenhuma mensagem ainda"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(conversation.lastMessageTimestamp)}
                </p>
              </div>
            </button>
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Nenhuma conversa encontrada
          </div>
        )}
      </div>
    </div>
  )
}
