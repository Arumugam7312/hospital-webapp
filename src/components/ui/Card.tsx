import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
}

export function Card({ children, className, title, description, headerAction }: CardProps) {
  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
      {(title || description || headerAction) && (
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>}
            {description && <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}
