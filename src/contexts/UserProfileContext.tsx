import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { UserService, UserProfileData } from '@/services/userService'
import { toast } from '@/hooks/use-toast'

// Usar o tipo do serviço
type UserProfile = UserProfileData

interface UserProfileContextType {
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  isDirector: boolean
  isProfessor: boolean
  isAluno: boolean
  isSecretario: boolean
  canManageUsers: boolean
  canManageFinanceiro: boolean
  canManageTurmas: boolean
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<Pick<UserProfile, 'nome_completo' | 'telefone'>>) => Promise<boolean>
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined)

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, session } = useAuth()

  const loadProfile = async () => {
    if (!user || !session) {
      console.log('❌ UserProfile: Usuário ou sessão não disponível')
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      console.log('👤 UserProfile: Carregando perfil do usuário:', user.id)
      setLoading(true)
      
      const profileData = await UserService.getCurrentUserProfile()

      if (profileData) {
        console.log('✅ UserProfile: Perfil carregado:', {
          nome: profileData.nome_completo,
          tipo: profileData.tipo_usuario,
          school_id: profileData.school_id
        })
        
        setProfile(profileData)
      } else {
        console.error('❌ UserProfile: Perfil não encontrado para o usuário')
        toast({
          title: "Erro",
          description: "Perfil não encontrado",
          variant: "destructive",
        })
        setProfile(null)
      }
    } catch (error) {
      console.error('💥 UserProfile: Erro inesperado ao carregar perfil:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar perfil",
        variant: "destructive",
      })
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    await loadProfile()
  }

  useEffect(() => {
    if (user && session) {
      loadProfile()
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [user, session])

  // Computed properties baseadas no tipo de usuário
  const isAdmin = profile?.tipo_usuario === 'admin'
  const isDirector = profile?.tipo_usuario === 'diretor'
  const isProfessor = profile?.tipo_usuario === 'professor'
  const isAluno = profile?.tipo_usuario === 'aluno'
  const isSecretario = profile?.tipo_usuario === 'secretario'
  
  // Permissões derivadas
  const canManageUsers = isAdmin || isDirector
  const canManageFinanceiro = isAdmin || isDirector || isSecretario
  const canManageTurmas = isAdmin || isDirector || isSecretario

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'nome_completo' | 'telefone'>>) => {
    if (!user || !profile) return false

    try {
      const success = await UserService.updateCurrentUserProfile(updates)

      if (success) {
        // Atualizar o estado local
        setProfile(prev => prev ? { 
          ...prev, 
          ...updates,
          updated_at: new Date().toISOString()
        } : null)
        
        toast({
          title: "Sucesso",
          description: "Perfil atualizado com sucesso.",
        })
        
        return true
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o perfil.",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error('Erro inesperado ao atualizar perfil:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar o perfil.",
        variant: "destructive",
      })
      return false
    }
  }

  const value = {
    profile,
    loading,
    isAdmin,
    isDirector,
    isProfessor,
    isAluno,
    isSecretario,
    canManageUsers,
    canManageFinanceiro,
    canManageTurmas,
    refreshProfile,
    updateProfile
  }

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile() {
  const context = useContext(UserProfileContext)
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider')
  }
  return context
}