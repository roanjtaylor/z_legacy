import type { ReactNode } from 'react';

export function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen bg-neutral-950 text-neutral-100 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
