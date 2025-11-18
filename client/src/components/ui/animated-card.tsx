import { motion } from "framer-motion";
import { scaleOnHover } from "@/lib/animations";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function AnimatedCard({ children, className = "", onClick, disabled = false }: AnimatedCardProps) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        onClick && "cursor-pointer select-none",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {children}
    </div>
  );
}