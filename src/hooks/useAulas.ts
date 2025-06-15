
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface Aula {
  id: string
  turma_id: string | null
  professor_id: string | null
  data_aula: string
  horario_inicio: string
  horario_fim: string
  status: "agendada" | "realizada" | "cancelada" | null
  observacoes: string | null
  created_at: string | null
  updated_at: string | null
  professor?: {
    nome: string
  }
}

export function useAulas(turmaId?: string) {
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAulas = async () => {
    if (!turmaId) {
      setAulas([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from("aulas")
      .select(`
        *,
        professor:professores(nome)
      `)
      .eq("turma_id", turmaId)
      .order("data_aula", { ascending: true })

    if (error) {
      console.error("Erro ao carregar aulas:", error)
      toast.error("Erro ao carregar aulas")
      setLoading(false)
      return
    }

    const aulasFormatadas: Aula[] = (data || []).map((aula: any) => ({
      id: aula.id,
      turma_id: aula.turma_id,
      professor_id: aula.professor_id,
      data_aula: aula.data_aula,
      horario_inicio: aula.horario_inicio,
      horario_fim: aula.horario_fim,
      status: aula.status as "agendada" | "realizada" | "cancelada" | null,
      observacoes: aula.observacoes,
      created_at: aula.created_at,
      updated_at: aula.updated_at,
      professor: aula.professor
    }))

    setAulas(aulasFormatadas)
    setLoading(false)
  }

  useEffect(() => {
    fetchAulas()
  }, [turmaId])

  const createAula = async (aulaData: {
    turma_id: string
    professor_id?: string
    data_aula: string
    horario_inicio: string
    horario_fim: string
    observacoes?: string
  }) => {
    const { data, error } = await supabase
      .from("aulas")
      .insert([aulaData])
      .select()

    if (error) {
      console.error("Erro ao criar aula:", error)
      toast.error("Erro ao criar aula")
      return { success: false }
    }

    toast.success("Aula criada com sucesso!")
    await fetchAulas()
    return { success: true, data }
  }

  return { aulas, loading, createAula, refetch: fetchAulas }
}
