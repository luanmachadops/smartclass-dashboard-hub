import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Aluno } from "@/types/aluno"
import { useSchool } from "@/contexts/SchoolContext"

export function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const { schoolId, loading: schoolLoading } = useSchool()

  const fetchAlunos = async () => {
    if (!schoolId) {
      console.log('⏳ Aguardando school_id...')
      return
    }

    setLoading(true)
    console.log('🔍 Iniciando busca de alunos para a escola:', schoolId)
    
    try {

      const { data, error } = await supabase
        .from("alunos")
        .select(
          `
            *,
            turmas (
              nome
            )
          `
        )
        .eq('school_id', schoolId) // FILTRO ADICIONADO AQUI!
        .order('created_at', { ascending: false })

      console.log('📚 Dados dos alunos recebidos para a escola:', schoolId, data)
      console.log('❌ Erro na busca de alunos:', error)

      if (error) {
        throw error
      }

      const alunosCompletos: Aluno[] = (data || []).map((aluno: any) => ({
        id: aluno.id,
        nome: aluno.nome,
        email: aluno.email,
        telefone: aluno.telefone,
        endereco: aluno.endereco,
        data_nascimento: aluno.data_nascimento,
        responsavel: aluno.responsavel,
        telefone_responsavel: aluno.telefone_responsavel,
        ativo: aluno.ativo,
        turma_id: aluno.turma_id,
        created_at: aluno.created_at,
        updated_at: aluno.updated_at,
        turma: aluno.turmas ? { nome: aluno.turmas.nome } : undefined,
        foto_url: aluno.foto_url ?? "",
        instrumento: aluno.instrumento ?? "",
      }))

      console.log('✅ Alunos processados para a escola:', alunosCompletos.length)
      setAlunos(alunosCompletos)
    } catch (error) {
      console.error("❌ Erro ao carregar alunos:", error)
      toast.error(`Erro ao carregar alunos: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createAluno = async (alunoData: Omit<Aluno, 'id' | 'created_at' | 'updated_at' | 'turma'>) => {
    if (!schoolId) {
      toast.error("É necessário estar autenticado e ter uma escola associada para registrar um aluno.");
      return { success: false };
    }

    try {

      const { data, error } = await supabase
        .from('alunos')
        .insert([{ 
          ...alunoData, 
          school_id: schoolId,
          turma_id: alunoData.turma_id, // turma_id já vem como ID correto
        }])
        .select();

      if (error) {
        console.error("Erro ao criar aluno:", error);
        toast.error(`Erro ao criar aluno: ${error.message}`);
        return { success: false };
      }

      toast.success("Aluno criado com sucesso!");
      fetchAlunos(); // Re-fetch para atualizar a lista
      return { success: true, data };

    } catch (error: any) {
      console.error("Erro inesperado:", error);
      toast.error(`Erro inesperado: ${error.message}`);
      return { success: false };
    }
  };



  useEffect(() => {
    console.log('🔄 useEffect do useAlunos executado')
    console.log('🏫 School ID estado:', schoolId)
    console.log('⏳ School loading:', schoolLoading)
    
    if (!schoolLoading) {
      if (schoolId) {
        console.log('✅ School ID disponível, buscando alunos...')
        fetchAlunos()
      } else {
        console.log('❌ School ID não disponível, limpando dados...')
        setLoading(false)
        setAlunos([])
      }
    }
  }, [schoolId, schoolLoading])

  return { alunos, loading, createAluno, refetch: fetchAlunos }
}
