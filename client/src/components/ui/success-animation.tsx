import { motion } from "framer-motion";
import { bounceIn, checkmarkDraw } from "@/lib/animations";
import { Check } from "lucide-react";

interface SuccessAnimationProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

export function SuccessAnimation({ 
  size = "md", 
  color = "text-green-500",
  className = ""
}: SuccessAnimationProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  return (
    <motion.div
      variants={bounceIn}
      initial="initial"
      animate="animate"
      className={`${sizeClasses[size]} ${className}`}
    >
      <div className={`w-full h-full rounded-full bg-green-100 flex items-center justify-center ${color}`}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
        >
          <Check className="w-1/2 h-1/2" />
        </motion.div>
      </div>
    </motion.div>
  );
}

export function CheckmarkSVG({ className }: { className?: string }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M20 6L9 17l-5-5"
        variants={checkmarkDraw}
        initial="initial"
        animate="animate"
      />
    </motion.svg>
  );
}