
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

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
  const { user } = useAuth()

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
    if (!user) {
      toast.error("É necessário estar autenticado para criar uma turma.")
      return { success: false }
    }

    try {
      console.log('Dados da turma para criar:', turmaData)
      
      // Tentar buscar o school_id do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Erro ao buscar perfil da escola:', profileError)
        toast.error("Erro ao identificar sua escola. Verifique se seu perfil está configurado corretamente.")
        return { success: false }
      }

      if (!profileData || !profileData.school_id) {
        console.error('Usuário sem school_id:', profileData)
        toast.error("Seu perfil não está associado a uma escola. Entre em contato com o suporte.")
        return { success: false }
      }

      const { data, error } = await supabase
        .from('turmas')
        .insert([{
          nome: turmaData.nome,
          instrumento: turmaData.instrumento,
          nivel: turmaData.nivel,
          dia_semana: "A definir",
          horario_inicio: "00:00",
          horario_fim: "00:00",
          vagas_total: 15, // Valor padrão
          school_id: profileData.school_id
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
      // Primeiro verificar se há alunos matriculados na turma
      const { data: alunos, error: alunosError } = await supabase
        .from('alunos')
        .select('id')
        .eq('turma_id', id)

      if (alunosError) throw alunosError

      if (alunos && alunos.length > 0) {
        toast.error(`Não é possível excluir a turma pois há ${alunos.length} aluno(s) matriculado(s). Transfira ou remova os alunos primeiro.`)
        return
      }

      // Se não há alunos, proceder com a exclusão
      const { error } = await supabase
        .from('turmas')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Turma excluída com sucesso!')
      fetchTurmas()
    } catch (error) {
      console.error('Erro ao excluir turma:', error)
      if (error.code === '23503') {
        toast.error('Não é possível excluir a turma pois há dados relacionados (alunos, aulas, etc.). Remova os dados relacionados primeiro.')
      } else {
        toast.error('Erro ao excluir turma')
      }
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
