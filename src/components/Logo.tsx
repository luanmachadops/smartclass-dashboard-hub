
import { cn } from "@/lib/utils";
import logoSvg from "./logo.svg";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const iconSize = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const textSize = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src={logoSvg} 
        alt="SmartClass Logo" 
        className={cn("object-contain", iconSize[size])} 
        loading="lazy"
      />
      {showText && (
        <span className={cn("font-bold text-foreground", textSize[size])}>
          SmartClass
        </span>
      )}
    </div>
  );
}
