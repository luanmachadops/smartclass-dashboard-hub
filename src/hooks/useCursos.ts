import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSchool } from "@/contexts/SchoolContext";

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
  const { schoolId } = useSchool()

  const fetchCursos = async () => {
    if (!schoolId) {
      console.log('❌ School ID não disponível, aguardando...');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Buscando cursos para escola:', schoolId);
      
      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .eq('school_id', schoolId)
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar cursos:', error);
        throw error;
      }
      
      console.log('📚 Cursos carregados:', data?.length || 0, 'cursos encontrados');
      setCursos(data || []);
    } catch (error) {
      console.error('❌ Erro no fetchCursos:', error);
      toast.error(`Erro ao carregar cursos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addCurso = async (curso: { nome: string; descricao?: string }) => {
    if (!schoolId) {
      toast.error("Escola não identificada. Tente fazer login novamente.")
      return { success: false }
    }

    // Validação de campos obrigatórios
    if (!curso.nome) {
      toast.error('O campo nome é obrigatório!')
      console.error('Campo obrigatório faltando: nome', curso)
      return { success: false, error: 'Campo obrigatório faltando: nome' }
    }

    // Log detalhado do payload
    console.log('[DEBUG] Payload para cadastro de curso:', {
      ...curso,
      school_id: schoolId
    })

    try {
      console.log('Adicionando curso:', curso);
      
      const { data, error } = await supabase
        .from("cursos")
        .insert({
          nome: curso.nome,
          descricao: curso.descricao || null,
          school_id: schoolId
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
      console.error('[DEBUG] Erro no addCurso:', error);
      toast.error("Erro ao adicionar curso");
      return { success: false, error };
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect do useCursos executado')
    console.log('🏫 School ID estado:', !!schoolId)
    
    if (schoolId) {
      console.log('✅ School ID disponível, buscando cursos...')
      fetchCursos();
    } else {
      console.log('❌ School ID não disponível, aguardando...')
      setLoading(false);
      setCursos([]);
    }
  }, [schoolId]);

  return { cursos, loading, addCurso, refetch: fetchCursos };
}
