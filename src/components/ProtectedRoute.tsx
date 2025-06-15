
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profile && profile.school_id) {
        setIsVerifying(false)
        return
      }

      console.warn(`Usuário ${user.id} sem school_id. Corrigindo...`)
      toast.info('Finalizando a configuração da sua conta...')

      let { data: existingSchool } = await supabase.from('schools').select('id').eq('owner_id', user.id).maybeSingle()

      if (!existingSchool) {
        const schoolName = user.user_metadata?.nome_escola || `Escola de ${user.user_metadata?.nome_completo || user.email}`
        const { data: newSchool, error: schoolError } = await supabase
          .from('schools')
          .insert({ name: schoolName, owner_id: user.id })
          .select('id')
          .single()

        if (schoolError) {
          console.error('Erro ao criar escola:', schoolError)
          toast.error('Não foi possível criar uma escola para sua conta. Contate o suporte.')
          setIsVerifying(false)
          return
        }
        existingSchool = newSchool
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ school_id: existingSchool.id })
        .eq('id', user.id)

      if (profileUpdateError) {
        console.error('Erro ao atualizar perfil com nova escola:', profileUpdateError)
        toast.error('Erro ao finalizar configuração. Contate o suporte.')
        setIsVerifying(false)
        return
      }

      toast.success('Sua conta foi configurada! A página será recarregada.')
      setTimeout(() => window.location.reload(), 2000)
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
          <p className="text-muted-foreground">Isso pode levar um instante. Estamos garantindo que tudo esteja configurado corretamente.</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
