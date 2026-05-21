import React, { useState } from 'react';
import { useVehiclesList } from '../hooks/queries';
import { useVehicleFilters } from '../hooks/useVehicleFilters';
import { LoadingPage, ErrorMessage } from '../components';
import { VehicleFilters, VehiclesList, VehiclesTable, LiveFleetMap } from './vehicles';

const Vehicles = () => {
  const { data: vehicles = [], isLoading, error, refetch } = useVehiclesList();
  const [view, setView] = useState<'grid' | 'table'>('grid');

  const {
    filteredVehicles,
    filters,
    hasActiveFilters,
    onSearchChange,
    onStatusChange,
    onTypeChange,
    onOwnershipChange,
    onClearFilters,
  } = useVehicleFilters(vehicles);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ErrorMessage
          error={error instanceof Error ? error.message : 'Failed to load vehicles'}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
        <p className="text-gray-600">Manage vehicles, maintenance, and documentation</p>
      </div>

      <LiveFleetMap vehicles={vehicles} />

      <div className="space-y-4">
        <VehicleFilters
          searchTerm={filters.searchTerm}
          statusFilter={filters.statusFilter}
          typeFilter={filters.typeFilter}
          ownershipFilter={filters.ownershipFilter}
          view={view}
          onSearchChange={onSearchChange}
          onStatusChange={onStatusChange}
          onTypeChange={onTypeChange}
          onOwnershipChange={onOwnershipChange}
          onViewChange={setView}
          onClearFilters={onClearFilters}
          hasActiveFilters={hasActiveFilters}
          resultCount={filteredVehicles.length}
        />

        {view === 'grid' ? (
          <VehiclesList vehicles={filteredVehicles} />
        ) : (
          <VehiclesTable vehicles={filteredVehicles} />
        )}
      </div>
    </div>
  );
};

export default Vehicles;
