import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { logger } from '@/services/logger'
import { validateData, registerSchema, loginSchema, inviteUserSchema, type RegisterData, type LoginData, type InviteUserData } from '@/schemas/validation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (data: RegisterData) => Promise<{ success: boolean; error?: any; needsEmailConfirmation?: boolean }>
  signIn: (data: LoginData) => Promise<{ success: boolean; error?: any }>
  signOut: () => Promise<{ success: boolean; error?: any }>
  inviteUser: (data: InviteUserData) => Promise<{ success: boolean; error?: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    logger.info('Inicializando AuthContext')
    
    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info('Evento de autenticação', {
          event,
          userEmail: session?.user?.email,
          userId: session?.user?.id
        })
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error('Erro ao obter sessão existente', { error: error.message }, error)
      } else {
        logger.info('Sessão existente verificada', {
          hasSession: !!session,
          userEmail: session?.user?.email
        })
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      logger.debug('Limpando subscription do AuthContext')
      subscription.unsubscribe()
    }
  }, [])
  const signUp = async (data: RegisterData) => {
    try {
      // Validar dados de entrada
      const validation = validateData(registerSchema, data)
      if (!validation.success) {
        const errorMessage = validation.errors.join(', ')
        logger.warn('Dados de registro inválidos', { errors: validation.errors })
        toast.error(`Dados inválidos: ${errorMessage}`)
        return { success: false, error: { message: errorMessage } }
      }

      const { email, password, directorName, schoolName } = validation.data
      
      logger.info('Iniciando processo de registro', {
        email,
        directorName,
        schoolName
      })
      
      // Criar usuário com dados que serão processados pelo trigger handle_new_user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo: directorName,
            nome_escola: schoolName,
            tipo_usuario: 'diretor'
          }
        }
      })

      if (signUpError) {
        logger.error('Erro ao criar usuário', {
          email,
          error: signUpError.message,
          code: signUpError.status
        }, signUpError)
        
        const userFriendlyMessage = this.getAuthErrorMessage(signUpError)
        toast.error(userFriendlyMessage)
        return { success: false, error: signUpError }
      }
      
      logger.info('Usuário criado com sucesso', {
        email: authData?.user?.email,
        userId: authData?.user?.id,
        needsConfirmation: !authData?.session
      })

      // Se precisa de confirmação por email
      if (!authData?.session) {
        toast.info('Verifique seu email para confirmar a conta')
        return { success: true, needsEmailConfirmation: true }
      }

      // Fazer login automaticamente se não precisar de confirmação
      logger.info('Fazendo login automático após registro')
      const loginResult = await signIn({ email, password })
      
      if (loginResult.success) {
        logger.info('Registro e login completados com sucesso', { email })
        toast.success('Conta criada com sucesso!')
      }
      
      return loginResult
    } catch (error) {
      logger.error('Erro inesperado no processo de registro', {
        email: data.email
      }, error as Error)
      toast.error('Erro inesperado no registro')
      return { success: false, error }
    }
  }

  const signIn = async (data: LoginData) => {
    try {
      // Validar dados de entrada
      const validation = validateData(loginSchema, data)
      if (!validation.success) {
        const errorMessage = validation.errors.join(', ')
        logger.warn('Dados de login inválidos', { errors: validation.errors })
        toast.error(`Dados inválidos: ${errorMessage}`)
        return { success: false, error: { message: errorMessage } }
      }

      const { email, password } = validation.data
      
      logger.info('Tentativa de login', { email })
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        logger.warn('Falha no login', {
          email,
          error: error.message,
          code: error.status
        })
        
        const userFriendlyMessage = this.getAuthErrorMessage(error)
        toast.error(userFriendlyMessage)
        return { success: false, error }
      }
      
      logger.info('Login realizado com sucesso', {
        email: authData.user?.email,
        userId: authData.user?.id
      })
      
      toast.success('Login realizado com sucesso!')
      return { success: true }
    } catch (error) {
      logger.error('Erro inesperado no login', {
        email: data.email
      }, error as Error)
      toast.error('Erro inesperado no login')
      return { success: false, error }
    }
  }

  const signOut = async () => {
    try {
      logger.info('Iniciando logout', { userId: user?.id })
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        logger.error('Erro no logout', {
          userId: user?.id,
          error: error.message
        }, error)
        toast.error('Erro ao fazer logout')
        return { success: false, error }
      }
      
      logger.info('Logout realizado com sucesso', { userId: user?.id })
      toast.success('Logout realizado com sucesso!')
      return { success: true }
    } catch (error) {
      logger.error('Erro inesperado no logout', {
        userId: user?.id
      }, error as Error)
      toast.error('Erro inesperado no logout')
      return { success: false, error }
    }
  }

  const inviteUser = async (data: InviteUserData) => {
    try {
      // Validar dados de entrada
      const validation = validateData(inviteUserSchema, data)
      if (!validation.success) {
        const errorMessage = validation.errors.join(', ')
        logger.warn('Dados de convite inválidos', { errors: validation.errors })
        toast.error(`Dados inválidos: ${errorMessage}`)
        return { success: false, error: { message: errorMessage } }
      }

      const { email, nomeCompleto, tipoUsuario, schoolId } = validation.data
      
      logger.info('Convidando usuário', {
        email,
        nomeCompleto,
        tipoUsuario,
        schoolId,
        invitedBy: user?.id
      })
      
      // Nota: Esta função precisa ser implementada como uma Edge Function do Supabase
      // pois requer privilégios de admin para convidar usuários
      const { data: responseData, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          nome_completo: nomeCompleto,
          tipo_usuario: tipoUsuario,
          school_id: schoolId
        }
      })

      if (error) {
        logger.error('Erro ao convidar usuário', {
          email,
          tipoUsuario,
          schoolId,
          error: error.message,
          invitedBy: user?.id
        }, error)
        toast.error('Erro ao enviar convite: ' + error.message)
        return { success: false, error }
      }

      logger.info('Convite enviado com sucesso', {
        email,
        tipoUsuario,
        schoolId,
        invitedBy: user?.id
      })
      toast.success('Convite enviado com sucesso!')
      return { success: true }
    } catch (error) {
      logger.error('Erro inesperado ao convidar usuário', {
        email: data.email,
        invitedBy: user?.id
      }, error as Error)
      toast.error('Erro inesperado ao enviar convite')
      return { success: false, error }
    }
  }

  // Método helper para converter erros de auth em mensagens amigáveis
  const getAuthErrorMessage = (error: any): string => {
    const errorMessage = error?.message?.toLowerCase() || ''
    
    if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid')) {
      return 'Email ou senha incorretos'
    }
    if (errorMessage.includes('email already registered') || errorMessage.includes('already registered')) {
      return 'Este email já está cadastrado'
    }
    if (errorMessage.includes('weak password') || errorMessage.includes('password')) {
      return 'Senha muito fraca. Use pelo menos 6 caracteres'
    }
    if (errorMessage.includes('email not confirmed')) {
      return 'Email não confirmado. Verifique sua caixa de entrada'
    }
    if (errorMessage.includes('too many requests')) {
      return 'Muitas tentativas. Tente novamente em alguns minutos'
    }
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return 'Erro de conexão. Verifique sua internet'
    }
    
    // Fallback para erros não mapeados
    return error?.message || 'Erro desconhecido'
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    inviteUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
