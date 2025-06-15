
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useChat } from "@/hooks/useChat";

export default function Comunicacao() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { conversations, messages, loading, sendMessage } = useChat();

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const conversationMessages = selectedConversationId ? messages[selectedConversationId] || [] : [];

  const handleSendMessage = async (text: string) => {
    if (selectedConversationId) {
      await sendMessage(selectedConversationId, text);
    }
  };

  return (
    <DashboardLayout title="Comunicação">
      <div className="flex h-full">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          loading={loading}
        />
        
        <ChatInterface
          conversation={selectedConversation}
          messages={conversationMessages}
          onSendMessage={handleSendMessage}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  );
}
