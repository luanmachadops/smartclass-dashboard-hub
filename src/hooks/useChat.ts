import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Conversation, Message, PollData, AttachmentType } from '@/types/chat'
import { toast } from 'sonner'

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchConversations = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations (
            *,
            messages (
              text_content,
              created_at,
              sender_profile_id,
              attachment_type,
              attachment_file_name
            )
          )
        `)
        .eq('profile_id', user.id)

      if (error) throw error

      const formattedConversations = await Promise.all(
        data.map(async (cp: any) => {
          const conv = cp.conversations
          let recipient

          if (conv.is_group_chat && conv.group_chat_class_id) {
            // Buscar informações da turma
            const { data: turmaData } = await supabase
              .from('turmas')
              .select('nome')
              .eq('id', conv.group_chat_class_id)
              .single()

            recipient = {
              id: conv.group_chat_class_id,
              name: turmaData?.nome || conv.title || 'Grupo',
              avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(turmaData?.nome || 'Grupo')}&background=3b82f6&color=fff`,
              type: 'class' as const,
              school_id: conv.school_id
            }
          } else {
            // Buscar outros participantes
            const { data: participants } = await supabase
              .from('conversation_participants')
              .select(`
                profile_id,
                profiles (nome_completo, tipo_usuario)
              `)
              .eq('conversation_id', conv.id)
              .neq('profile_id', user.id)

            const otherParticipant = participants?.[0]
            if (otherParticipant) {
              const profile = otherParticipant.profiles as any
              recipient = {
                id: otherParticipant.profile_id,
                name: profile.nome_completo || 'Usuário',
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nome_completo || 'U')}&background=10b981&color=fff`,
                type: profile.tipo_usuario === 'professor' ? 'teacher' : 'director' as const,
                school_id: conv.school_id
              }
            } else {
              recipient = {
                id: 'unknown',
                name: 'Usuário Desconhecido',
                avatarUrl: 'https://ui-avatars.com/api/?name=?&background=6b7280&color=fff',
                type: 'director' as const,
                school_id: conv.school_id
              }
            }
          }

          const lastMessage = conv.messages?.[conv.messages.length - 1]
          
          return {
            ...conv,
            recipient,
            lastMessage: lastMessage?.text_content || 
              (lastMessage?.attachment_type ? `📎 ${lastMessage.attachment_file_name || lastMessage.attachment_type}` : 'Nenhuma mensagem'),
            lastMessageTimestamp: lastMessage?.created_at || conv.updated_at,
            unreadCount: 0
          } as Conversation
        })
      )

      setConversations(formattedConversations.sort((a, b) => 
        new Date(b.lastMessageTimestamp!).getTime() - new Date(a.lastMessageTimestamp!).getTime()
      ))
    } catch (error: any) {
      console.error('Erro ao carregar conversas:', error)
      toast.error('Erro ao carregar conversas')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!sender_profile_id (nome_completo),
          polls (*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const formattedMessages = await Promise.all(
        data.map(async (msg: any) => {
          let pollData
          if (msg.poll_id && msg.polls) {
            const { data: options } = await supabase
              .from('poll_options')
              .select(`
                *,
                poll_votes (count)
              `)
              .eq('poll_id', msg.poll_id)

            pollData = {
              id: msg.poll_id,
              question: msg.polls.question,
              options: options?.map(opt => ({
                id: opt.id,
                text: opt.text,
                votes: opt.poll_votes?.[0]?.count || 0
              })) || [],
              school_id: msg.polls.school_id
            }
          }

          return {
            ...msg,
            isSender: msg.sender_profile_id === user.id,
            senderName: msg.profiles?.nome_completo,
            senderAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.profiles?.nome_completo || 'U')}&background=3b82f6&color=fff`,
            attachment: msg.attachment_type ? {
              type: msg.attachment_type,
              fileName: msg.attachment_file_name,
              fileUrl: msg.attachment_file_url,
              pollData
            } : undefined
          } as Message
        })
      )

      setMessages(formattedMessages)
    } catch (error: any) {
      console.error('Erro ao carregar mensagens:', error)
      toast.error('Erro ao carregar mensagens')
    }
  }

  const sendMessage = async (text: string, attachmentData?: {
    type: AttachmentType
    fileName?: string
    fileUrl?: string
    pollId?: string
  }) => {
    if (!user || !selectedConversationId) return
    if (!text.trim() && !attachmentData) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversationId,
          sender_profile_id: user.id,
          text_content: text.trim() || null,
          attachment_type: attachmentData?.type || null,
          attachment_file_name: attachmentData?.fileName || null,
          attachment_file_url: attachmentData?.fileUrl || null,
          poll_id: attachmentData?.pollId || null
        })
        .select()
        .single()

      if (error) throw error

      const newMessage: Message = {
        id: data.id,
        conversation_id: data.conversation_id,
        sender_profile_id: data.sender_profile_id,
        text_content: data.text_content,
        attachment_type: data.attachment_type as AttachmentType | undefined,
        attachment_file_name: data.attachment_file_name,
        attachment_file_url: data.attachment_file_url,
        poll_id: data.poll_id,
        created_at: data.created_at,
        isSender: true,
        senderName: 'Você',
        senderAvatar: `https://ui-avatars.com/api/?name=Você&background=3b82f6&color=fff`,
        attachment: attachmentData ? {
          type: attachmentData.type,
          fileName: attachmentData.fileName,
          fileUrl: attachmentData.fileUrl
        } : undefined
      }

      setMessages(prev => [...prev, newMessage])
      
      // Atualizar última mensagem da conversa
      setConversations(prev => prev.map(c => 
        c.id === selectedConversationId 
          ? { ...c, lastMessage: text || `📎 ${attachmentData?.fileName || attachmentData?.type}`, lastMessageTimestamp: data.created_at }
          : c
      ).sort((a, b) => new Date(b.lastMessageTimestamp!).getTime() - new Date(a.lastMessageTimestamp!).getTime()))

    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
    }
  }

  const createPoll = async (question: string, options: string[], schoolId: string) => {
    if (!user || !selectedConversationId) return

    try {
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          question: question,
          school_id: schoolId
        })
        .select()
        .single()

      if (pollError) throw pollError

      const optionsToInsert = options.map(option => ({
        poll_id: poll.id,
        text: option
      }))

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsToInsert)

      if (optionsError) throw optionsError

      await sendMessage(`📊 Nova enquete: ${poll.question}`, {
        type: 'poll',
        pollId: poll.id
      })

      toast.success('Enquete criada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao criar enquete:', error)
      toast.error('Erro ao criar enquete')
    }
  }

  const voteOnPoll = async (messageId: string, optionId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('poll_votes')
        .insert({
          poll_option_id: optionId,
          voter_profile_id: user.id
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('Você já votou nesta opção')
          return
        }
        throw error
      }

      // Atualizar contagem de votos localmente
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId && msg.attachment?.pollData) {
          const updatedOptions = msg.attachment.pollData.options.map(opt =>
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
          )
          return {
            ...msg,
            attachment: {
              ...msg.attachment,
              pollData: { ...msg.attachment.pollData, options: updatedOptions }
            }
          }
        }
        return msg
      }))

      toast.success('Voto registrado!')
    } catch (error: any) {
      console.error('Erro ao votar:', error)
      toast.error('Erro ao registrar voto')
    }
  }

  const uploadFile = async (file: File, type: AttachmentType) => {
    if (!user) return null

    try {
      const fileName = `${user.id}/${Date.now()}_${file.name}`
      
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file)

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(data.path)

      return {
        fileName: file.name,
        fileUrl: urlData.publicUrl
      }
    } catch (error: any) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao fazer upload do arquivo')
      return null
    }
  }

  const createConversation = async (contact: { id: string; name: string; type: 'aluno' | 'professor' | 'turma' }) => {
    if (!user) return null

    try {
      console.log('Criando conversa para:', contact)

      // Verificar se já existe uma conversa com este contato
      const existingConversation = conversations.find(conv => {
        if (contact.type === 'turma') {
          return conv.is_group_chat && conv.group_chat_class_id === contact.id
        } else {
          return !conv.is_group_chat && conv.recipient?.id === contact.id
        }
      })

      if (existingConversation) {
        console.log('Conversa já existe:', existingConversation)
        return existingConversation
      }

      // Criar nova conversa
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          title: contact.type === 'turma' ? contact.name : null,
          is_group_chat: contact.type === 'turma',
          group_chat_class_id: contact.type === 'turma' ? contact.id : null,
          school_id: user.id // Usando o user.id como school_id temporariamente
        })
        .select()
        .single()

      if (error) throw error

      console.log('Conversa criada:', conversation)

      // Adicionar participantes
      const participants = [
        { conversation_id: conversation.id, profile_id: user.id }
      ]

      // Se não for turma, adicionar o contato individual como participante
      if (contact.type !== 'turma') {
        // Para conversas individuais, vamos criar um registro temporário com o ID do contato
        // Isso permitirá identificar com quem é a conversa
        participants.push({ 
          conversation_id: conversation.id, 
          profile_id: contact.id 
        })
      }

      console.log('Adicionando participantes:', participants)

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants)

      if (participantsError) {
        console.error('Erro ao adicionar participantes:', participantsError)
        // Se houver erro ao adicionar participantes, remover a conversa criada
        await supabase.from('conversations').delete().eq('id', conversation.id)
        throw participantsError
      }

      console.log('Participantes adicionados com sucesso')

      // Refetch conversations para atualizar a lista
      await fetchConversations()

      // Retornar a conversa criada
      const newConversation = {
        ...conversation,
        recipient: contact.type === 'turma' ? {
          id: contact.id,
          name: contact.name,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=3b82f6&color=fff`,
          type: 'class' as const,
          school_id: conversation.school_id
        } : {
          id: contact.id,
          name: contact.name,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=10b981&color=fff`,
          type: contact.type === 'professor' ? 'teacher' : 'student' as const,
          school_id: conversation.school_id
        },
        lastMessage: 'Conversa iniciada',
        lastMessageTimestamp: conversation.created_at,
        unreadCount: 0
      } as Conversation

      return newConversation
    } catch (error: any) {
      console.error('Erro ao criar conversa:', error)
      toast.error('Erro ao criar conversa: ' + (error.message || 'Erro desconhecido'))
      return null
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [user])

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId)
    }
  }, [selectedConversationId, user])

  return {
    conversations,
    selectedConversationId,
    setSelectedConversationId,
    messages,
    loading,
    sendMessage,
    createPoll,
    voteOnPoll,
    uploadFile,
    createConversation,
    refetchConversations: fetchConversations
  }
}
