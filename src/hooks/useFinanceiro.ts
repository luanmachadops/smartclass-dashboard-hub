
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface FinanceiroItem {
  id: string
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

  const fetchFinanceiro = async () => {
    try {
      const { data, error } = await supabase
        .from('financeiro')
        .select(`
          *,
          alunos (nome),
          professores (nome)
        `)
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
    fetchFinanceiro()
  }, [])

  return {
    financeiro,
    loading,
    refetch: fetchFinanceiro
  }
}
