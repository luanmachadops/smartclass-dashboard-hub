
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface Curso {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useCursos() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth()

  const fetchCursos = async () => {
    try {
      setLoading(true);
      console.log('Buscando cursos...');
      
      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar cursos:', error);
        throw error;
      }
      
      console.log('Cursos carregados:', data);
      setCursos(data || []);
    } catch (error) {
      console.error('Erro no fetchCursos:', error);
      toast.error("Erro ao carregar cursos");
    } finally {
      setLoading(false);
    }
  };

  const addCurso = async (curso: { nome: string; descricao?: string }) => {
    if (!user) {
      toast.error("É necessário estar autenticado para adicionar um curso.")
      return { success: false }
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profileData?.school_id) {
      console.error('Erro ao buscar perfil da escola:', profileError)
      toast.error("Não foi possível identificar sua escola para adicionar o curso.")
      return { success: false }
    }

    try {
      console.log('Adicionando curso:', curso);
      
      const { data, error } = await supabase
        .from("cursos")
        .insert({
          nome: curso.nome,
          descricao: curso.descricao || null,
          school_id: profileData.school_id
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao adicionar curso:', error);
        throw error;
      }
      
      setCursos(prev => [data, ...prev]);
      
      console.log('Curso adicionado com sucesso:', data);
      toast.success("Curso adicionado com sucesso!");
      return { success: true, data };
    } catch (error) {
      console.error('Erro no addCurso:', error);
      toast.error("Erro ao adicionar curso");
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  return { cursos, loading, addCurso, refetch: fetchCursos };
}
