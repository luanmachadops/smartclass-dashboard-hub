
import React, { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Plus, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageBubble } from './MessageBubble'
import { AttachmentMenu } from './AttachmentMenu'
import { CreatePollModal } from './CreatePollModal'
import { Conversation, Message, AttachmentType, CreatePollData } from '@/types/chat'

interface ChatInterfaceProps {
  conversation: Conversation
  messages: Message[]
  onSendMessage: (text: string, attachment?: any) => void
  onCreatePoll: (pollData: CreatePollData) => void
  onVoteOnPoll: (messageId: string, optionId: string) => void
  onUploadFile: (file: File, type: AttachmentType) => Promise<any>
  onBack?: () => void
  loading: boolean
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversation,
  messages,
  onSendMessage,
  onCreatePoll,
  onVoteOnPoll,
  onUploadFile,
  onBack,
  loading
}) => {
  const [newMessage, setNewMessage] = useState('')
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false)
  const [isCreatePollModalOpen, setIsCreatePollModalOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    await onSendMessage(newMessage)
    setNewMessage('')
    setSending(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileAttached = async (file: File, type: AttachmentType) => {
    setSending(true)
    const uploadResult = await onUploadFile(file, type)
    if (uploadResult) {
      await onSendMessage(`📎 ${file.name}`, {
        type,
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl
      })
    }
    setSending(false)
    setIsAttachmentMenuOpen(false)
  }

  const handleCreatePoll = async (pollData: CreatePollData) => {
    setSending(true)
    await onCreatePoll({ ...pollData, school_id: conversation.school_id } as any)
    setSending(false)
    setIsCreatePollModalOpen(false)
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-card flex items-center gap-3 sticky top-0 z-10">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <img
          src={conversation.recipient.avatarUrl}
          alt={conversation.recipient.name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div>
          <h2 className="font-semibold text-foreground">{conversation.recipient.name}</h2>
          <p className="text-xs text-muted-foreground capitalize">
            {conversation.recipient.type === 'class' ? 'Turma' : 
             conversation.recipient.type === 'teacher' ? 'Professor' : 'Diretor'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : messages.length > 0 ? (
          messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              onVote={onVoteOnPoll}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhuma mensagem ainda. Inicie a conversa!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-card border-t">
        <div className="relative">
          {isAttachmentMenuOpen && (
            <AttachmentMenu
              onSelectPoll={() => {
                setIsCreatePollModalOpen(true)
                setIsAttachmentMenuOpen(false)
              }}
              onFileAttached={handleFileAttached}
              onClose={() => setIsAttachmentMenuOpen(false)}
            />
          )}
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
              disabled={sending}
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={sending}
              className="flex-1"
            />
            
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <CreatePollModal
        isOpen={isCreatePollModalOpen}
        onClose={() => setIsCreatePollModalOpen(false)}
        onCreatePoll={handleCreatePoll}
      />
    </div>
  )
}
