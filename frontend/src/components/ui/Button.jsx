import { cn } from '../../lib/cn';

const variants = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  ghost: 'text-slate-700 hover:bg-slate-100'
};

export function Button({ className, variant = 'primary', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
