import { useMemo } from 'react';
import { Driver } from '@/model/drivers';
import { Vehicle as VehicleEntity } from '@/model/vehicles';
import { RouteContext, EntitySuggestion } from '../route-planner.types';

export const useEntitySuggestions = (
  context: RouteContext,
  entitySearchTerm: string,
  drivers: Driver[],
  vehicles: VehicleEntity[]
): EntitySuggestion[] => {
  return useMemo(() => {
    if (context === 'active-shipments' || context === 'route-planning' || !entitySearchTerm) {
      return [];
    }

    const suggestions: EntitySuggestion[] = [];

    if (context === 'driver-routes') {
      drivers
        .filter((driver) => driver.name.toLowerCase().includes(entitySearchTerm.toLowerCase()))
        .slice(0, 5)
        .forEach((driver) => {
          suggestions.push({ id: driver.id, name: driver.name, type: 'driver', entity: driver });
        });
    } else if (context === 'vehicle-routes') {
      vehicles
        .filter(
          (vehicle) =>
            vehicle.plateNumber.toLowerCase().includes(entitySearchTerm.toLowerCase()) ||
            `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(entitySearchTerm.toLowerCase())
        )
        .slice(0, 5)
        .forEach((vehicle) => {
          suggestions.push({
            id: vehicle.id,
            name: `${vehicle.plateNumber} - ${vehicle.make} ${vehicle.model}`,
            type: 'vehicle',
            entity: vehicle,
          });
        });
    }

    return suggestions;
  }, [context, entitySearchTerm, drivers, vehicles]);
};
