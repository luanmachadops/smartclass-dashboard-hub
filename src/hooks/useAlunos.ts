
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface Aluno {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  responsavel: string | null
  telefone_responsavel: string | null
  turma_id: string | null
  ativo: boolean
  created_at: string | null
  turma?: {
    nome: string
  }
}

export function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlunos = async () => {
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select(`
          *,
          turmas (nome)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setAlunos(data || [])
    } catch (error) {
      console.error('Erro ao buscar alunos:', error)
      toast.error('Erro ao carregar alunos')
    } finally {
      setLoading(false)
    }
  }

  const createAluno = async (alunoData: any) => {
    try {
      // Buscar ID da turma pelo nome
      let turmaId = null
      if (alunoData.turma) {
        const { data: turmaData } = await supabase
          .from('turmas')
          .select('id')
          .eq('nome', alunoData.turma)
          .single()
        
        turmaId = turmaData?.id
      }

      const { error } = await supabase
        .from('alunos')
        .insert([{
          nome: alunoData.nome,
          email: alunoData.email,
          telefone: alunoData.telefone,
          responsavel: alunoData.responsavel || null,
          telefone_responsavel: alunoData.telefoneResponsavel || null,
          turma_id: turmaId
        }])

      if (error) throw error

      // Atualizar vagas ocupadas da turma manualmente
      if (turmaId) {
        const { data: turmaAtual } = await supabase
          .from('turmas')
          .select('vagas_ocupadas')
          .eq('id', turmaId)
          .single()

        if (turmaAtual) {
          await supabase
            .from('turmas')
            .update({ vagas_ocupadas: (turmaAtual.vagas_ocupadas || 0) + 1 })
            .eq('id', turmaId)
        }
      }

      toast.success('Aluno registrado com sucesso!')
      fetchAlunos()
      return { success: true }
    } catch (error) {
      console.error('Erro ao criar aluno:', error)
      toast.error('Erro ao registrar aluno')
      return { success: false, error }
    }
  }

  useEffect(() => {
    fetchAlunos()
  }, [])

  return {
    alunos,
    loading,
    createAluno,
    refetch: fetchAlunos
  }
}
