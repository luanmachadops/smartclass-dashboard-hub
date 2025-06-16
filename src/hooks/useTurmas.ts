
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

export interface Turma {
  id: string
  nome: string
  instrumento: string
  nivel: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
  valor_mensal: number | null
  ativa: boolean
  vagas_ocupadas: number
  vagas_total: number
  curso_id: string | null
  created_at: string
  updated_at: string
  school_id: string
  alunos?: number
  presenca?: number
  professores?: string[]
}

export function useTurmas() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchTurmas = async () => {
    try {
      setLoading(true)
      console.log('🔍 Buscando turmas...')
      
      // Verificar school_id do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user?.id)
        .maybeSingle()

      console.log('📋 Dados do perfil (turmas):', profileData)
      
      if (profileError || !profileData?.school_id) {
        console.error('Erro no perfil ou school_id ausente:', profileError)
        throw new Error('Não foi possível identificar sua escola')
      }

      const schoolId = profileData.school_id

      const { data, error } = await supabase
        .from("turmas")
        .select("*")
        .eq('school_id', schoolId) // FILTRO ADICIONADO AQUI!
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erro ao buscar turmas:', error)
        throw error
      }
      
      console.log('🎯 Turmas carregadas para a escola:', schoolId, data)
      setTurmas(data || [])
    } catch (error) {
      console.error('❌ Erro no fetchTurmas:', error)
      toast.error(`Erro ao carregar turmas: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const addTurma = async (turmaData: any) => {
    if (!user) {
      toast.error("É necessário estar autenticado para adicionar uma turma.")
      return { success: false }
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profileData?.school_id) {
      console.error('Erro ao buscar perfil da escola:', profileError)
      toast.error("Não foi possível identificar sua escola para adicionar a turma.")
      return { success: false }
    }

    try {
      console.log('Adicionando turma:', turmaData)
      
      const { data, error } = await supabase
        .from("turmas")
        .insert({
          ...turmaData,
          school_id: profileData.school_id // INCLUINDO O SCHOOL_ID!
        })
        .select()
        .single()
      
      if (error) {
        console.error('Erro ao adicionar turma:', error)
        throw error
      }
      
      setTurmas(prev => [data, ...prev])
      
      console.log('Turma adicionada com sucesso:', data)
      toast.success("Turma adicionada com sucesso!")
      return { success: true, data }
    } catch (error) {
      console.error('Erro no addTurma:', error)
      toast.error("Erro ao adicionar turma")
      return { success: false, error }
    }
  }

  const deleteTurma = async (turmaId: string) => {
    try {
      const { error } = await supabase
        .from("turmas")
        .delete()
        .eq("id", turmaId)
      
      if (error) throw error
      
      setTurmas(prev => prev.filter(t => t.id !== turmaId))
      toast.success("Turma removida com sucesso!")
      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar turma:', error)
      toast.error("Erro ao remover turma")
      return { success: false, error }
    }
  }

  useEffect(() => {
    console.log('🔄 useEffect do useTurmas executado')
    console.log('👤 User estado:', !!user)
    
    if (user) {
      console.log('✅ Usuário logado, buscando turmas...')
      fetchTurmas()
    } else {
      console.log('❌ Usuário não logado, limpando dados...')
      setLoading(false)
      setTurmas([])
    }
  }, [user])

  return { turmas, loading, addTurma, deleteTurma, refetch: fetchTurmas }
}
