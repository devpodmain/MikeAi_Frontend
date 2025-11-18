// Animation configurations and variants for consistent UI animations
import { Variants } from "framer-motion";

// Page transition animations
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

// Smooth slide in from bottom
export const slideInFromBottom: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// Stagger animation for lists
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

// Scale animation for cards and buttons
export const scaleOnHover: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  tap: { scale: 0.98 }
};

// Fade in animation
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

// Slide in from left
export const slideInFromLeft: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

// Slide in from right
export const slideInFromRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

// Bounce animation for success states
export const bounceIn: Variants = {
  initial: { scale: 0 },
  animate: { 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 260, 
      damping: 20 
    }
  }
};

// Smooth loading animation
export const pulseAnimation: Variants = {
  initial: { opacity: 0.6 },
  animate: { 
    opacity: 1,
    transition: { 
      duration: 1.5, 
      repeat: Infinity, 
      repeatType: "reverse" 
    }
  }
};

// Modal/dialog animations
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.8, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      duration: 0.3, 
      ease: "easeOut" 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    y: 20,
    transition: { 
      duration: 0.2, 
      ease: "easeIn" 
    }
  }
};

// Navigation animations
export const navItemHover: Variants = {
  initial: { x: 0 },
  hover: { 
    x: 5,
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

// Progress bar animation
export const progressBar: Variants = {
  initial: { scaleX: 0 },
  animate: { 
    scaleX: 1,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

// Floating animation for floating action button
export const floatingButton: Variants = {
  initial: { y: 0 },
  animate: { 
    y: [-2, 2, -2],
    transition: { 
      duration: 2, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }
  }
};

// Success checkmark animation
export const checkmarkDraw = {
  initial: { pathLength: 0 },
  animate: { 
    pathLength: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// Tab switching animation
export const tabContent: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

// Notification toast animation
export const toastSlideIn: Variants = {
  initial: { opacity: 0, x: 100 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    x: 100,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};