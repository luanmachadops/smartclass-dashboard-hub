import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useSchool } from "@/contexts/SchoolContext"

interface Professor {
  id: string
  nome: string
  email: string
  telefone: string | null
  especialidades: string[] | null
  valor_hora: number | null
  ativo: boolean
  user_id: string | null
  created_at: string
  updated_at: string
  avaliacao_media?: number
  total_aulas?: number
  presenca_media?: number
}

export function useProfessores() {
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const { schoolId, loading: schoolLoading } = useSchool()

  const fetchProfessores = async () => {
    if (!schoolId) {
      console.log('⏳ Aguardando school_id...')
      return
    }

    try {
      setLoading(true)
      console.log('🔍 Buscando professores para a escola:', schoolId)
      
      const { data, error } = await supabase
        .from("professores")
        .select("*")
        .eq('school_id', schoolId) // FILTRO ADICIONADO AQUI!
        .order('nome')
      
      if (error) {
        console.error('Erro ao buscar professores:', error)
        throw error
      }
      
      console.log('👨‍🏫 Professores carregados para a escola:', schoolId, data)
      setProfessores(data || [])
    } catch (error) {
      console.error('❌ Erro no fetchProfessores:', error)
      toast.error(`Erro ao carregar professores: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🔄 useEffect do useProfessores executado')
    console.log('🏫 School ID estado:', schoolId)
    console.log('⏳ School loading:', schoolLoading)
    
    if (!schoolLoading) {
      if (schoolId) {
        console.log('✅ School ID disponível, buscando professores...')
        fetchProfessores()
      } else {
        console.log('❌ School ID não disponível, limpando dados...')
        setLoading(false)
        setProfessores([])
      }
    }
  }, [schoolId, schoolLoading])

  return { professores, loading, refetch: fetchProfessores }
}
