
import { Music } from "lucide-react"
import { Link } from "react-router-dom"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-10 w-10"
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl"
  }

  return (
    <Link to="/" className="flex items-center gap-2">
      <Music className={`${sizeClasses[size]} text-primary`} />
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold text-foreground`}>
          SmartClass
        </span>
      )}
    </Link>
  )
}
