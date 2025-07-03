import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']
type School = Database['public']['Tables']['schools']['Row']

export interface UserProfileData {
  id: string
  email: string
  nome_completo: string | null
  tipo_usuario: string | null
  telefone: string | null
  school_id: string | null
  school?: {
    id: string
    name: string
    owner_id: string
  }
  created_at: string | null
  updated_at: string | null
}

export class UserService {
  /**
   * Obtém o perfil completo do usuário autenticado
   * Equivalente ao endpoint /api/me
   */
  static async getCurrentUserProfile(): Promise<UserProfileData | null> {
    try {
      // Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Usuário não autenticado:', authError)
        return null
      }

      // Buscar o perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          schools (
            id,
            name,
            owner_id
          )
        `)
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError)
        return null
      }

      if (!profile) {
        console.error('Perfil não encontrado para o usuário:', user.id)
        return null
      }

      // Retornar dados formatados
      return {
        id: profile.id,
        email: user.email || '',
        nome_completo: profile.nome_completo,
        tipo_usuario: profile.tipo_usuario,
        telefone: profile.telefone,
        school_id: profile.school_id,
        school: profile.schools ? {
          id: profile.schools.id,
          name: profile.schools.name,
          owner_id: profile.schools.owner_id
        } : undefined,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    } catch (error) {
      console.error('Erro inesperado ao buscar perfil do usuário:', error)
      return null
    }
  }

  /**
   * Atualiza o perfil do usuário autenticado
   */
  static async updateCurrentUserProfile(updates: Partial<Pick<Profile, 'nome_completo' | 'telefone'>>): Promise<boolean> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Usuário não autenticado:', authError)
        return false
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Erro ao atualizar perfil:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro inesperado ao atualizar perfil:', error)
      return false
    }
  }

  /**
   * Verifica se o usuário tem permissão para acessar uma funcionalidade
   */
  static hasPermission(userRole: string | null, requiredRoles: string[]): boolean {
    if (!userRole) return false
    return requiredRoles.includes(userRole)
  }

  /**
   * Verifica se o usuário é administrador (diretor ou admin)
   */
  static isAdmin(userRole: string | null): boolean {
    return this.hasPermission(userRole, ['diretor', 'admin'])
  }

  /**
   * Verifica se o usuário é professor
   */
  static isTeacher(userRole: string | null): boolean {
    return userRole === 'professor'
  }

  /**
   * Verifica se o usuário é aluno
   */
  static isStudent(userRole: string | null): boolean {
    return userRole === 'aluno'
  }

  /**
   * Verifica se o usuário é secretário
   */
  static isSecretary(userRole: string | null): boolean {
    return userRole === 'secretario'
  }
}

export default UserService