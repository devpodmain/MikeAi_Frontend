import { motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { scaleOnHover } from "@/lib/animations";
import { LoadingSpinner } from "./loading-spinner";

interface AnimatedButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export function AnimatedButton({ 
  children, 
  loading = false, 
  loadingText, 
  disabled, 
  ...props 
}: AnimatedButtonProps) {
  return (
    <Button 
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <LoadingSpinner size="sm" />
          {loadingText && <span>{loadingText}</span>}
        </div>
      ) : (
        children
      )}
    </Button>
  );
}