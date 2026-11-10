import { useState } from 'react';
import type { Car } from '../../types';
import { CarCardModal } from './CarCardModal';

interface CarCardProps {
  car: Car;
  onClick?: () => void;
  isClickable?: boolean;
  showViewMore?: boolean;
  selectionState?: 'winner' | 'loser' | null;
}

export function CarCard({
  car,
  onClick,
  isClickable = true,
  showViewMore = true,
  selectionState = null,
}: CarCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  const handleViewMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const getStateClasses = () => {
    if (selectionState === 'winner') {
      return 'ring-4 ring-green-500 scale-[1.02] winner-celebration';
    }
    if (selectionState === 'loser') {
      return 'opacity-50 grayscale scale-[0.98]';
    }
    return '';
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`relative overflow-hidden rounded-xl bg-white shadow-lg transition-all duration-500 ease-out ${
          isClickable && !selectionState
            ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]'
            : ''
        } ${getStateClasses()}`}
      >
        {/* Winner celebration overlay */}
        {selectionState === 'winner' && (
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-green-500/10 animate-pulse" />
            <div className="confetti-container">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.3}s`,
                    backgroundColor: ['#22c55e', '#4ade80', '#86efac', '#fbbf24', '#f59e0b'][Math.floor(Math.random() * 5)],
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {!imageError ? (
            <img
              src={car.imageUrl}
              alt={`${car.year} ${car.brand} ${car.name}`}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-white">
              <span className="text-5xl mb-2">🏎️</span>
              <span className="text-lg font-bold">{car.brand}</span>
              <span className="text-sm opacity-75">{car.name}</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <h3 className="text-xl font-bold text-white">
              {car.year} {car.brand} {car.name}
            </h3>
            <p className="text-sm text-gray-200">{car.country}</p>
          </div>
        </div>

        <div className="p-4">
          {car.stats ? (
            <div className="grid grid-cols-2 gap-3">
              <StatItem label="Horsepower" value={`${car.stats.horsepower} hp`} />
              <StatItem label="Top Speed" value={`${car.stats.topSpeedMph} mph`} />
              <StatItem label="0-60 mph" value={`${car.stats.zeroToSixty}s`} />
              <StatItem label="Weight" value={`${car.stats.weightLbs.toLocaleString()} lbs`} />
              <StatItem
                label="Engine"
                value={car.stats.engineDisplacementL > 0 ? `${car.stats.engineDisplacementL}L` : 'Electric'}
              />
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">{car.decade} {car.country}</p>
            </div>
          )}

          {showViewMore && car.stats && (
            <button
              onClick={handleViewMore}
              className="mt-4 w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              View More Details
            </button>
          )}
        </div>
      </div>

      <CarCardModal
        car={car}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <style>{`
        .winner-celebration {
          animation: winnerPulse 0.5s ease-out;
        }

        @keyframes winnerPulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 0 20px 10px rgba(34, 197, 94, 0.4);
          }
          100% {
            transform: scale(1.02);
            box-shadow: 0 0 15px 5px rgba(34, 197, 94, 0.2);
          }
        }

        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          overflow: hidden;
        }

        .confetti {
          position: absolute;
          width: 8px;
          height: 8px;
          top: -10px;
          border-radius: 2px;
          animation: confettiFall 1s ease-out forwards;
        }

        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(150px) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}
