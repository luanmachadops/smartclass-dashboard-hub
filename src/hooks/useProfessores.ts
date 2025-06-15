
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

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
}

export function useProfessores() {
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchProfessores = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from("professores")
        .select("*")
        .order('nome')
      
      if (error) {
        console.error('Erro ao buscar professores:', error)
        throw error
      }
      
      setProfessores(data || [])
    } catch (error) {
      console.error('Erro no fetchProfessores:', error)
      toast.error("Erro ao carregar professores")
    } finally {
      setLoading(false)
    }
  }

  const addProfessor = async (professorData: {
    nome: string
    email: string
    telefone?: string
    especialidades?: string[]
    senha: string
  }) => {
    if (!user) {
      toast.error("É necessário estar autenticado para adicionar um professor.")
      return { success: false }
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profileData?.school_id) {
      console.error('Erro ao buscar perfil da escola:', profileError)
      toast.error("Não foi possível identificar sua escola para adicionar o professor.")
      return { success: false }
    }

    try {
      console.log('Criando professor via Edge Function:', professorData)
      
      const { data, error } = await supabase.functions.invoke('create-access', {
        body: {
          email: professorData.email,
          password: professorData.senha,
          nome_completo: professorData.nome,
          tipo_usuario: 'professor',
          school_id: profileData.school_id,
          metadata: {
            telefone: professorData.telefone,
            especialidades: professorData.especialidades
          }
        }
      })

      if (error) {
        console.error('Erro na Edge Function:', error)
        throw new Error(error.message)
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido')
      }

      console.log('Professor criado com sucesso:', data)
      toast.success("Professor adicionado com sucesso!")
      
      // Refaz a busca para atualizar a lista
      await fetchProfessores()
      return { success: true }
      
    } catch (error) {
      console.error('Erro no addProfessor:', error)
      toast.error(`Erro ao adicionar professor: ${error.message}`)
      return { success: false, error }
    }
  }

  useEffect(() => {
    fetchProfessores()
  }, [])

  return { professores, loading, addProfessor, refetch: fetchProfessores }
}
