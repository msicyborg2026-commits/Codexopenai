import { cn } from '../../lib/cn';

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn('w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm', className)}
      {...props}
    >
      {children}
    </select>
  );
}
