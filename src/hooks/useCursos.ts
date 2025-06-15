
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Curso {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// AVISO: Tipagem temporária até os types do Supabase serem atualizados com a tabela cursos.
export function useCursos() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  // Usar 'any' até atualização automática dos types Supabase
  const fetchCursos = async () => {
    setLoading(true);
    // @ts-expect-error Supabase types ainda não reconhecem a tabela 'cursos'
    const { data, error } = await (supabase as any)
      .from("cursos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar cursos");
      setLoading(false);
      return;
    }
    setCursos((data || []) as Curso[]);
    setLoading(false);
  };

  const addCurso = async (curso: { nome: string; descricao?: string }) => {
    // @ts-expect-error Supabase types ainda não reconhecem a tabela 'cursos'
    const { data, error } = await (supabase as any)
      .from("cursos")
      .insert([curso])
      .select()
      .single();
    if (error) {
      toast.error("Erro ao adicionar curso");
      return { success: false };
    }
    toast.success("Curso adicionado!");
    await fetchCursos();
    return { success: true };
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  return { cursos, loading, addCurso, refetch: fetchCursos };
}

