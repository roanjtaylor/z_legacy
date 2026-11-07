import { useState } from 'react';
import { Modal } from '../common/Modal';
import type { Car } from '../../types';

interface CarCardModalProps {
  car: Car;
  isOpen: boolean;
  onClose: () => void;
}

export function CarCardModal({ car, isOpen, onClose }: CarCardModalProps) {
  const [imageError, setImageError] = useState(false);

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary':
        return 'text-yellow-600 bg-yellow-50';
      case 'rare':
        return 'text-purple-600 bg-purple-50';
      case 'uncommon':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${car.year} ${car.brand} ${car.name}`}
    >
      <div className="space-y-6">
        <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
          {!imageError ? (
            <img
              src={car.imageUrl}
              alt={`${car.year} ${car.brand} ${car.name}`}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-white">
              <span className="text-6xl mb-2">🏎️</span>
              <span className="text-xl font-bold">{car.brand}</span>
              <span className="text-lg opacity-75">{car.name}</span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 -mt-4">
          Image: {car.imageAttribution}
        </p>

        {car.stats && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Core Performance
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Horsepower" value={`${car.stats.horsepower} hp`} />
              <StatBox label="Top Speed" value={`${car.stats.topSpeedMph} mph`} />
              <StatBox label="0-60 mph" value={`${car.stats.zeroToSixty}s`} />
              <StatBox
                label="Engine"
                value={
                  car.stats.engineDisplacementL > 0
                    ? `${car.stats.engineDisplacementL}L`
                    : 'Electric'
                }
              />
              <StatBox label="Weight" value={`${car.stats.weightLbs.toLocaleString()} lbs`} />
            </div>
          </div>
        )}

        {car.extendedStats && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Extended Specifications
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Torque" value={`${car.extendedStats.torqueLbFt} lb-ft`} />
              {car.extendedStats.fuelEconomyMpg && (
                <StatBox
                  label="Fuel Economy"
                  value={`${car.extendedStats.fuelEconomyMpg} MPG`}
                />
              )}
              <StatBox label="Transmission" value={car.extendedStats.transmission} />
              <StatBox label="Drivetrain" value={car.extendedStats.drivetrain} />
            </div>
          </div>
        )}

        {car.collectorStats && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Collector Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {car.collectorStats.productionCount && (
                <StatBox
                  label="Production Count"
                  value={car.collectorStats.productionCount.toLocaleString()}
                />
              )}
              {car.collectorStats.rarityTier && (
                <div
                  className={`rounded-lg p-3 text-center ${getRarityColor(
                    car.collectorStats.rarityTier
                  )}`}
                >
                  <p className="text-xs opacity-75">Rarity</p>
                  <p className="font-semibold capitalize">
                    {car.collectorStats.rarityTier}
                  </p>
                </div>
              )}
              {car.collectorStats.originalMsrp && (
                <StatBox
                  label="Original MSRP"
                  value={`$${car.collectorStats.originalMsrp.toLocaleString()}`}
                />
              )}
              {car.collectorStats.estimatedCurrentValue && (
                <StatBox
                  label="Est. Current Value"
                  value={`$${car.collectorStats.estimatedCurrentValue.toLocaleString()}`}
                />
              )}
            </div>
          </div>
        )}

        {!car.stats && !car.extendedStats && !car.collectorStats && (
          <div className="text-center py-4">
            <p className="text-gray-500">
              {car.decade} &middot; {car.country}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Detailed stats not yet available
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}
