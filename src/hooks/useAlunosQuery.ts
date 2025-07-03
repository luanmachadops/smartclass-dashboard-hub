import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/logger';
import { useToast } from '@/hooks/use-toast';
import type { Aluno } from '@/types/aluno';

// Query keys
export const alunosKeys = {
  all: ['alunos'] as const,
  lists: () => [...alunosKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...alunosKeys.lists(), { filters }] as const,
  details: () => [...alunosKeys.all, 'detail'] as const,
  detail: (id: string) => [...alunosKeys.details(), id] as const,
};

// Fetch functions
const fetchAlunos = async (): Promise<Aluno[]> => {
  logger.info('Fetching alunos');
  
  const { data, error } = await supabase
    .from('alunos')
    .select('*')
    .order('nome');

  if (error) {
    logger.error('Error fetching alunos:', error);
    throw error;
  }

  return data || [];
};

const fetchAlunoById = async (id: string): Promise<Aluno> => {
  logger.info('Fetching aluno by id:', id);
  
  const { data, error } = await supabase
    .from('alunos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Error fetching aluno:', error);
    throw error;
  }

  return data;
};

const createAluno = async (aluno: Omit<Aluno, 'id' | 'created_at' | 'updated_at'>): Promise<Aluno> => {
  logger.info('Creating aluno:', aluno);
  
  const { data, error } = await supabase
    .from('alunos')
    .insert(aluno)
    .select()
    .single();

  if (error) {
    logger.error('Error creating aluno:', error);
    throw error;
  }

  return data;
};

const updateAluno = async ({ id, ...updates }: Partial<Aluno> & { id: string }): Promise<Aluno> => {
  logger.info('Updating aluno:', { id, updates });
  
  const { data, error } = await supabase
    .from('alunos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating aluno:', error);
    throw error;
  }

  return data;
};

const deleteAluno = async (id: string): Promise<void> => {
  logger.info('Deleting aluno:', id);
  
  const { error } = await supabase
    .from('alunos')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Error deleting aluno:', error);
    throw error;
  }
};

// Hooks
export function useAlunos() {
  return useQuery({
    queryKey: alunosKeys.lists(),
    queryFn: fetchAlunos,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useAluno(id: string) {
  return useQuery({
    queryKey: alunosKeys.detail(id),
    queryFn: () => fetchAlunoById(id),
    enabled: !!id,
  });
}

export function useCreateAluno() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createAluno,
    onSuccess: (newAluno) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: alunosKeys.lists() });
      
      // Optimistically update the cache
      queryClient.setQueryData(alunosKeys.detail(newAluno.id), newAluno);
      
      toast({
        title: 'Sucesso',
        description: 'Aluno criado com sucesso!',
      });
      
      logger.info('Aluno created successfully:', newAluno);
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar aluno. Tente novamente.',
        variant: 'destructive',
      });
      
      logger.error('Error creating aluno:', error);
    },
  });
}

export function useUpdateAluno() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateAluno,
    onSuccess: (updatedAluno) => {
      // Update specific aluno in cache
      queryClient.setQueryData(alunosKeys.detail(updatedAluno.id), updatedAluno);
      
      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({ queryKey: alunosKeys.lists() });
      
      toast({
        title: 'Sucesso',
        description: 'Aluno atualizado com sucesso!',
      });
      
      logger.info('Aluno updated successfully:', updatedAluno);
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar aluno. Tente novamente.',
        variant: 'destructive',
      });
      
      logger.error('Error updating aluno:', error);
    },
  });
}

export function useDeleteAluno() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteAluno,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: alunosKeys.detail(deletedId) });
      
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: alunosKeys.lists() });
      
      toast({
        title: 'Sucesso',
        description: 'Aluno removido com sucesso!',
      });
      
      logger.info('Aluno deleted successfully:', deletedId);
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao remover aluno. Tente novamente.',
        variant: 'destructive',
      });
      
      logger.error('Error deleting aluno:', error);
    },
  });
}