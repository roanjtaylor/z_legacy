import { useState, useMemo } from 'react';
import { useFacilityContext } from '../../context/FacilityContext';
import { Facility } from '../../types/facility';
import { Button } from '../UI';
import './SidePanel.css';

type SortOption = 'nextInteraction' | 'recentInteraction' | 'alphabetical';

interface SidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onFacilityClick: (facility: Facility) => void;
}

export function SidePanel({ isOpen, onToggle, onFacilityClick }: SidePanelProps) {
  const { filteredFacilities, setSelectedFacility } = useFacilityContext();
  const [sortBy, setSortBy] = useState<SortOption>('nextInteraction');

  const sortedFacilities = useMemo(() => {
    const facilities = [...filteredFacilities];

    switch (sortBy) {
      case 'nextInteraction':
        return facilities.sort((a, b) => {
          // Facilities with no next interaction date go to the bottom
          if (!a.nextInteractionDate && !b.nextInteractionDate) return 0;
          if (!a.nextInteractionDate) return 1;
          if (!b.nextInteractionDate) return -1;
          return new Date(a.nextInteractionDate).getTime() - new Date(b.nextInteractionDate).getTime();
        });
      case 'recentInteraction':
        return facilities.sort((a, b) => {
          // Oldest first (facilities not contacted recently at top)
          if (!a.recentInteractionDate && !b.recentInteractionDate) return 0;
          if (!a.recentInteractionDate) return -1;
          if (!b.recentInteractionDate) return 1;
          return new Date(a.recentInteractionDate).getTime() - new Date(b.recentInteractionDate).getTime();
        });
      case 'alphabetical':
        return facilities.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return facilities;
    }
  }, [filteredFacilities, sortBy]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getDateClass = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'date-overdue';
    if (diffDays <= 2) return 'date-soon';
    return '';
  };

  const handleViewMore = (facility: Facility, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFacility(facility);
  };

  return (
    <>
      <div className={`side-panel ${isOpen ? 'open' : ''}`}>
        <div className="side-panel-header">
          <h2 className="side-panel-title">Facilities</h2>
          <span className="side-panel-count">{sortedFacilities.length}</span>
          <button className="side-panel-close" onClick={onToggle}>
            &times;
          </button>
        </div>

        <div className="side-panel-sort">
          <label className="sort-label">Sort by:</label>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="nextInteraction">Next Interaction (soonest)</option>
            <option value="recentInteraction">Recent Interaction (oldest)</option>
            <option value="alphabetical">Name (A-Z)</option>
          </select>
        </div>

        <div className="side-panel-list">
          {sortedFacilities.length === 0 ? (
            <div className="side-panel-empty">
              No facilities to display
            </div>
          ) : (
            sortedFacilities.map(facility => (
              <div
                key={facility.id}
                className="facility-card"
                onClick={() => onFacilityClick(facility)}
              >
                <div className="facility-card-top">
                  {facility.imageUrl1 && (
                    <div className="facility-card-image">
                      <img
                        src={facility.imageUrl1}
                        alt={facility.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="facility-card-content">
                    <h3 className="facility-card-name">{facility.name}</h3>
                    <div className={`facility-card-date ${getDateClass(facility.nextInteractionDate)}`}>
                      <span className="date-label">Next:</span>
                      <span className="date-value">{formatDate(facility.nextInteractionDate)}</span>
                    </div>
                    <div className="facility-card-date facility-card-recent">
                      <span className="date-label">Last:</span>
                      <span className="date-value">{formatDate(facility.recentInteractionDate)}</span>
                    </div>
                  </div>
                </div>
                {facility.todoNotes && (
                  <div className="facility-card-todo-section">
                    <span className="todo-label">To-Do:</span>
                    <p className="facility-card-todo">{facility.todoNotes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toggle button when panel is closed */}
      <button
        className={`side-panel-toggle ${isOpen ? 'hidden' : ''}`}
        onClick={onToggle}
      >
        <span className="toggle-icon">&#9654;</span>
        <span className="toggle-text">List</span>
      </button>
    </>
  );
}
