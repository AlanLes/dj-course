import { useState } from 'react';
import { Vehicle } from '../model/vehicles';

interface VehicleFiltersState {
  searchTerm: string;
  statusFilter: 'all' | Vehicle['status'];
  typeFilter: 'all' | Vehicle['type'];
  ownershipFilter: 'all' | Vehicle['ownership']['type'];
}

interface UseVehicleFiltersResult {
  filteredVehicles: Vehicle[];
  filters: VehicleFiltersState;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: 'all' | Vehicle['status']) => void;
  onTypeChange: (value: 'all' | Vehicle['type']) => void;
  onOwnershipChange: (value: 'all' | Vehicle['ownership']['type']) => void;
  onClearFilters: () => void;
}

export const useVehicleFilters = (vehicles: Vehicle[]): UseVehicleFiltersResult => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Vehicle['status']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | Vehicle['type']>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | Vehicle['ownership']['type']>('all');

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch =
      vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.currentDriver?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    const matchesType = typeFilter === 'all' || vehicle.type === typeFilter;
    const matchesOwnership = ownershipFilter === 'all' || vehicle.ownership.type === ownershipFilter;

    return matchesSearch && matchesStatus && matchesType && matchesOwnership;
  });

  const hasActiveFilters =
    searchTerm !== '' || statusFilter !== 'all' || typeFilter !== 'all' || ownershipFilter !== 'all';

  const onClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setOwnershipFilter('all');
  };

  return {
    filteredVehicles,
    filters: { searchTerm, statusFilter, typeFilter, ownershipFilter },
    hasActiveFilters,
    onSearchChange: setSearchTerm,
    onStatusChange: setStatusFilter,
    onTypeChange: setTypeFilter,
    onOwnershipChange: setOwnershipFilter,
    onClearFilters,
  };
};
