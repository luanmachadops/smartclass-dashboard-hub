
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Aluno } from "@/types/aluno"

export function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
      const alunosCompletos: Aluno[] = data.map((aluno: any) => ({
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

    fetchAlunos()
  }, [])

  return { alunos, loading }
}
