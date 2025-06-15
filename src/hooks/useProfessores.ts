
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export interface Professor {
  id: string
  nome: string
  email: string
  telefone: string | null
  especialidades: string[] | null
  valor_hora: number | null
  ativo: boolean
  avaliacao_media?: number
  total_aulas?: number
  presenca_media?: number
}

export function useProfessores() {
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchProfessores = async () => {
    try {
      const { data, error } = await supabase
        .from('professores')
        .select(`
          *,
          turma_professores (
            turma_id,
            turmas (
              id,
              nome,
              chamadas (
                id,
                presencas (presente)
              )
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calcular estatísticas de presença e avaliação para cada professor
      const professoresComEstatisticas = data?.map(professor => {
        const turmas = professor.turma_professores?.map(tp => tp.turmas) || []
        let totalAulas = 0
        let totalPresencas = 0
        let somaPresencaMedia = 0

        turmas.forEach(turma => {
          const chamadas = turma?.chamadas || []
          chamadas.forEach(chamada => {
            const presencas = chamada.presencas || []
            if (presencas.length > 0) {
              totalAulas++
              const presentes = presencas.filter(p => p.presente).length
              const percentualPresenca = (presentes / presencas.length) * 100
              somaPresencaMedia += percentualPresenca
              totalPresencas += presentes
            }
          })
        })

        const presencaMedia = totalAulas > 0 ? Math.round(somaPresencaMedia / totalAulas) : 0
        
        // Calcular avaliação baseada na presença (escala de 1-5)
        let avaliacaoMedia = 3.0 // Padrão neutro
        if (presencaMedia >= 95) avaliacaoMedia = 5.0
        else if (presencaMedia >= 90) avaliacaoMedia = 4.8
        else if (presencaMedia >= 85) avaliacaoMedia = 4.5
        else if (presencaMedia >= 80) avaliacaoMedia = 4.2
        else if (presencaMedia >= 75) avaliacaoMedia = 4.0
        else if (presencaMedia >= 70) avaliacaoMedia = 3.8
        else if (presencaMedia >= 65) avaliacaoMedia = 3.5
        else if (presencaMedia >= 60) avaliacaoMedia = 3.2
        else if (presencaMedia < 60) avaliacaoMedia = 2.8

        return {
          ...professor,
          avaliacao_media: avaliacaoMedia,
          total_aulas: totalAulas,
          presenca_media: presencaMedia
        }
      }) || []

      setProfessores(professoresComEstatisticas)
    } catch (error) {
      console.error('Erro ao buscar professores:', error)
      toast.error('Erro ao carregar professores')
    } finally {
      setLoading(false)
    }
  }

  const createProfessor = async (professorData: Omit<Professor, 'id' | 'school_id' | 'avaliacao_media' | 'total_aulas' | 'presenca_media'>) => {
    if (!user) {
      toast.error("É necessário estar autenticado para adicionar um professor.")
      return { success: false }
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData?.school_id) {
      console.error('Erro ao buscar perfil da escola:', profileError)
      toast.error("Não foi possível identificar sua escola para adicionar o professor.")
      return { success: false }
    }

    const { data, error } = await supabase
      .from('professores')
      .insert([{ ...professorData, school_id: profileData.school_id }])
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao adicionar professor:', error)
      toast.error('Erro ao adicionar professor')
      return { success: false }
    }

    toast.success('Professor adicionado com sucesso!')
    await fetchProfessores()
    return { success: true, data }
  }

  useEffect(() => {
    fetchProfessores()
  }, [])

  return {
    professores,
    loading,
    refetch: fetchProfessores,
    createProfessor
  }
}
