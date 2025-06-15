
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/Logo"
import { Music, Users, Calendar, DollarSign, BarChart3, BookOpen } from "lucide-react"

export default function Index() {
  const features = [
    {
      icon: Users,
      title: "Gestão de Alunos",
      description: "Controle completo dos dados dos alunos, responsáveis e matrículas"
    },
    {
      icon: Music,
      title: "Organização de Turmas",
      description: "Crie e gerencie turmas por instrumento, nível e horário"
    },
    {
      icon: Calendar,
      title: "Controle de Presença",
      description: "Registre facilmente a presença dos alunos em cada aula"
    },
    {
      icon: BookOpen,
      title: "Gestão de Professores",
      description: "Gerencie horários, especialidades e dados dos professores"
    },
    {
      icon: DollarSign,
      title: "Financeiro",
      description: "Controle de mensalidades, pagamentos e relatórios financeiros"
    },
    {
      icon: BarChart3,
      title: "Relatórios",
      description: "Relatórios completos de frequência, financeiro e desempenho"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <h1 className="text-2xl font-bold text-foreground">SmartClass</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button>Começar Agora</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Gerencie sua{" "}
            <span className="text-primary">Escola de Música</span>{" "}
            com facilidade
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Sistema completo para gestão de alunos, professores, turmas, 
            financeiro e relatórios. Tudo que você precisa em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-3">
                Criar Conta Grátis
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Fazer Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Funcionalidades Completas
          </h3>
          <p className="text-lg text-muted-foreground">
            Tudo que sua escola de música precisa para funcionar perfeitamente
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-12 text-center">
            <h3 className="text-3xl font-bold mb-4">
              Pronto para começar?
            </h3>
            <p className="text-lg mb-8 opacity-90">
              Crie sua conta agora e comece a usar o SmartClass hoje mesmo.
            </p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Começar Agora - É Grátis!
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Logo size="sm" />
              <span className="text-sm text-muted-foreground">
                © 2024 SmartClass. Sistema de gestão escolar.
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
                Login
              </Link>
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
                Cadastro
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
