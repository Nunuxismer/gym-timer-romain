import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TabLinkProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function TabLink({ active, onClick, children, icon }: TabLinkProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {icon}
      {children}
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
        />
      )}
    </button>
  );
}
