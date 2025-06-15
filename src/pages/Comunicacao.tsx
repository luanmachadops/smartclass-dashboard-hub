
import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ConversationList } from '@/components/chat/ConversationList'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { useChat } from '@/hooks/useChat'

const Comunicacao: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobileChatView, setIsMobileChatView] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  const {
    conversations,
    selectedConversationId,
    setSelectedConversationId,
    messages,
    loading,
    sendMessage,
    createPoll,
    voteOnPoll,
    uploadFile
  } = useChat()

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setIsMobileChatView(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    if (isMobile) {
      setIsMobileChatView(true)
    }
  }

  const handleBackToList = () => {
    setIsMobileChatView(false)
    setSelectedConversationId(null)
  }

  const currentConversation = conversations.find(c => c.id === selectedConversationId)

  return (
    <DashboardLayout title="Comunicação">
      <div className="h-[calc(100vh-8rem)] flex bg-card rounded-lg border overflow-hidden">
        {/* Lista de conversas - hidden em mobile quando chat está ativo */}
        {(!isMobile || !isMobileChatView) && (
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            loading={loading}
          />
        )}

        {/* Interface do chat */}
        {currentConversation && (isMobileChatView || !isMobile) ? (
          <ChatInterface
            conversation={currentConversation}
            messages={messages}
            onSendMessage={sendMessage}
            onCreatePoll={createPoll}
            onVoteOnPoll={voteOnPoll}
            onUploadFile={uploadFile}
            onBack={isMobile ? handleBackToList : undefined}
            loading={loading}
          />
        ) : (
          // Placeholder quando nenhuma conversa está selecionada (apenas desktop)
          !isMobile && (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-muted-foreground">
                  Escolha uma conversa na lista para começar a trocar mensagens
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  )
}

export default Comunicacao
