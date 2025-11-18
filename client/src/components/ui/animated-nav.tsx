import { motion } from "framer-motion";
import { navItemHover, slideInFromLeft } from "@/lib/animations";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface AnimatedNavItemProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function AnimatedNavItem({ href, children, isActive, className, onClick }: AnimatedNavItemProps) {
  return (
    <motion.div
      variants={navItemHover}
      initial="initial"
      whileHover="hover"
    >
      <Link 
        href={href}
        onClick={onClick}
        className={cn(
          "flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground",
          className
        )}
      >
        {children}
      </Link>
    </motion.div>
  );
}

interface AnimatedNavMenuProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedNavMenu({ children, className }: AnimatedNavMenuProps) {
  return (
    <motion.nav
      variants={slideInFromLeft}
      initial="initial"
      animate="animate"
      className={cn("space-y-2", className)}
    >
      {children}
    </motion.nav>
  );
}