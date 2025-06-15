
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Curso } from "@/hooks/useCursos";

interface CursoCardProps {
  curso: Curso;
  onClick?: () => void;
}

export function CursoCard({ curso, onClick }: CursoCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition" onClick={onClick}>
      <CardHeader>
        <CardTitle className="truncate">{curso.nome}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground truncate">{curso.descricao}</p>
        <div className="flex items-center justify-end mt-2 gap-1 text-primary">
          <span className="text-xs">Ver detalhes</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </CardContent>
    </Card>
  );
}
