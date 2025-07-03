import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useSchool } from "@/contexts/SchoolContext"

export interface Turma {
  id: string
  nome: string
  instrumento: string
  nivel: string
  dia_semana: string
  horario_inicio: string
  horario_fim: string
  valor_mensal: number | null
  ativa: boolean
  vagas_ocupadas: number
  vagas_total: number
  curso_id: string | null
  created_at: string
  updated_at: string
  school_id: string
  alunos?: number
  presenca?: number
  professores?: string[]
}

export function useTurmas() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const { schoolId, loading: schoolLoading } = useSchool()

  const fetchTurmas = async () => {
    if (!schoolId) {
      console.log('⏳ Aguardando school_id...')
      return
    }

    try {
      setLoading(true)
      console.log('🔍 Buscando turmas para a escola:', schoolId)

      const { data, error } = await supabase
        .from("turmas")
        .select("*")
        .eq('school_id', schoolId) // FILTRO ADICIONADO AQUI!
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erro ao buscar turmas:', error)
        throw error
      }
      
      console.log('🎯 Turmas carregadas para a escola:', schoolId, data)
      setTurmas(data || [])
    } catch (error) {
      console.error('❌ Erro no fetchTurmas:', error)
      toast.error(`Erro ao carregar turmas: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const addTurma = async (turmaData: Partial<Turma>) => {
    if (!schoolId) {
      toast.error("É necessário estar autenticado e ter uma escola associada para adicionar uma turma.");
      return { success: false };
    }

    try {

      if (!turmaData.nome) {
        toast.error('O nome da turma é obrigatório.');
        return { success: false };
      }

      const dadosParaEnviar = {
        nome: turmaData.nome,
        instrumento: turmaData.instrumento || 'Não especificado',
        nivel: turmaData.nivel || 'iniciante',
        dia_semana: turmaData.dia_semana || 'Não especificado',
        horario_inicio: turmaData.horario_inicio || '00:00',
        horario_fim: turmaData.horario_fim || '00:00',
        valor_mensal: turmaData.valor_mensal || null,
        vagas_total: turmaData.vagas_total || 10,
        curso_id: turmaData.curso_id || null,
        ativa: turmaData.ativa ?? true,
        school_id: schoolId,
      };

      const { data, error } = await supabase
        .from("turmas")
        .insert(dadosParaEnviar)
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar turma:', error);
        toast.error(`Erro ao adicionar turma: ${error.message}`);
        return { success: false, error };
      }

      toast.success("Turma adicionada com sucesso!");
      fetchTurmas(); // Atualiza a lista de turmas
      return { success: true, data };

    } catch (error: any) {
      console.error('Erro inesperado ao adicionar turma:', error);
      toast.error(`Erro inesperado: ${error.message}`);
      return { success: false, error };
    }
  };

  const deleteTurma = async (turmaId: string) => {
    try {
      const { error } = await supabase
        .from("turmas")
        .delete()
        .eq("id", turmaId)
      
      if (error) throw error
      
      setTurmas(prev => prev.filter(t => t.id !== turmaId))
      toast.success("Turma removida com sucesso!")
      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar turma:', error)
      toast.error("Erro ao remover turma")
      return { success: false, error }
    }
  }

  useEffect(() => {
    console.log('🔄 useEffect do useTurmas executado')
    console.log('🏫 School ID estado:', schoolId)
    console.log('⏳ School loading:', schoolLoading)
    
    if (!schoolLoading) {
      if (schoolId) {
        console.log('✅ School ID disponível, buscando turmas...')
        fetchTurmas()
      } else {
        console.log('❌ School ID não disponível, limpando dados...')
        setLoading(false)
        setTurmas([])
      }
    }
  }, [schoolId, schoolLoading])

  return { turmas, loading, addTurma, deleteTurma, refetch: fetchTurmas }
}
