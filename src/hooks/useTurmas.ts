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
  curso_id?: string
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
          alunos (id),
          chamadas (
            id,
            presencas (presente)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const turmasFormatadas = data?.map(turma => {
        // Calcular presença média real
        const todasChamadas = turma.chamadas || []
        let totalPresencas = 0
        let totalAulas = 0

        todasChamadas.forEach((chamada: any) => {
          const presencasAula = chamada.presencas || []
          if (presencasAula.length > 0) {
            totalAulas++
            const presentes = presencasAula.filter((p: any) => p.presente).length
            const totalAlunos = presencasAula.length
            if (totalAlunos > 0) {
              totalPresencas += (presentes / totalAlunos) * 100
            }
          }
        })

        const presencaMedia = totalAulas > 0 ? Math.round(totalPresencas / totalAulas) : 0
        const numeroAlunos = turma.alunos?.length || 0

        return {
          ...turma,
          professores: turma.turma_professores?.map((tp: any) => tp.professores.nome) || [],
          alunos: numeroAlunos,
          presenca: presencaMedia,
          vagas_total: turma.vagas_total || 15,
          vagas_ocupadas: numeroAlunos
        }
      }) || []

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
      console.log('Dados da turma para criar:', turmaData)
      
      // Horário padrão temporário (será definido posteriormente na criação de aulas)
      const { data, error } = await supabase
        .from('turmas')
        .insert([{
          nome: turmaData.nome,
          instrumento: turmaData.instrumento,
          nivel: turmaData.nivel,
          dia_semana: "A definir",
          horario_inicio: "00:00",
          horario_fim: "00:00",
          vagas_total: 15 // Valor padrão
        }])
        .select()
        .single()

      if (error) {
        console.error('Erro ao inserir turma:', error)
        throw error
      }

      console.log('Turma criada:', data)

      // Associar professores à turma se existirem
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
