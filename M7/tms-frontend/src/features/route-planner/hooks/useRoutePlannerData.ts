import { useSearchParams } from 'react-router-dom';
import { RouteContext } from '../route-planner.types';
import { useRoutePlannerShipments, useRoutePlannerDrivers, useRoutePlannerVehicles } from '../data/route-planner.queries';
import { Driver } from '@/model/drivers';
import { Vehicle as VehicleEntity } from '@/model/vehicles';

export const useRoutePlannerData = () => {
  const [searchParams] = useSearchParams();

  const context = (searchParams.get('context') as RouteContext) || 'active-shipments';
  const entityId = searchParams.get('entityId');

  const {
    data: shipments = [],
    isLoading: shipmentsLoading,
    error: shipmentsError,
    refetch: refetchShipments,
  } = useRoutePlannerShipments();

  const {
    data: drivers = [],
    isLoading: driversLoading,
    error: driversError,
    refetch: refetchDrivers,
  } = useRoutePlannerDrivers();

  const {
    data: vehicles = [],
    isLoading: vehiclesLoading,
    error: vehiclesError,
    refetch: refetchVehicles,
  } = useRoutePlannerVehicles();

  const isLoading = shipmentsLoading || driversLoading || vehiclesLoading;
  const error = shipmentsError || driversError || vehiclesError;

  const contextEntity: Driver | VehicleEntity | undefined = entityId
    ? context === 'driver-routes'
      ? drivers.find((d) => d.id === entityId)
      : context === 'vehicle-routes'
        ? vehicles.find((v) => v.id === entityId)
        : undefined
    : undefined;

  const refetchAll = () => {
    refetchShipments();
    refetchDrivers();
    refetchVehicles();
  };

  return {
    context,
    contextEntity,
    shipments,
    drivers,
    vehicles,
    isLoading,
    error,
    refetchAll,
  };
};
