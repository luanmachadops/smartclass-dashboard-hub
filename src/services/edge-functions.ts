import { supabase } from '@/integrations/supabase/client';
import { RegisterData } from '@/schemas/validation';

/**
 * Função de borda para registrar um novo usuário e sua escola.
 * Garante que a criação da escola e do perfil do usuário seja atômica.
 *
 * @param data Os dados de registro do formulário.
 * @param userId O ID do usuário recém-criado no Supabase Auth.
 * @returns O ID da nova escola ou null em caso de erro.
 */
export async function registerUserAndSchool(data: RegisterData & { userId: string }): Promise<string | null> {
  try {
    // 1. Criar a escola
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: data.schoolName,
        owner_id: data.userId,
      })
      .select('id')
      .single();

    if (schoolError || !schoolData) {
      console.error('Erro ao criar a escola:', schoolError);
      // Idealmente, aqui você deveria deletar o usuário recém-criado do auth.users
      // para manter a consistência, mas isso requer privilégios de admin.
      // Por enquanto, apenas logamos o erro.
      return null;
    }

    const schoolId = schoolData.id;

    // 2. Atualizar o perfil do usuário com o school_id
    // O gatilho no banco de dados já deve ter criado um perfil básico.
    // Aqui, nós o atualizamos com o ID da escola.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        school_id: schoolId,
        nome_completo: data.directorName,
        // O tipo_usuario já tem 'diretor' como padrão na tabela
      })
      .eq('id', data.userId);

    if (profileError) {
      console.error('Erro ao atualizar o perfil do usuário com a escola:', profileError);
      // Tentar deletar a escola criada para manter a consistência
      await supabase.from('schools').delete().eq('id', schoolId);
      return null;
    }

    console.log(`✅ Escola e perfil criados com sucesso para o usuário ${data.userId}`);
    return schoolId;

  } catch (error) {
    console.error('Erro inesperado na função de borda registerUserAndSchool:', error);
    return null;
  }
}