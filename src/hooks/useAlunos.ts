
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Aluno } from "@/types/aluno"

export function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)

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

  // Agora realmente insere o aluno no Supabase e refaz o fetch
  const createAluno = async (formData: any) => {
    const { nome, email, telefone, turma, instrumento, foto_url } = formData;
    const { data, error } = await supabase.from("alunos").insert([{
      nome,
      email,
      telefone,
      turma_id: turma ? await getTurmaIdByNome(turma) : null,
      instrumento,
      foto_url
    }])

    if (error) {
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
