
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, nomeCompleto: string, nomeEscola: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, nomeCompleto: string, nomeEscola: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome_completo: nomeCompleto,
          nome_escola: nomeEscola
        }
      }
    })

    if (error) {
      console.error('Erro no cadastro:', error)
      if (error.message.includes('already')) {
        toast.error('Este email já está cadastrado. Tente fazer login.')
      } else {
        toast.error('Erro ao criar conta: ' + error.message)
      }
    } else {
      toast.success('Conta criada com sucesso! Verifique seu email para confirmar.')
    }

    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Erro no login:', error)
      if (error.message.includes('Invalid')) {
        toast.error('Email ou senha incorretos.')
      } else {
        toast.error('Erro ao fazer login: ' + error.message)
      }
    } else {
      toast.success('Login realizado com sucesso!')
    }

    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    toast.success('Logout realizado com sucesso!')
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
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
