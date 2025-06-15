
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Aula {
  id: string;
  turma_id: string;
  professor_id: string;
  data_aula: string;
  horario_inicio: string;
  horario_fim: string;
  status: 'agendada' | 'realizada' | 'cancelada';
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  professor?: {
    nome: string;
  };
}

export function useAulas(turmaId?: string) {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAulas = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("aulas")
        .select(`
          *,
          professores (
            nome
          )
        `)
        .order('data_aula', { ascending: true })
        .order('horario_inicio', { ascending: true });
      
      if (turmaId) {
        query = query.eq('turma_id', turmaId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar aulas:', error);
        throw error;
      }
      
      const aulasCompletas: Aula[] = (data || []).map((aula: any) => ({
        ...aula,
        professor: aula.professores ? { nome: aula.professores.nome } : undefined
      }));
      
      setAulas(aulasCompletas);
    } catch (error) {
      console.error('Erro no fetchAulas:', error);
      toast.error("Erro ao carregar aulas");
    } finally {
      setLoading(false);
    }
  };

  const createAula = async (aulaData: {
    turma_id: string;
    professor_id: string;
    data_aula: string;
    horario_inicio: string;
    horario_fim: string;
    observacoes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from("aulas")
        .insert(aulaData)
        .select(`
          *,
          professores (
            nome
          )
        `)
        .single();
      
      if (error) throw error;
      
      const aulaCompleta: Aula = {
        ...data,
        professor: data.professores ? { nome: data.professores.nome } : undefined
      };
      
      setAulas(prev => [...prev, aulaCompleta]);
      toast.success("Aula criada com sucesso!");
      return { success: true, data: aulaCompleta };
    } catch (error) {
      console.error('Erro ao criar aula:', error);
      toast.error("Erro ao criar aula");
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchAulas();
  }, [turmaId]);

  return { aulas, loading, createAula, refetch: fetchAulas };
}
