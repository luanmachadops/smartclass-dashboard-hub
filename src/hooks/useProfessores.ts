
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface Professor {
  id: string
  nome: string
  email: string
  telefone: string | null
  especialidades: string[] | null
  valor_hora: number | null
  ativo: boolean
}

export function useProfessores() {
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfessores = async () => {
    try {
      const { data, error } = await supabase
        .from('professores')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setProfessores(data || [])
    } catch (error) {
      console.error('Erro ao buscar professores:', error)
      toast.error('Erro ao carregar professores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfessores()
  }, [])

  return {
    professores,
    loading,
    refetch: fetchProfessores
  }
}
