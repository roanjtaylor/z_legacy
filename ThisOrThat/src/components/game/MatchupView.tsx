import { useState, useCallback } from 'react';
import type { Car } from '../../types';
import { CarCard } from './CarCard';

interface MatchupViewProps {
  car1: Car;
  car2: Car;
  onSelectWinner: (car: Car) => void;
}

export function MatchupView({ car1, car2, onSelectWinner }: MatchupViewProps) {
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSelect = useCallback((car: Car) => {
    if (isAnimating) return;

    setSelectedCar(car);
    setIsAnimating(true);

    // Wait for celebration animation, then proceed to next matchup
    setTimeout(() => {
      setSelectedCar(null);
      setIsAnimating(false);
      onSelectWinner(car);
    }, 1000);
  }, [isAnimating, onSelectWinner]);

  const getCardState = (car: Car): 'winner' | 'loser' | null => {
    if (!selectedCar) return null;
    return car.id === selectedCar.id ? 'winner' : 'loser';
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col">
        <CarCard
          car={car1}
          onClick={() => handleSelect(car1)}
          isClickable={!isAnimating}
          selectionState={getCardState(car1)}
        />
      </div>
      <div className="flex flex-col">
        <CarCard
          car={car2}
          onClick={() => handleSelect(car2)}
          isClickable={!isAnimating}
          selectionState={getCardState(car2)}
        />
      </div>
    </div>
  );
}
