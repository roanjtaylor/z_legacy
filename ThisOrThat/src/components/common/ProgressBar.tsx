interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-gray-500">
            {current} / {total}
          </span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
