import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Mail, RefreshCw } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export default function EmailConfirmation() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState("")
  const [confirmationStatus, setConfirmationStatus] = useState<'pending' | 'confirmed' | 'error'>('pending')

  useEffect(() => {
    // Verificar se há parâmetros de confirmação na URL
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    const emailParam = searchParams.get('email')
    
    if (emailParam) {
      setEmail(emailParam)
    }

    // Se há token de confirmação, processar automaticamente
    if (token && type === 'signup') {
      handleEmailConfirmation(token)
    }

    // Verificar se o usuário já está logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email_confirmed_at) {
        navigate('/dashboard')
      }
    })
  }, [searchParams, navigate])

  const handleEmailConfirmation = async (token: string) => {
    setIsConfirming(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      })

      if (error) {
        console.error('Erro na confirmação:', error)
        setConfirmationStatus('error')
        toast.error('Erro ao confirmar email: ' + error.message)
      } else {
        console.log('Email confirmado com sucesso:', data)
        setConfirmationStatus('confirmed')
        toast.success('Email confirmado com sucesso!')
        
        // Redirecionar para o dashboard após 2 segundos
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
      setConfirmationStatus('error')
      toast.error('Erro inesperado ao confirmar email')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error('Email não encontrado. Por favor, faça o cadastro novamente.')
      return
    }

    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        console.error('Erro ao reenviar confirmação:', error)
        toast.error('Erro ao reenviar email: ' + error.message)
      } else {
        toast.success('Email de confirmação reenviado com sucesso!')
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
      toast.error('Erro inesperado ao reenviar email')
    } finally {
      setIsResending(false)
    }
  }

  const renderContent = () => {
    if (isConfirming) {
      return (
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 mx-auto animate-spin text-primary" />
          <h3 className="text-lg font-semibold">Confirmando seu email...</h3>
          <p className="text-muted-foreground">Aguarde enquanto processamos sua confirmação.</p>
        </div>
      )
    }

    if (confirmationStatus === 'confirmed') {
      return (
        <div className="text-center space-y-4">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
          <h3 className="text-lg font-semibold text-green-700">Email confirmado com sucesso!</h3>
          <p className="text-muted-foreground">Você será redirecionado para o dashboard em instantes.</p>
        </div>
      )
    }

    if (confirmationStatus === 'error') {
      return (
        <div className="text-center space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              Houve um erro ao confirmar seu email. O link pode ter expirado ou já ter sido usado.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <Button 
              onClick={handleResendConfirmation} 
              disabled={isResending}
              className="w-full"
            >
              {isResending ? 'Reenviando...' : 'Reenviar Email de Confirmação'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Voltar ao Login
            </Button>
          </div>
        </div>
      )
    }

    // Status pending - aguardando confirmação
    return (
      <div className="text-center space-y-4">
        <Mail className="h-12 w-12 mx-auto text-primary" />
        <h3 className="text-lg font-semibold">Confirme seu email</h3>
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Enviamos um email de confirmação para:
          </p>
          <p className="font-medium text-foreground">{email}</p>
          <p className="text-sm text-muted-foreground">
            Clique no link do email para ativar sua conta.
          </p>
        </div>
        
        <Alert>
          <AlertDescription>
            <strong>Não recebeu o email?</strong> Verifique sua caixa de spam ou lixo eletrônico.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <Button 
            onClick={handleResendConfirmation} 
            disabled={isResending}
            className="w-full"
          >
            {isResending ? 'Reenviando...' : 'Reenviar Email de Confirmação'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            Voltar ao Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground">
            SmartClass
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sistema de gestão para escolas de música
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Confirmação de Email</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}