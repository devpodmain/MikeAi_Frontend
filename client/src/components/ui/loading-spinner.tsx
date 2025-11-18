import { motion } from "framer-motion";
import { pulseAnimation } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <motion.div
        variants={pulseAnimation}
        initial="initial"
        animate="animate"
        className={cn(
          "rounded-full border-2 border-primary border-t-transparent animate-spin",
          sizeClasses[size]
        )}
      />
    </div>
  );
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
          }}
          className="w-2 h-2 bg-primary rounded-full"
        />
      ))}
    </div>
  );
}