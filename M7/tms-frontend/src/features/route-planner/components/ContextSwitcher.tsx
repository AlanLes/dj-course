import React from 'react';
import { Driver } from '@/model/drivers';
import { Vehicle as VehicleEntity } from '@/model/vehicles';
import { RouteContext, EntitySuggestion } from '../route-planner.types';
import { User, Truck, X, Navigation, Route as RouteIcon } from 'lucide-react';

interface ContextSwitcherProps {
  context: RouteContext;
  contextEntity: Driver | VehicleEntity | undefined;
  entitySearchTerm: string;
  entitySuggestions: EntitySuggestion[];
  showEntityDropdown: boolean;
  onContextChange: (context: RouteContext) => void;
  onEntitySearchChange: (term: string) => void;
  onEntitySelect: (suggestion: EntitySuggestion) => void;
  onEntityClear: () => void;
  onDropdownOpen: () => void;
}

const contextOptions: { value: RouteContext; label: string; icon: React.ReactNode }[] = [
  { value: 'route-planning', label: 'Route Planning', icon: <Navigation className="w-4 h-4" /> },
  { value: 'active-shipments', label: 'Active Shipments', icon: <RouteIcon className="w-4 h-4" /> },
  { value: 'driver-routes', label: 'Driver Routes', icon: <User className="w-4 h-4" /> },
  { value: 'vehicle-routes', label: 'Vehicle Routes', icon: <Truck className="w-4 h-4" /> },
];

export const ContextSwitcher: React.FC<ContextSwitcherProps> = ({
  context,
  contextEntity,
  entitySearchTerm,
  entitySuggestions,
  showEntityDropdown,
  onContextChange,
  onEntitySearchChange,
  onEntitySelect,
  onEntityClear,
  onDropdownOpen,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Context</label>
        <select
          value={context}
          onChange={(e) => onContextChange(e.target.value as RouteContext)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          {contextOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {(context === 'driver-routes' || context === 'vehicle-routes') && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {context === 'driver-routes' ? 'Select Driver' : 'Select Vehicle'}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder={`Search ${context === 'driver-routes' ? 'drivers' : 'vehicles'}...`}
              value={entitySearchTerm}
              onChange={(e) => onEntitySearchChange(e.target.value)}
              onFocus={onDropdownOpen}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {contextEntity && (
              <button
                onClick={onEntityClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {showEntityDropdown && entitySuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {entitySuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => onEntitySelect(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    {suggestion.type === 'driver' ? (
                      <User className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Truck className="w-4 h-4 text-purple-500" />
                    )}
                    <span className="font-medium">{suggestion.name}</span>
                  </div>
                  {suggestion.type === 'driver' && (
                    <div className="text-xs text-gray-500 mt-1">
                      Status: {(suggestion.entity as Driver).status.replace('-', ' ')}
                    </div>
                  )}
                  {suggestion.type === 'vehicle' && (
                    <div className="text-xs text-gray-500 mt-1">
                      {(suggestion.entity as VehicleEntity).year} •{' '}
                      {(suggestion.entity as VehicleEntity).status.replace('-', ' ')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
