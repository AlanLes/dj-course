import React from 'react';
import { Shipment } from '@/model/shipments';
import { Driver } from '@/model/drivers';
import { Vehicle as VehicleEntity } from '@/model/vehicles';

export type RouteContext = 'active-shipments' | 'driver-routes' | 'vehicle-routes' | 'route-planning';

export interface UnifiedRoutePlannerProps {
  context: RouteContext;
  contextEntity?: Driver | VehicleEntity;
  shipments: Shipment[];
  drivers?: Driver[];
  vehicles?: VehicleEntity[];
  onBack?: () => void;
  onShipmentUpdate?: (shipment: Shipment) => void;
  onContextChange?: (context: RouteContext, entity?: Driver | VehicleEntity) => void;
}

export interface ContextOption {
  value: RouteContext;
  label: string;
  icon: React.ReactNode;
}

export interface EntitySuggestion {
  id: string;
  name: string;
  type: 'driver' | 'vehicle';
  entity: Driver | VehicleEntity;
}
