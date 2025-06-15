
import React, { useMemo, useState } from "react";
import { useCursos } from "@/hooks/useCursos";
import { useTurmas } from "@/hooks/useTurmas";
import { useAlunos } from "@/hooks/useAlunos";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CHART_COLORS = ["#6366F1", "#10B981", "#F59E42", "#EF4444", "#8B5CF6"];

export function DashboardCursos() {
  const { cursos, loading } = useCursos();
  const { turmas } = useTurmas();
  const { alunos } = useAlunos();

  const [filtro, setFiltro] = useState("");

  const cursosFiltrados = useMemo(
    () =>
      cursos.filter(c =>
        c.nome.toLowerCase().includes(filtro.toLowerCase())
      ),
    [cursos, filtro]
  );

  // Turmas agrupadas por curso
  const turmasPorCurso = useMemo(() => {
    return cursosFiltrados.map(curso => {
      const turmasCurso = turmas.filter(t => t.curso_id === curso.id);
      return { nome: curso.nome, turmas: turmasCurso.length };
    });
  }, [cursosFiltrados, turmas]);

  // Alunos agrupados por curso
  const alunosPorCurso = useMemo(() => {
    return cursosFiltrados.map((curso, idx) => {
      const turmasCurso = turmas.filter(t => t.curso_id === curso.id).map(t => t.id);
      const alunosCurso = alunos.filter(a => turmasCurso.includes(a.turma_id));
      return { nome: curso.nome, alunos: alunosCurso.length };
    });
  }, [cursosFiltrados, turmas, alunos]);

  // Ranking de frequência média por curso
  const rankingFrequencia = useMemo(() => {
    return cursosFiltrados.map((curso, idx) => {
      const turmasCurso = turmas.filter(t => t.curso_id === curso.id);
      // Média de presença: agarrar campo presenca de cada turma, já vem calculado em useTurmas
      const freqMedia =
        turmasCurso.length > 0
          ? Math.round(
              turmasCurso.reduce((acc, t) => acc + (t.presenca || 0), 0) /
                turmasCurso.length
            )
          : 0;
      return { nome: curso.nome, frequencia: freqMedia };
    });
  }, [cursosFiltrados, turmas]);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="w-full space-y-6">
      {/* Filtro de cursos */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Filtrar cursos por nome..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          className="max-w-xs"
        />
      </div>
      {/* Painéis */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Gráfico: Turmas por curso */}
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Turmas por curso</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={turmasPorCurso}>
              <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Bar dataKey="turmas" fill={CHART_COLORS[0]} />
              <Tooltip />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        {/* Gráfico: Alunos por curso */}
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Alunos por curso</h4>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={alunosPorCurso}
                cx="50%"
                cy="50%"
                dataKey="alunos"
                nameKey="nome"
                outerRadius={60}
                label
              >
                {alunosPorCurso.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        {/* Ranking de frequência média por curso */}
        <Card className="p-4 col-span-1 xl:col-span-1">
          <h4 className="font-semibold mb-2">Ranking de Frequência Média (%)</h4>
          <ul className="divide-y divide-muted">
            {rankingFrequencia
              .sort((a, b) => b.frequencia - a.frequencia)
              .map((r, idx) => (
                <li key={r.nome} className="flex items-center justify-between py-2">
                  <span>
                    <span className="font-medium">{idx + 1}.</span> {r.nome}
                  </span>
                  <span className="font-mono text-primary">{r.frequencia}%</span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
