
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface Turma {
  id: string
  nome: string
  instrumento: string
  nivel: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
  valor_mensal: number | null
  vagas_total: number
  vagas_ocupadas: number
  ativa: boolean
  professores?: string[]
  alunos?: number
  presenca?: number
}

export function useTurmas() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTurmas = async () => {
    try {
      const { data, error } = await supabase
        .from('turmas')
        .select(`
          *,
          turma_professores (
            professores (nome)
          ),
          alunos (id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const turmasFormatadas = data?.map(turma => ({
        ...turma,
        professores: turma.turma_professores?.map((tp: any) => tp.professores.nome) || [],
        alunos: turma.alunos?.length || 0,
        presenca: Math.floor(Math.random() * 20) + 80 // Temporário
      })) || []

      setTurmas(turmasFormatadas)
    } catch (error) {
      console.error('Erro ao buscar turmas:', error)
      toast.error('Erro ao carregar turmas')
    } finally {
      setLoading(false)
    }
  }

  const createTurma = async (turmaData: any) => {
    try {
      const { data, error } = await supabase
        .from('turmas')
        .insert([{
          nome: turmaData.nome,
          instrumento: turmaData.instrumento,
          nivel: turmaData.nivel,
          dia_semana: turmaData.dia,
          horario_inicio: turmaData.horario.split(' - ')[0],
          horario_fim: turmaData.horario.split(' - ')[1],
          vagas_total: parseInt(turmaData.maxAlunos)
        }])
        .select()
        .single()

      if (error) throw error

      // Associar professores à turma
      if (turmaData.professores?.length > 0) {
        const { data: professoresData } = await supabase
          .from('professores')
          .select('id, nome')
          .in('nome', turmaData.professores)

        if (professoresData?.length > 0) {
          const associations = professoresData.map(prof => ({
            turma_id: data.id,
            professor_id: prof.id
          }))

          await supabase
            .from('turma_professores')
            .insert(associations)
        }
      }

      toast.success('Turma criada com sucesso!')
      fetchTurmas()
      return { success: true }
    } catch (error) {
      console.error('Erro ao criar turma:', error)
      toast.error('Erro ao criar turma')
      return { success: false, error }
    }
  }

  const deleteTurma = async (id: string) => {
    try {
      const { error } = await supabase
        .from('turmas')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Turma excluída com sucesso!')
      fetchTurmas()
    } catch (error) {
      console.error('Erro ao excluir turma:', error)
      toast.error('Erro ao excluir turma')
    }
  }

  useEffect(() => {
    fetchTurmas()
  }, [])

  return {
    turmas,
    loading,
    createTurma,
    deleteTurma,
    refetch: fetchTurmas
  }
}
