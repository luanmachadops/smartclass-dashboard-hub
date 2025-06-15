
import React from 'react'
import { Message } from '@/types/chat'
import { Button } from '@/components/ui/button'

interface MessageBubbleProps {
  message: Message
  onVote: (messageId: string, optionId: string) => void
}

const formatTimestamp = (isoString: string) => {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onVote }) => {
  const isPoll = message.attachment?.type === 'poll' && message.attachment.pollData

  return (
    <div className={`flex gap-3 ${message.isSender ? 'justify-end' : ''}`}>
      {!message.isSender && message.senderAvatar && (
        <img
          src={message.senderAvatar}
          alt={message.senderName}
          className="h-8 w-8 rounded-full flex-shrink-0 object-cover"
        />
      )}
      
      <div
        className={`p-3 rounded-lg max-w-lg text-sm ${
          message.isSender
            ? 'bg-primary text-primary-foreground ml-auto'
            : 'bg-muted text-foreground'
        }`}
      >
        {isPoll && message.attachment?.pollData ? (
          <div className="space-y-3">
            <p className="font-semibold">📊 {message.attachment.pollData.question}</p>
            <div className="space-y-2">
              {message.attachment.pollData.options.map(option => (
                <Button
                  key={option.id}
                  variant={message.isSender ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => onVote(message.id, option.id)}
                  className="w-full justify-between text-left"
                >
                  <span>{option.text}</span>
                  <span className="text-xs opacity-75">
                    {option.votes} voto{option.votes !== 1 ? 's' : ''}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        ) : message.attachment_type ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {message.attachment_type === 'image' && '🖼️'}
                {message.attachment_type === 'document' && '📄'}
                {message.attachment_type === 'audio' && '🎵'}
              </span>
              <span className="font-medium">
                {message.attachment_file_name || message.attachment_type}
              </span>
            </div>
            
            {message.attachment_file_url && message.attachment_type === 'image' && (
              <img
                src={message.attachment_file_url}
                alt={message.attachment_file_name || 'Imagem'}
                className="rounded-md max-w-xs max-h-48 object-cover"
              />
            )}
            
            {message.attachment_file_url && message.attachment_type === 'audio' && (
              <audio controls src={message.attachment_file_url} className="w-full max-w-xs">
                Seu navegador não suporta o elemento de áudio.
              </audio>
            )}
            
            {message.text_content && (
              <p className="mt-2">{message.text_content}</p>
            )}
          </div>
        ) : (
          <p>{message.text_content}</p>
        )}
        
        <p className={`text-xs mt-2 text-right opacity-75`}>
          {formatTimestamp(message.created_at)}
        </p>
      </div>
    </div>
  )
}
