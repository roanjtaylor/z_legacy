import { Link } from 'react-router-dom';

interface HeaderProps {
  rightContent?: React.ReactNode;
}

export function Header({ rightContent }: HeaderProps) {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🏎️</span>
          <h1 className="text-xl font-bold text-gray-900">This or That</h1>
        </Link>
        {rightContent && <div>{rightContent}</div>}
      </div>
    </header>
  );
}
