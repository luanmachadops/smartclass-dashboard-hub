
import React, { useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Circle } from "lucide-react";

interface AlunoFotoUploadProps {
  value: File | null;
  previewUrl: string | null;
  nome: string;
  onChange: (file: File | null, previewUrl: string | null) => void;
  disabled?: boolean;
}

export function AlunoFotoUpload({
  value,
  previewUrl,
  nome,
  onChange,
  disabled = false,
}: AlunoFotoUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      onChange(file, url);
    }
  };

  const fallbackLetters = nome
    ? nome.trim().split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2)
    : "";

  return (
    <div className="flex flex-col items-center mt-2 mb-2">
      {/* Texto minimalista acima do círculo */}
      <div className="text-center mb-2">
        <span className="block text-sm font-semibold text-muted-foreground">Foto do aluno</span>
        <span className="block text-xs text-muted-foreground/80">
          Clique no círculo para adicionar ou alterar a foto
        </span>
      </div>
      <div
        className="relative group cursor-pointer w-24 h-24"
        onClick={handleAvatarClick}
        tabIndex={0}
        aria-label="Alterar foto do aluno"
      >
        <Avatar className="w-24 h-24 ring-2 ring-primary transition-shadow group-hover:ring-4 shadow-lg duration-200 bg-white/80">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt={nome || "Foto do aluno"} className="object-cover" />
          ) : (
            <AvatarFallback className="flex items-center justify-center text-blue-600 bg-muted">
              <Circle className="w-10 h-10 opacity-40" />
              <span className="absolute inset-0 flex items-center justify-center font-bold text-xl">
                {fallbackLetters || ""}
              </span>
            </AvatarFallback>
          )}
        </Avatar>
        {/* Nenhum texto abaixo do círculo */}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled}
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
