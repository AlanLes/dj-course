import React from 'react';
import { Driver } from '@/model/drivers';
import { Vehicle as VehicleEntity } from '@/model/vehicles';
import { RouteContext } from '../route-planner.types';
import { ArrowLeft, Route as RouteIcon, User, Truck, Navigation } from 'lucide-react';

interface RoutePlannerHeaderProps {
  context: RouteContext;
  contextEntity?: Driver | VehicleEntity;
  onBack?: () => void;
}

const getContextTitle = (context: RouteContext, contextEntity?: Driver | VehicleEntity): string => {
  switch (context) {
    case 'route-planning':
      return 'Route Planning';
    case 'driver-routes':
      return contextEntity ? `Driver Routes - ${(contextEntity as Driver).name}` : 'Driver Routes';
    case 'vehicle-routes':
      return contextEntity
        ? `Vehicle Routes - ${(contextEntity as VehicleEntity).plateNumber}`
        : 'Vehicle Routes';
    case 'active-shipments':
    default:
      return 'Active Shipments - Route Planner';
  }
};

const getContextDescription = (context: RouteContext, contextEntity?: Driver | VehicleEntity): string => {
  switch (context) {
    case 'route-planning':
      return 'Create and optimize new routes with advanced planning tools';
    case 'driver-routes':
      return contextEntity
        ? `View and track routes assigned to ${(contextEntity as Driver).name}`
        : 'Select a driver to view their routes';
    case 'vehicle-routes':
      return contextEntity
        ? `View and track routes completed by ${(contextEntity as VehicleEntity).plateNumber}`
        : 'Select a vehicle to view its routes';
    case 'active-shipments':
    default:
      return 'Plan and manage active shipment routes with real-time tracking';
  }
};

const getContextIcon = (context: RouteContext): React.ReactNode => {
  switch (context) {
    case 'route-planning':
      return <Navigation className="w-5 h-5 text-blue-600" />;
    case 'driver-routes':
      return <User className="w-5 h-5 text-blue-600" />;
    case 'vehicle-routes':
      return <Truck className="w-5 h-5 text-blue-600" />;
    case 'active-shipments':
    default:
      return <RouteIcon className="w-5 h-5 text-blue-600" />;
  }
};

export const RoutePlannerHeader: React.FC<RoutePlannerHeaderProps> = ({
  context,
  contextEntity,
  onBack,
}) => {
  return (
    <div className="mb-6">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}
      <div className="flex items-center gap-3">
        {getContextIcon(context)}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {getContextTitle(context, contextEntity)}
          </h2>
          <p className="text-gray-600">{getContextDescription(context, contextEntity)}</p>
        </div>
      </div>
    </div>
  );
};
