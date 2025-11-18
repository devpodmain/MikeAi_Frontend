import { motion } from "framer-motion";
import { floatingButton } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
  label?: string;
}

export function FloatingActionButton({ 
  onClick, 
  icon = <Plus className="h-6 w-6" />, 
  className,
  label = "Add"
}: FloatingActionButtonProps) {
  return (
    <motion.div
      variants={floatingButton}
      initial="initial"
      animate="animate"
      className={cn("fixed bottom-6 right-6 z-50", className)}
    >
      <Button
        size="lg"
        onClick={onClick}
        className="rounded-full shadow-lg h-14 w-14 p-0 group hover:shadow-xl transition-shadow"
        title={label}
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {icon}
        </motion.div>
      </Button>
    </motion.div>
  );
}