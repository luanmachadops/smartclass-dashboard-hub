import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useChat } from "@/hooks/useChat";

// Interface local para compatibilidade com os componentes
interface ConversationListItem {
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

interface MessageItem {
  id: string
  text_content: string | null
  created_at: string
  sender_profile_id: string
  sender?: {
    nome: string
  }
}

export default function Comunicacao() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { conversations, messages, loading, sendMessage, createConversation } = useChat();

  const handleSendMessage = async (text: string) => {
    if (selectedConversationId) {
      await sendMessage(text);
    }
  };

  // Converter conversas do useChat para o formato esperado pelos componentes
  const formattedConversations: ConversationListItem[] = conversations.map(conv => ({
    id: conv.id,
    title: conv.title || null,
    is_group_chat: conv.is_group_chat,
    updated_at: conv.updated_at,
    lastMessage: conv.lastMessage ? {
      text_content: typeof conv.lastMessage === 'string' ? conv.lastMessage : null,
      created_at: conv.lastMessageTimestamp || conv.updated_at,
      sender_name: conv.recipient?.name
    } : undefined,
    participant: conv.is_group_chat ? undefined : {
      nome: conv.recipient?.name || 'Usuário',
      foto_url: conv.recipient?.avatarUrl
    },
    unread_count: conv.unreadCount
  }));

  // Converter mensagens para o formato esperado
  const formattedMessages: MessageItem[] = messages.map(msg => ({
    id: msg.id,
    text_content: msg.text_content,
    created_at: msg.created_at,
    sender_profile_id: msg.sender_profile_id,
    sender: {
      nome: msg.senderName || 'Usuário'
    }
  }));

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const conversationForInterface = selectedConversation ? {
    id: selectedConversation.id,
    title: selectedConversation.title || null,
    is_group_chat: selectedConversation.is_group_chat,
    participant: selectedConversation.is_group_chat ? undefined : {
      nome: selectedConversation.recipient?.name || 'Usuário',
      foto_url: selectedConversation.recipient?.avatarUrl
    }
  } : null;

  const filteredConversations = formattedConversations.filter(conv => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    return (
      (conv.title && conv.title.toLowerCase().includes(searchLower)) ||
      (conv.participant?.nome && conv.participant.nome.toLowerCase().includes(searchLower)) ||
      (conv.lastMessage?.text_content && conv.lastMessage.text_content.toLowerCase().includes(searchLower))
    );
  });

  const handleStartNewConversation = async (contact: { id: string; name: string; type: 'aluno' | 'professor' | 'turma' }) => {
    try {
      const newConversation = await createConversation(contact)
      if (newConversation) {
        setSelectedConversationId(newConversation.id)
      }
    } catch (error) {
      console.error('Erro ao criar conversa:', error)
    }
  }

  return (
    <DashboardLayout title="Comunicação">
      <div className="flex h-full">
        <ConversationList
          conversations={filteredConversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onStartNewConversation={handleStartNewConversation}
        />
        
        <ChatInterface
          conversation={conversationForInterface}
          messages={formattedMessages}
          onSendMessage={handleSendMessage}
          loading={loading}
          onCreatePoll={() => {}}
          onVoteOnPoll={() => {}}
          onUploadFile={() => {}}
        />
      </div>
    </DashboardLayout>
  );
}
