import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Logo } from "@/components/Logo";
import { monitoring } from "@/services/monitoring";

const NotFound = () => {
  const location = useLocation();
  const [suggestedRoutes, setSuggestedRoutes] = useState<string[]>([]);

  const availableRoutes = [
    { path: "/", name: "Página Inicial" },
    { path: "/auth", name: "Login / Cadastro" },
    { path: "/dashboard", name: "Dashboard" },
    { path: "/alunos", name: "Alunos" },
    { path: "/professores", name: "Professores" },
    { path: "/turmas", name: "Turmas" },
    { path: "/cursos", name: "Cursos" },
    { path: "/financeiro", name: "Financeiro" },
    { path: "/comunicacao", name: "Comunicação" },
    { path: "/relatorios", name: "Relatórios" },
    { path: "/profile", name: "Perfil" }
  ];

  useEffect(() => {
    // Log do erro para monitoramento
    monitoring.recordError({
      message: `404 Error: Rota não encontrada - ${location.pathname}`,
      type: 'custom',
      context: {
        pathname: location.pathname,
        search: location.search,
        referrer: document.referrer
      }
    });

    // Sugerir rotas similares
    const currentPath = location.pathname.toLowerCase();
    const suggestions = availableRoutes
      .filter(route => {
        const routePath = route.path.toLowerCase();
        return routePath.includes(currentPath.slice(1)) || 
               currentPath.includes(routePath.slice(1)) ||
               levenshteinDistance(currentPath, routePath) <= 2;
      })
      .slice(0, 3)
      .map(route => route.path);
    
    setSuggestedRoutes(suggestions.length > 0 ? suggestions : ["/", "/auth", "/dashboard"]);
  }, [location.pathname]);

  // Função para calcular distância de Levenshtein (similaridade entre strings)
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const getRouteInfo = (path: string) => {
    return availableRoutes.find(route => route.path === path);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="md" />
          </div>
          <CardTitle className="text-6xl font-bold text-primary mb-2">404</CardTitle>
          <p className="text-xl text-muted-foreground">Página não encontrada</p>
          <p className="text-sm text-muted-foreground mt-2">
            A rota <code className="bg-muted px-2 py-1 rounded text-xs">{location.pathname}</code> não existe.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Talvez você estava procurando por:</p>
            <div className="space-y-2">
              {suggestedRoutes.map((route) => {
                const routeInfo = getRouteInfo(route);
                return (
                  <Link key={route} to={route}>
                    <Button variant="outline" className="w-full justify-start">
                      <Search className="w-4 h-4 mr-2" />
                      {routeInfo?.name || route}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => window.history.back()} variant="outline" className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Link to="/" className="flex-1">
              <Button className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Início
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
