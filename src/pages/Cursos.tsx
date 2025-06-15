
import { DashboardCursos } from "@/components/cursos/DashboardCursos";
import { AdicionarCursoModal } from "@/components/cursos/AdicionarCursoModal";
import { Button } from "@/components/ui/button";
import { useCursos } from "@/hooks/useCursos";
import { CursoCard } from "@/components/cursos/CursoCard";

export default function Cursos() {
  const { cursos } = useCursos();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Cursos</h1>
        <AdicionarCursoModal trigger={<Button>Adicionar curso</Button>} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cursos.map(curso => (
          <CursoCard key={curso.id} curso={curso} />
        ))}
      </div>
      {/* Dashboards avançados */}
      <DashboardCursos />
    </div>
  );
}
