
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useSchool } from '@/contexts/SchoolContext'

export interface FinanceiroItem {
  id: string
  school_id: string
  tipo: string
  categoria: string
  descricao: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: string | null
  metodo_pagamento: string | null
  observacoes: string | null
  aluno_id: string | null
  professor_id: string | null
  aluno?: {
    nome: string
  }
  professor?: {
    nome: string
  }
}

export function useFinanceiro() {
  const [financeiro, setFinanceiro] = useState<FinanceiroItem[]>([])
  const [loading, setLoading] = useState(true)
  const { schoolId, loading: schoolLoading } = useSchool()

  const fetchFinanceiro = async () => {
    if (!schoolId) {
      console.log('⏳ Aguardando school_id...')
      return
    }

    try {
      setLoading(true)
      console.log('🔍 Buscando dados financeiros para a escola:', schoolId)
      
      const { data, error } = await supabase
        .from('financeiro')
        .select(`
          *,
          alunos (nome),
          professores (nome)
        `)
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setFinanceiro(data || [])
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error)
      toast.error('Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!schoolLoading && schoolId) {
      fetchFinanceiro()
    }
  }, [schoolId, schoolLoading])

  return {
    financeiro,
    loading: loading || schoolLoading,
    refetch: fetchFinanceiro
  }
}
