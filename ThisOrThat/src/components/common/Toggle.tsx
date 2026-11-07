interface ToggleProps {
  leftLabel: string;
  rightLabel: string;
  value: 'left' | 'right';
  onChange: (value: 'left' | 'right') => void;
}

export function Toggle({ leftLabel, rightLabel, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`text-sm font-medium transition-colors ${
          value === 'left' ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        {leftLabel}
      </span>
      <button
        type="button"
        onClick={() => onChange(value === 'left' ? 'right' : 'left')}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-300"
        role="switch"
        aria-checked={value === 'right'}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
            value === 'right' ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium transition-colors ${
          value === 'right' ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        {rightLabel}
      </span>
    </div>
  );
}
