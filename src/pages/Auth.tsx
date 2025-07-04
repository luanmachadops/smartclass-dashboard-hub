
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { registerSchema, validateData } from "@/schemas/validation"
import { Checkbox } from "@/components/ui/checkbox"

export default function Auth() {
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({
    schoolName: "",
    directorName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    acceptTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await signIn({ email: loginData.email, password: loginData.password })
    
    if (result.error) {
      // O erro já foi tratado no AuthContext com toast
      setLoading(false)
      return
    }
    
    // Se chegou até aqui, o login foi bem-sucedido
    navigate("/dashboard")
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationResult = validateData(registerSchema, registerData, 'registerForm');

    if (!validationResult.success) {
      setErrors(validationResult.errors);
      return;
    }

    setLoading(true);

    const result = await signUp(validationResult.data);

    setLoading(false);

    if (result.error) {
      setErrors({ _general: result.error.message });
      return;
    }

    if (result.needsEmailConfirmation) {
      navigate(`/email-confirmation?email=${encodeURIComponent(registerData.email)}`);
    } else {
      // Após confirmação de e-mail, redirecionar para completar dados da escola
      navigate('/school-settings');
    }
  };

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
          <CardContent className="p-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="Sua senha"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">Nome da Escola</Label>
                    <Input
                      id="schoolName"
                      value={registerData.schoolName}
                      onChange={(e) => setRegisterData({ ...registerData, schoolName: e.target.value })}
                      placeholder="Nome da sua escola de música"
                      required
                    />
                    {errors.schoolName && <p className="text-sm text-destructive mt-1">{errors.schoolName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="directorName">Nome do Diretor</Label>
                    <Input
                      id="directorName"
                      value={registerData.directorName}
                      onChange={(e) => setRegisterData({ ...registerData, directorName: e.target.value })}
                      placeholder="Seu nome completo"
                      required
                    />
                    {errors.directorName && <p className="text-sm text-destructive mt-1">{errors.directorName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      placeholder="seu@email.com"
                      required
                    />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      placeholder="Crie uma senha segura"
                      required
                    />
                    {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      placeholder="Confirme sua senha"
                      required
                    />
                    {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone (Opcional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="acceptTerms" 
                      checked={registerData.acceptTerms}
                      onCheckedChange={(checked) => setRegisterData({ ...registerData, acceptTerms: !!checked })}
                    />
                    <label
                      htmlFor="acceptTerms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Eu aceito os termos e condições
                    </label>
                    {errors.acceptTerms && <p className="text-sm text-destructive mt-1">{errors.acceptTerms}</p>}
                  </div>

                  {errors._general && <p className="text-sm text-destructive text-center">{errors._general}</p>}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/" className="text-sm text-primary hover:text-primary/80">
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
