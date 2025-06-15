
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useChat } from "@/hooks/useChat";

export default function Comunicacao() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { conversations, messages, loading, sendMessage } = useChat();

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const conversationMessages = selectedConversationId ? messages[selectedConversationId] || [] : [];

  const handleSendMessage = async (text: string) => {
    if (selectedConversationId) {
      await sendMessage(selectedConversationId, text);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    return (
      (conv.title && conv.title.toLowerCase().includes(searchLower)) ||
      (conv.participant?.nome && conv.participant.nome.toLowerCase().includes(searchLower)) ||
      (conv.lastMessage?.text_content && conv.lastMessage.text_content.toLowerCase().includes(searchLower))
    );
  });

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
        />
        
        <ChatInterface
          conversation={selectedConversation || null}
          messages={conversationMessages}
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
