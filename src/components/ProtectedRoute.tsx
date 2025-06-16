
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setIsVerifying(false)
      return
    }

    const verifyAndFixSchool = async () => {
      try {
        console.log('🔍 Verificando perfil do usuário:', user.id)
        
        const { data: profile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('school_id, nome_completo')
          .eq('id', user.id)
          .maybeSingle()

        console.log('📋 Dados do perfil encontrados:', profile)
        console.log('❌ Erro ao buscar perfil:', profileFetchError)

        if (profileFetchError) {
          console.error('Erro ao buscar perfil:', profileFetchError)
          toast.error('Erro ao verificar perfil do usuário')
          setIsVerifying(false)
          return
        }

        // Se o perfil não existe, criar
        if (!profile) {
          console.log('⚠️ Perfil não encontrado, criando novo perfil...')
          
          // Primeiro, verificar se existe uma escola para este usuário
          let { data: existingSchool } = await supabase
            .from('schools')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle()

          console.log('🏫 Escola existente encontrada:', existingSchool)

          // Se não existe escola, criar uma
          if (!existingSchool) {
            const schoolName = user.user_metadata?.nome_escola || `Escola de ${user.user_metadata?.nome_completo || user.email}`
            console.log('🆕 Criando nova escola:', schoolName)
            
            const { data: newSchool, error: schoolError } = await supabase
              .from('schools')
              .insert({ name: schoolName, owner_id: user.id })
              .select('id')
              .single()

            if (schoolError) {
              console.error('Erro ao criar escola:', schoolError)
              toast.error('Erro ao criar escola para sua conta')
              setIsVerifying(false)
              return
            }
            
            existingSchool = newSchool
            console.log('✅ Nova escola criada:', existingSchool)
          }

          // Criar o perfil com o school_id
          const { error: profileCreateError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              nome_completo: user.user_metadata?.nome_completo || user.email,
              tipo_usuario: 'diretor',
              school_id: existingSchool.id
            })

          if (profileCreateError) {
            console.error('Erro ao criar perfil:', profileCreateError)
            toast.error('Erro ao criar perfil do usuário')
            setIsVerifying(false)
            return
          }

          console.log('✅ Perfil criado com sucesso')
          toast.success('Conta configurada com sucesso!')
          setIsVerifying(false)
          return
        }

        // Se o perfil existe mas não tem school_id
        if (profile && !profile.school_id) {
          console.log('⚠️ Perfil existe mas sem school_id, corrigindo...')
          
          // Verificar se existe uma escola para este usuário
          let { data: existingSchool } = await supabase
            .from('schools')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle()

          console.log('🏫 Escola existente para correção:', existingSchool)

          // Se não existe escola, criar uma
          if (!existingSchool) {
            const schoolName = user.user_metadata?.nome_escola || `Escola de ${profile.nome_completo || user.email}`
            console.log('🆕 Criando escola para correção:', schoolName)
            
            const { data: newSchool, error: schoolError } = await supabase
              .from('schools')
              .insert({ name: schoolName, owner_id: user.id })
              .select('id')
              .single()

            if (schoolError) {
              console.error('Erro ao criar escola para correção:', schoolError)
              toast.error('Erro ao configurar escola')
              setIsVerifying(false)
              return
            }
            
            existingSchool = newSchool
            console.log('✅ Escola criada para correção:', existingSchool)
          }

          // Atualizar o perfil com o school_id
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ school_id: existingSchool.id })
            .eq('id', user.id)

          if (profileUpdateError) {
            console.error('Erro ao atualizar perfil com school_id:', profileUpdateError)
            toast.error('Erro ao finalizar configuração da conta')
            setIsVerifying(false)
            return
          }

          console.log('✅ School_id adicionado ao perfil existente')
          toast.success('Conta configurada com sucesso!')
        } else {
          console.log('✅ Perfil já possui school_id:', profile?.school_id)
        }

        setIsVerifying(false)
      } catch (error) {
        console.error('Erro geral na verificação:', error)
        toast.error('Erro na verificação da conta')
        setIsVerifying(false)
      }
    }

    verifyAndFixSchool()
  }, [user, authLoading])

  const loading = authLoading || isVerifying

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center text-center p-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
          <p className="text-lg font-semibold">Verificando sua conta...</p>
          <p className="text-muted-foreground">Configurando sua escola pela primeira vez...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
