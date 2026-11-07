import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const variants: Record<Variant, string> = {
  primary:
    'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30 disabled:bg-neutral-700 disabled:shadow-none disabled:text-neutral-500',
  secondary: 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700',
  ghost: 'bg-transparent hover:bg-neutral-800 text-neutral-300',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      className={`rounded-full px-6 py-3 font-semibold transition-all duration-150 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
