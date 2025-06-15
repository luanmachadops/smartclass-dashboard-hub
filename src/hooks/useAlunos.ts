
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Aluno } from "@/types/aluno"
import { useAuth } from "@/contexts/AuthContext"

export function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchAlunos = async () => {
    setLoading(true)
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

    if (error) {
      toast.error("Erro ao carregar alunos")
      setLoading(false)
      return
    }

    // Garantir que sempre tenha foto_url e instrumento para cada aluno
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

    setAlunos(alunosCompletos)
    setLoading(false)
  }

  useEffect(() => {
    fetchAlunos()
  }, [])

  // Insere o aluno no Supabase e refaz o fetch
  const createAluno = async (formData: any) => {
    if (!user) {
      toast.error("É necessário estar autenticado para registrar um aluno.")
      return { success: false }
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profileData?.school_id) {
      console.error('Erro ao buscar perfil da escola:', profileError)
      toast.error("Não foi possível identificar sua escola para registrar o aluno.")
      return { success: false }
    }

    const { nome, email, telefone, turma, instrumento, foto_url } = formData;
    const { data, error } = await supabase.from("alunos").insert([{
      nome,
      email,
      telefone,
      turma_id: turma ? await getTurmaIdByNome(turma) : null,
      instrumento,
      foto_url: foto_url ?? "",
      school_id: profileData.school_id
    }])

    if (error) {
      console.error("Erro ao registrar aluno:", error)
      toast.error("Erro ao registrar aluno.")
      return { success: false }
    }

    toast.success("Aluno registrado!")
    // Refaz a busca para atualizar a lista
    await fetchAlunos()
    return { success: true }
  }

  // Função utilitária para pegar o id da turma pelo nome (opcional)
  async function getTurmaIdByNome(nome: string) {
    if (!nome) return null
    const { data } = await supabase.from("turmas").select("id").eq("nome", nome).maybeSingle()
    return data?.id ?? null
  }

  return { alunos, loading, createAluno }
}
