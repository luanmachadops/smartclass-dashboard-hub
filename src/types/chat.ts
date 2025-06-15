
export interface Conversation {
  id: string
  title?: string
  is_group_chat: boolean
  group_chat_class_id?: string
  school_id: string
  created_at: string
  updated_at: string
  recipient: Recipient
  lastMessage?: string
  lastMessageTimestamp?: string
  unreadCount?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_profile_id: string
  text_content?: string
  attachment_type?: AttachmentType
  attachment_file_name?: string
  attachment_file_url?: string
  poll_id?: string
  created_at: string
  isSender: boolean
  senderName?: string
  senderAvatar?: string
  attachment?: MessageAttachment
}

export interface MessageAttachment {
  type: AttachmentType
  fileName?: string
  fileUrl?: string
  pollData?: PollData
}

export interface Recipient {
  id: string
  name: string
  avatarUrl: string
  type: 'student' | 'teacher' | 'director' | 'class'
  school_id: string
}

export interface PollData {
  id: string
  question: string
  options: PollOption[]
  school_id: string
}

export interface PollOption {
  id: string
  text: string
  votes: number
}

export interface CreatePollData {
  question: string
  options: string[]
}

export type AttachmentType = 'image' | 'document' | 'audio' | 'poll'

export interface ConversationParticipant {
  id: string
  conversation_id: string
  profile_id: string
  joined_at: string
  last_read_at: string
}
