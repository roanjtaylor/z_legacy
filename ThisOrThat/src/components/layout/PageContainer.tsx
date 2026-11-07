interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main className={`mx-auto max-w-7xl px-4 py-8 ${className}`}>
      {children}
    </main>
  );
}
