import { useQuery } from '@tanstack/react-query';
import { getShipments } from '@/http/shipments.http';
import { getDrivers } from '@/http/drivers.http';
import { fetchVehicles } from '@/http/vehicles.http';
import { Shipment } from '@/model/shipments';
import { Driver } from '@/model/drivers';
import { Vehicle } from '@/model/vehicles';

interface ShipmentsFilters {
  status?: Shipment['route']['status'];
  priority?: Shipment['priority'];
  customer?: string;
  search?: string;
}

interface DriversFilters {
  status?: Driver['status'];
  contractType?: Driver['contractType'];
  search?: string;
}

interface VehiclesFilters {
  status?: Vehicle['status'];
  type?: Vehicle['type'];
  search?: string;
}

export const useRoutePlannerShipments = (filters?: ShipmentsFilters) => {
  return useQuery({
    queryKey: ['route-planner', 'shipments', filters],
    queryFn: () => getShipments(filters),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useRoutePlannerDrivers = (filters?: DriversFilters) => {
  return useQuery({
    queryKey: ['route-planner', 'drivers', filters],
    queryFn: () => getDrivers(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useRoutePlannerVehicles = (filters?: VehiclesFilters) => {
  return useQuery({
    queryKey: ['route-planner', 'vehicles', filters],
    queryFn: () => fetchVehicles(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
