
import { Link } from "react-router-dom"
import { ArrowRight, Users, BarChart3, MessageSquare, CheckCircle, Star } from "lucide-react"
import { Logo } from "@/components/Logo"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-sm bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Recursos</a>
                <a href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors">Depoimentos</a>
                <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Preços</a>
              </nav>

              <Button asChild>
                <Link to="/login">Acessar Plataforma</Link>
              </Button>

              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32 text-center overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
            Eleve o Ritmo da sua 
            <span className="text-primary"> Escola de Música</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Com o SmartClass, você automatiza a chamada, acompanha o progresso dos alunos e se comunica com as turmas. Tudo em um só lugar.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/register" className="flex items-center gap-2">
                Começar Agora
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <a href="#features">Ver Recursos</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-24 lg:py-32 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              Tudo que você precisa para uma gestão afinada
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Foque no que realmente importa: a música. Deixe a organização conosco.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="transform hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-5">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Chamada Inteligente</h3>
                <p className="mt-2 text-base text-muted-foreground">
                  Realize a chamada de presença em segundos, com um sistema simples e à prova de erros.
                </p>
              </CardContent>
            </Card>

            <Card className="transform hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-5">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Relatórios Detalhados</h3>
                <p className="mt-2 text-base text-muted-foreground">
                  Gere relatórios de frequência por aluno, turma ou período. Identifique padrões e melhore o engajamento.
                </p>
              </CardContent>
            </Card>

            <Card className="transform hover:-translate-y-2 transition-transform duration-300">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-5">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Comunicação Centralizada</h3>
                <p className="mt-2 text-base text-muted-foreground">
                  Envie avisos, materiais e feedbacks para turmas inteiras ou alunos específicos diretamente pela plataforma.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 sm:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto h-12 w-12 text-primary/60 mb-6">
            <svg fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.896 3.456-8.352 9.12-8.352 15.36 0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L25.864 4z" />
            </svg>
          </div>
          <blockquote className="text-2xl font-medium text-foreground">
            "O SmartClass transformou a administração da nossa escola. O tempo que eu gastava com planilhas agora é usado para planejar novas aulas. É simplesmente indispensável."
          </blockquote>
          <footer className="mt-6">
            <div className="md:flex md:items-center md:justify-center">
              <div className="flex items-center justify-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    JS
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-base font-medium text-foreground">João Silva</div>
                  <div className="text-base text-muted-foreground">Diretor, Escola Acordes & Melodias</div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-24 lg:py-32 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              Planos Flexíveis para sua Escola
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Escolha o plano que melhor se adapta ao ritmo da sua instituição.
            </p>
          </div>

          <div className="mt-16 max-w-lg mx-auto grid gap-12 lg:grid-cols-2 lg:max-w-5xl">
            {/* Plano Essencial */}
            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-foreground">Essencial</h3>
                <p className="mt-2 text-muted-foreground">Ideal para professores e pequenas escolas começando a organizar.</p>
                <p className="mt-6">
                  <span className="text-5xl font-extrabold text-foreground">R$ 49</span>
                  <span className="text-base font-medium text-muted-foreground">/mês</span>
                </p>
                <Button variant="outline" className="mt-8 w-full" asChild>
                  <Link to="/register">Começar com Essencial</Link>
                </Button>
                
                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-foreground">Incluído no plano Essencial:</h4>
                  <ul className="mt-6 space-y-4">
                    {[
                      "Até 5 turmas",
                      "Até 50 alunos", 
                      "Chamada e controle de presença",
                      "Relatórios básicos"
                    ].map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckCircle className="h-6 w-5 flex-none text-primary" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Plano Profissional */}
            <Card className="relative border-primary">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <div className="rounded-full bg-primary px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                  Mais Popular
                </div>
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-foreground">Profissional</h3>
                <p className="mt-2 text-muted-foreground">Para escolas em crescimento que precisam de mais poder.</p>
                <p className="mt-6">
                  <span className="text-5xl font-extrabold text-foreground">R$ 99</span>
                  <span className="text-base font-medium text-muted-foreground">/mês</span>
                </p>
                <Button className="mt-8 w-full" asChild>
                  <Link to="/register">Começar com Profissional</Link>
                </Button>

                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-foreground">Tudo do Essencial, e mais:</h4>
                  <ul className="mt-6 space-y-4">
                    {[
                      "Turmas ilimitadas",
                      "Alunos ilimitados",
                      "Relatórios avançados e exportação (PDF/CSV)",
                      "Comunicação direta com as turmas",
                      "Suporte prioritário"
                    ].map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckCircle className="h-6 w-5 flex-none text-primary" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-base text-muted-foreground">
            &copy; 2025 SmartClass. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
