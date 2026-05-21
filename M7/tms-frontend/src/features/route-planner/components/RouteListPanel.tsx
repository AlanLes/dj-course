import React from 'react';
import { Shipment } from '@/model/shipments';
import { Driver } from '@/model/drivers';
import { Vehicle as VehicleEntity } from '@/model/vehicles';
import { EntitySuggestion } from '../route-planner.types';
import { RoutePlannerStateResult } from '../hooks/useRoutePlannerState';
import { ContextSwitcher } from './ContextSwitcher';
import { RouteControls } from './route-controls/RouteControls';
import { VehicleStatus } from './route-controls/VehicleStatus';
import { Filter, Search, Route as RouteIcon, User, Truck, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface RouteListPanelProps {
  state: RoutePlannerStateResult;
  entitySuggestions: EntitySuggestion[];
  drivers: Driver[];
  vehicles: VehicleEntity[];
}

export const RouteListPanel: React.FC<RouteListPanelProps> = ({
  state,
  entitySuggestions,
}) => {
  const {
    context,
    contextEntity,
    entitySearchTerm,
    showEntityDropdown,
    searchTerm,
    statusFilter,
    filteredShipments,
    selectedShipment,
    currentRoute,
    isEditingAllowed,
    hasValidData,
    handleContextChange,
    handleEntitySelect,
    handleEntityClear,
    handleShipmentSelect,
    handleAddPointOfType,
    handleOptimizeRoute,
    handleAddRestStops,
    setSearchTerm,
    setStatusFilter,
    setEntitySearchTerm,
    setShowEntityDropdown,
  } = state;

  return (
    <div className="lg:col-span-1 space-y-6">
      {/* Context and filters */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="space-y-4">
          <ContextSwitcher
            context={context}
            contextEntity={contextEntity}
            entitySearchTerm={entitySearchTerm}
            entitySuggestions={entitySuggestions}
            showEntityDropdown={showEntityDropdown}
            onContextChange={handleContextChange}
            onEntitySearchChange={(term) => { setEntitySearchTerm(term); setShowEntityDropdown(true); }}
            onEntitySelect={handleEntitySelect}
            onEntityClear={handleEntityClear}
            onDropdownOpen={() => setShowEntityDropdown(true)}
          />

          {context !== 'route-planning' && (
            <>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search routes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="planned">Planned</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Route controls (editing modes) */}
      {isEditingAllowed && currentRoute && (
        <RouteControls
          route={currentRoute.route}
          onAddPoint={handleAddPointOfType}
          onOptimizeRoute={handleOptimizeRoute}
          onAddRestStops={handleAddRestStops}
        />
      )}

      {/* Vehicle status */}
      {currentRoute && (
        <VehicleStatus vehicle={currentRoute.route.vehicle as unknown as VehicleEntity} />
      )}

      {/* Shipment list */}
      {context !== 'route-planning' && hasValidData && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-blue-600" />
            {context === 'active-shipments'
              ? 'Active Shipments'
              : context === 'driver-routes'
                ? 'Driver Routes'
                : 'Vehicle Routes'}
          </h2>
          <div className="max-h-80 overflow-y-auto pr-2 -mr-2">
            <div className="grid grid-cols-1 gap-3">
              {filteredShipments.map((shipment) => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  isSelected={selectedShipment?.id === shipment.id}
                  onSelect={() => handleShipmentSelect(shipment)}
                />
              ))}
            </div>
          </div>
          {filteredShipments.length > 3 && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              Scroll to see more ({filteredShipments.length} total)
            </div>
          )}
        </div>
      )}

      {/* Driver info card */}
      {context === 'driver-routes' && contextEntity && (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Driver Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{(contextEntity as Driver).name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium capitalize">
                {(contextEntity as Driver).status.replace('-', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Routes:</span>
              <span className="font-medium">{(contextEntity as Driver).routes.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle info card */}
      {context === 'vehicle-routes' && contextEntity && (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" />
            Vehicle Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Plate:</span>
              <span className="font-medium">{(contextEntity as VehicleEntity).plateNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Model:</span>
              <span className="font-medium">
                {(contextEntity as VehicleEntity).make} {(contextEntity as VehicleEntity).model}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium capitalize">
                {(contextEntity as VehicleEntity).status.replace('-', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mileage:</span>
              <span className="font-medium">
                {(contextEntity as VehicleEntity).mileage.toLocaleString()} km
              </span>
            </div>
          </div>
        </div>
      )}

      {/* No data state */}
      {!hasValidData && context !== 'route-planning' && (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-gray-400 mb-2">
            {context === 'driver-routes' ? (
              <User className="w-8 h-8 mx-auto" />
            ) : context === 'vehicle-routes' ? (
              <Truck className="w-8 h-8 mx-auto" />
            ) : (
              <RouteIcon className="w-8 h-8 mx-auto" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {context === 'driver-routes' && !contextEntity
              ? 'Select a Driver'
              : context === 'vehicle-routes' && !contextEntity
                ? 'Select a Vehicle'
                : 'No Routes Available'}
          </h3>
          <p className="text-gray-500 text-sm">
            {context === 'driver-routes' && !contextEntity
              ? 'Choose a driver to view their routes'
              : context === 'vehicle-routes' && !contextEntity
                ? 'Choose a vehicle to view its routes'
                : 'No routes found for the selected criteria'}
          </p>
        </div>
      )}
    </div>
  );
};

interface ShipmentCardProps {
  shipment: Shipment;
  isSelected: boolean;
  onSelect: () => void;
}

const ShipmentCard: React.FC<ShipmentCardProps> = ({ shipment, isSelected, onSelect }) => (
  <button
    onClick={onSelect}
    className={`p-3 rounded-lg border-2 transition-all text-left ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
    }`}
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-medium text-gray-900 text-sm">{shipment.name}</h3>
      <div className="flex items-center">
        {shipment.route.status === 'active' && <Truck className="w-4 h-4 text-green-600" />}
        {shipment.route.status === 'completed' && <CheckCircle className="w-4 h-4 text-blue-600" />}
        {shipment.route.status === 'delayed' && <AlertTriangle className="w-4 h-4 text-red-600" />}
        {shipment.route.status === 'planned' && <Clock className="w-4 h-4 text-gray-600" />}
      </div>
    </div>
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600 truncate">{shipment.customer}</span>
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          shipment.priority === 'urgent'
            ? 'bg-red-100 text-red-800'
            : shipment.priority === 'high'
              ? 'bg-orange-100 text-orange-800'
              : shipment.priority === 'medium'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
        }`}
      >
        {shipment.priority.toUpperCase()}
      </span>
    </div>
    <div className="mt-2 text-xs text-gray-500">
      {shipment.route.points.length} stops • {shipment.route.totalDistance.toFixed(0)} km
    </div>
  </button>
);
