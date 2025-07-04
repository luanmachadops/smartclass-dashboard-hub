import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface School {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string
  cnpj?: string
  telefone?: string
  cep?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
}

interface SchoolUpdateData {
  cnpj?: string
  telefone?: string
  cep?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
}

interface SchoolContextType {
  school: School | null
  schoolId: string | null
  loading: boolean
  refreshSchool: () => Promise<void>
  updateSchool: (schoolId: string, data: SchoolUpdateData) => Promise<boolean>
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined)

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [school, setSchool] = useState<School | null>(null)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, session } = useAuth()

  const loadSchool = async () => {
    if (!user || !session) {
      console.log('❌ SchoolContext: Usuário ou sessão não disponível')
      setLoading(false)
      return
    }

    try {
      console.log('🏫 SchoolContext: Carregando dados da escola para o usuário:', user.id)
      setLoading(true)
      
      // Buscar o perfil do usuário para obter o school_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('❌ SchoolContext: Erro ao buscar perfil:', profileError)
        toast.error('Erro ao carregar dados da escola')
        setLoading(false)
        return
      }

      console.log('📋 SchoolContext: Perfil encontrado:', profile)

      if (!profile?.school_id) {
        console.error('❌ SchoolContext: School ID não encontrado no perfil do usuário')
        toast.error('Escola não encontrada para este usuário')
        setLoading(false)
        return
      }

      console.log('✅ SchoolContext: School ID encontrado:', profile.school_id)
      setSchoolId(profile.school_id)

      // Buscar os dados completos da escola
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', profile.school_id)
        .maybeSingle()

      if (schoolError) {
        console.error('❌ SchoolContext: Erro ao buscar dados da escola:', schoolError)
        toast.error('Erro ao carregar informações da escola')
        setLoading(false)
        return
      }

      console.log('🏫 SchoolContext: Dados da escola encontrados:', schoolData)

      if (!schoolData) {
        console.error('❌ SchoolContext: Dados da escola não encontrados')
        toast.error('Escola não encontrada')
        setLoading(false)
        return
      }

      console.log('🎉 SchoolContext: Escola carregada com sucesso:', schoolData.name)
      setSchool(schoolData)
      setLoading(false)
    } catch (error) {
      console.error('Erro geral ao carregar escola:', error)
      toast.error('Erro inesperado ao carregar dados da escola')
      setLoading(false)
    }
  }

  const refreshSchool = async () => {
    setLoading(true)
    await loadSchool()
  }

  const updateSchool = async (schoolId: string, data: SchoolUpdateData): Promise<boolean> => {
    try {
      console.log('🏫 SchoolContext: Atualizando dados da escola:', schoolId, data)
      
      const { error } = await supabase
        .from('schools')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', schoolId)

      if (error) {
        console.error('❌ SchoolContext: Erro ao atualizar escola:', error)
        toast.error('Erro ao atualizar dados da escola')
        return false
      }

      console.log('✅ SchoolContext: Escola atualizada com sucesso')
      
      // Atualizar o estado local
      if (school) {
        setSchool({
          ...school,
          ...data,
          updated_at: new Date().toISOString()
        })
      }
      
      return true
    } catch (error) {
      console.error('💥 SchoolContext: Erro inesperado ao atualizar escola:', error)
      toast.error('Erro inesperado ao atualizar dados da escola')
      return false
    }
  }

  useEffect(() => {
    if (user && session) {
      loadSchool()
    } else {
      setSchool(null)
      setSchoolId(null)
      setLoading(false)
    }
  }, [user, session])

  const value = {
    school,
    schoolId,
    loading,
    refreshSchool,
    updateSchool
  }

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>
}

export function useSchool() {
  const context = useContext(SchoolContext)
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider')
  }
  return context
}