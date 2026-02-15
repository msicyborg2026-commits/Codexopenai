import { cn } from '../../lib/cn';

export function LoadingSkeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200', className)} />;
}
