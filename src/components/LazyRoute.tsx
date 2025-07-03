import { Suspense, lazy, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// Componente de loading
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

// HOC para lazy loading
export function withLazyLoading<T extends object>(
  importFunc: () => Promise<{ default: ComponentType<T> }>
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyRoute(props: T) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Páginas lazy
export const LazyDashboard = withLazyLoading(() => import('@/pages/Dashboard'));
export const LazyAlunos = withLazyLoading(() => import('@/pages/Alunos'));
export const LazyProfessores = withLazyLoading(() => import('@/pages/Professores'));
export const LazyTurmas = withLazyLoading(() => import('@/pages/Turmas'));
export const LazyComunicacao = withLazyLoading(() => import('@/pages/Comunicacao'));
export const LazyFinanceiro = withLazyLoading(() => import('@/pages/Financeiro'));
export const LazyCursos = withLazyLoading(() => import('@/pages/Cursos'));
export const LazyRelatorios = withLazyLoading(() => import('@/pages/Relatorios'));
export const LazyProfile = withLazyLoading(() => import('@/pages/Profile'));