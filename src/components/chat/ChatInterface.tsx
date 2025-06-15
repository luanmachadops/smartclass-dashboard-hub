
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Paperclip, Smile, Users, Phone, Video, MoreVertical } from "lucide-react"
import { useState } from "react"

interface Conversation {
  id: string
  title: string | null
  is_group_chat: boolean
  participant?: {
    nome: string
    foto_url?: string
  }
}

interface Message {
  id: string
  text_content: string | null
  created_at: string
  sender_profile_id: string
  sender?: {
    nome: string
  }
}

interface ChatInterfaceProps {
  conversation: Conversation | null
  messages: Message[]
  onSendMessage: (text: string) => Promise<void>
  loading: boolean
  onCreatePoll?: () => void
  onVoteOnPoll?: (pollId: string, optionId: string) => void
  onUploadFile?: (file: File) => void
}

export function ChatInterface({
  conversation,
  messages,
  onSendMessage,
  loading,
  onCreatePoll,
  onVoteOnPoll,
  onUploadFile
}: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return
    
    setSending(true)
    try {
      await onSendMessage(newMessage.trim())
      setNewMessage("")
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <MessageCircle className="h-20 w-20 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Selecione uma conversa
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Escolha uma conversa na lista para começar a trocar mensagens
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {conversation.is_group_chat ? (
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                  <Users className="h-5 w-5" />
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
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {conversation.is_group_chat 
                  ? conversation.title 
                  : conversation.participant?.nome || 'Usuário'
                }
              </h2>
              {conversation.is_group_chat && (
                <p className="text-sm text-gray-500">Turma • {messages.length} mensagens</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <MessageCircle className="h-8 w-8 mb-2" />
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm">Envie a primeira mensagem!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white text-xs">
                  {getInitials(message.sender?.nome || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {message.sender?.nome || 'Usuário'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.created_at)}
                  </span>
                </div>
                <div className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                  <p className="text-gray-900 dark:text-white">{message.text_content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-white/20 p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              placeholder="Digite uma mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="bg-white/80 dark:bg-gray-700/80 border-white/30 focus:border-blue-400/50 rounded-xl"
              disabled={sending}
            />
          </div>
          <Button variant="ghost" size="sm">
            <Smile className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
