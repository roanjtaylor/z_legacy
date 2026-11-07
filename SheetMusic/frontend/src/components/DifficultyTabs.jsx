/**
 * DifficultyTabs - Tabbed difficulty selector displayed above the sheet music.
 *
 * Allows users to switch between simplified versions of the piece:
 * - Easy: Melody only, simplified rhythms
 * - Medium: Melody + bass, no grace notes
 * - Original: Full score unchanged
 */

export default function DifficultyTabs({
  availableLevels,
  currentLevel,
  onLevelChange,
  isLoading
}) {
  const levelLabels = {
    easy: 'Easy',
    medium: 'Medium',
    original: 'Original'
  };

  const levelDescriptions = {
    easy: 'Melody only',
    medium: 'Melody + bass',
    original: 'Full score'
  };

  // Don't render if only original available (simple piece)
  if (!availableLevels || availableLevels.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[#808080] text-sm mr-2">Difficulty:</span>
      <div className="flex gap-1 p-1 bg-[#1a1a2e]/60 rounded-lg border border-[#DAA520]/20">
        {availableLevels.map(level => {
          const isActive = currentLevel === level;
          const isDisabled = isLoading && !isActive;

          return (
            <button
              key={level}
              onClick={() => !isDisabled && onLevelChange(level)}
              disabled={isDisabled}
              title={levelDescriptions[level]}
              className={`
                relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-b from-[#DAA520] to-[#B8860B] text-[#1a1a2e] shadow-md'
                  : 'text-[#C0C0C0] hover:text-[#DAA520] hover:bg-[#2C3E50]/50'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className={isLoading && isActive ? 'opacity-0' : ''}>
                {levelLabels[level]}
              </span>

              {/* Loading spinner overlay */}
              {isLoading && isActive && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 animate-spin text-[#1a1a2e]"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </span>
              )}

              {/* Active indicator dot */}
              {isActive && !isLoading && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#C41E3A] rounded-full border border-[#1a1a2e]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tooltip showing current level description */}
      <span className="text-[#606060] text-xs ml-2 hidden sm:inline">
        ({levelDescriptions[currentLevel]})
      </span>
    </div>
  );
}
