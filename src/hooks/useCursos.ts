
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

export function useCursos() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      console.log('Buscando cursos...');
      
      // Usando a tabela alunos temporariamente até que a tabela cursos seja criada
      const { data, error } = await supabase
        .from("alunos")
        .select("instrumento")
        .not("instrumento", "is", null);
      
      if (error) {
        console.error('Erro ao buscar cursos:', error);
        throw error;
      }
      
      // Criar cursos únicos baseados nos instrumentos dos alunos
      const instrumentosUnicos = [...new Set(data?.map(item => item.instrumento).filter(Boolean))] as string[];
      const cursosFromInstrumentos: Curso[] = instrumentosUnicos.map((instrumento, index) => ({
        id: `curso-${index}`,
        nome: instrumento,
        descricao: `Curso de ${instrumento}`,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      console.log('Cursos carregados:', cursosFromInstrumentos);
      setCursos(cursosFromInstrumentos);
    } catch (error) {
      console.error('Erro no fetchCursos:', error);
      toast.error("Erro ao carregar cursos");
    } finally {
      setLoading(false);
    }
  };

  const addCurso = async (curso: { nome: string; descricao?: string }) => {
    try {
      console.log('Adicionando curso:', curso);
      
      // Simular adição de curso
      const novoCurso: Curso = {
        id: `curso-${Date.now()}`,
        nome: curso.nome,
        descricao: curso.descricao || null,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setCursos(prev => [novoCurso, ...prev]);
      
      console.log('Curso adicionado com sucesso:', novoCurso);
      toast.success("Curso adicionado com sucesso!");
      return { success: true, data: novoCurso };
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
