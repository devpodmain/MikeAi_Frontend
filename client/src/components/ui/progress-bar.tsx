import { motion } from "framer-motion";
import { progressBar } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  height?: "sm" | "md" | "lg";
  showValue?: boolean;
  color?: "primary" | "success" | "warning" | "error";
}

export function ProgressBar({ 
  value, 
  className, 
  height = "md", 
  showValue = false,
  color = "primary" 
}: ProgressBarProps) {
  const heightClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3"
  };

  const colorClasses = {
    primary: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500", 
    error: "bg-red-500"
  };

  return (
    <div className={cn("w-full", className)}>
      {showValue && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm font-medium">{value}%</span>
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", heightClasses[height])}>
        <motion.div
          variants={progressBar}
          initial="initial"
          animate="animate"
          style={{ scaleX: value / 100 }}
          className={cn("h-full origin-left rounded-full", colorClasses[color])}
        />
      </div>
    </div>
  );
}