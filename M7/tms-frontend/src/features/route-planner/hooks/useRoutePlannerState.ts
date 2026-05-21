import { useState, useCallback, useEffect } from 'react';
import { Shipment, RoutePoint, Coordinates } from '@/model/shipments';
import { Driver } from '@/model/drivers';
import { Vehicle as VehicleEntity } from '@/model/vehicles';
import { RouteContext, EntitySuggestion, UnifiedRoutePlannerProps } from '../route-planner.types';
import { convertDriverRouteToShipment, generateVehicleRouteShipments, createDefaultPlanningRoute } from '../data/route-planner.transformers';
import { calculateRouteDistance, estimateTravelTime, generateOptimizedRoute, addRestStops } from '../shared/route.utils';

export interface RoutePlannerStateResult {
  context: RouteContext;
  contextEntity: Driver | VehicleEntity | undefined;
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'completed' | 'planned' | 'delayed';
  entitySearchTerm: string;
  showEntityDropdown: boolean;
  selectedShipment: Shipment | null;
  pendingPointType: RoutePoint['type'] | null;
  planningRoute: Shipment;
  contextualShipments: Shipment[];
  filteredShipments: Shipment[];
  isEditingAllowed: boolean;
  hasValidData: boolean;
  currentRoute: Shipment | null;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: 'all' | 'active' | 'completed' | 'planned' | 'delayed') => void;
  setEntitySearchTerm: (term: string) => void;
  setShowEntityDropdown: (show: boolean) => void;
  handleContextChange: (newContext: RouteContext) => void;
  handleEntitySelect: (suggestion: EntitySuggestion) => void;
  handleEntityClear: () => void;
  handleAddPoint: (coordinates: Coordinates, type: RoutePoint['type']) => void;
  handleRemovePoint: (pointId: string) => void;
  handleEditPoint: (updatedPoint: RoutePoint) => void;
  handleReorderPoints: (newPoints: RoutePoint[]) => void;
  handleOptimizeRoute: () => void;
  handleAddRestStops: () => void;
  handleAddPointOfType: (type: RoutePoint['type']) => void;
  handleShipmentSelect: (shipment: Shipment) => void;
}

export const useRoutePlannerState = ({
  context: initialContext,
  contextEntity: initialContextEntity,
  shipments: initialShipments,
  drivers = [],
  vehicles = [],
  onShipmentUpdate,
  onContextChange,
}: UnifiedRoutePlannerProps): RoutePlannerStateResult => {
  const [context, setContext] = useState<RouteContext>(initialContext);
  const [contextEntity, setContextEntity] = useState<Driver | VehicleEntity | undefined>(initialContextEntity);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'planned' | 'delayed'>('all');
  const [entitySearchTerm, setEntitySearchTerm] = useState('');
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [pendingPointType, setPendingPointType] = useState<RoutePoint['type'] | null>(null);
  const [planningRoute, setPlanningRoute] = useState<Shipment>(createDefaultPlanningRoute());

  useEffect(() => {
    if (initialContextEntity) {
      if ('name' in initialContextEntity) {
        setEntitySearchTerm((initialContextEntity as Driver).name);
      } else if ('plateNumber' in initialContextEntity) {
        const v = initialContextEntity as VehicleEntity;
        setEntitySearchTerm(`${v.plateNumber} - ${v.make} ${v.model}`);
      }
    }
  }, [initialContextEntity]);

  const getContextualShipments = useCallback((): Shipment[] => {
    switch (context) {
      case 'route-planning':
        return [];
      case 'driver-routes':
        if (contextEntity && 'routes' in contextEntity) {
          return (contextEntity as Driver).routes.map((route) =>
            convertDriverRouteToShipment(route, contextEntity as Driver)
          );
        }
        return [];
      case 'vehicle-routes':
        if (contextEntity && 'plateNumber' in contextEntity) {
          return generateVehicleRouteShipments(contextEntity as VehicleEntity);
        }
        return [];
      case 'active-shipments':
      default:
        return initialShipments;
    }
  }, [context, contextEntity, initialShipments]);

  const [contextualShipments, setContextualShipments] = useState<Shipment[]>(getContextualShipments());

  useEffect(() => {
    const newShipments = getContextualShipments();
    setContextualShipments(newShipments);

    if (context === 'route-planning') {
      setSelectedShipment(planningRoute);
    } else if (newShipments.length > 0) {
      setSelectedShipment(newShipments[0]);
    } else {
      setSelectedShipment(null);
    }
  }, [context, contextEntity, initialShipments, planningRoute]);

  // Simulate vehicle movement for active shipments
  useEffect(() => {
    if (!selectedShipment || context === 'route-planning') return;

    const interval = setInterval(() => {
      setSelectedShipment((prev) => {
        if (!prev || prev.route.status !== 'active') return prev;

        const targetPoint = prev.route.points[0];
        if (!targetPoint) return prev;

        const currentLat = prev.route.vehicle.coordinates.lat;
        const currentLng = prev.route.vehicle.coordinates.lng;
        const targetLat = targetPoint.coordinates.lat;
        const targetLng = targetPoint.coordinates.lng;

        return {
          ...prev,
          route: {
            ...prev.route,
            vehicle: {
              ...prev.route.vehicle,
              coordinates: {
                lat: currentLat + (targetLat - currentLat) * 0.01,
                lng: currentLng + (targetLng - currentLng) * 0.01,
              },
            },
          },
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedShipment, context]);

  const handleContextChange = useCallback(
    (newContext: RouteContext) => {
      setContext(newContext);
      setContextEntity(undefined);
      setEntitySearchTerm('');
      setShowEntityDropdown(false);
      setPendingPointType(null);
      onContextChange?.(newContext);
    },
    [onContextChange]
  );

  const handleEntitySelect = useCallback(
    (suggestion: EntitySuggestion) => {
      setContextEntity(suggestion.entity);
      setEntitySearchTerm(suggestion.name);
      setShowEntityDropdown(false);
      onContextChange?.(context, suggestion.entity);
    },
    [context, onContextChange]
  );

  const handleEntityClear = useCallback(() => {
    setContextEntity(undefined);
    setEntitySearchTerm('');
    onContextChange?.(context);
  }, [context, onContextChange]);

  const buildRouteUpdater = useCallback(
    (applyFn: (points: RoutePoint[]) => RoutePoint[]) => {
      const updateFunction = (prev: Shipment | null): Shipment | null => {
        if (!prev) return prev;
        const newPoints = applyFn(prev.route.points);
        const totalDistance = calculateRouteDistance(newPoints);
        const estimatedDuration = estimateTravelTime(totalDistance);
        const updatedShipment = {
          ...prev,
          route: { ...prev.route, points: newPoints, totalDistance, estimatedDuration },
        };
        if (context !== 'route-planning') {
          onShipmentUpdate?.(updatedShipment);
        }
        return updatedShipment;
      };

      if (context === 'route-planning') {
        setPlanningRoute((prev) => updateFunction(prev) || prev);
      } else {
        setSelectedShipment(updateFunction);
      }
    },
    [context, onShipmentUpdate]
  );

  const handleAddPoint = useCallback(
    (coordinates: Coordinates, type: RoutePoint['type']) => {
      const targetShipment = context === 'route-planning' ? planningRoute : selectedShipment;
      if (!targetShipment) return;

      const newPoint: RoutePoint = {
        id: `point-${Date.now()}`,
        coordinates,
        type,
        name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        address: `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
        estimatedArrival: new Date(
          Date.now() + targetShipment.route.points.length * 2 * 60 * 60 * 1000
        ),
        duration: type === 'rest' ? 45 : type === 'fuel' ? 30 : 60,
        notes: type === 'rest' ? 'Driver rest period' : undefined,
      };

      buildRouteUpdater((points) => [...points, newPoint]);
      setPendingPointType(null);
    },
    [context, planningRoute, selectedShipment, buildRouteUpdater]
  );

  const handleRemovePoint = useCallback(
    (pointId: string) => {
      buildRouteUpdater((points) => points.filter((p) => p.id !== pointId));
    },
    [buildRouteUpdater]
  );

  const handleEditPoint = useCallback(
    (updatedPoint: RoutePoint) => {
      buildRouteUpdater((points) => points.map((p) => (p.id === updatedPoint.id ? updatedPoint : p)));
    },
    [buildRouteUpdater]
  );

  const handleReorderPoints = useCallback(
    (newPoints: RoutePoint[]) => {
      buildRouteUpdater(() => newPoints);
    },
    [buildRouteUpdater]
  );

  const handleOptimizeRoute = useCallback(() => {
    buildRouteUpdater((points) => generateOptimizedRoute(points));
  }, [buildRouteUpdater]);

  const handleAddRestStops = useCallback(() => {
    buildRouteUpdater((points) => addRestStops(points));
  }, [buildRouteUpdater]);

  const handleAddPointOfType = useCallback((type: RoutePoint['type']) => {
    setPendingPointType(type);
  }, []);

  const handleShipmentSelect = useCallback((shipment: Shipment) => {
    setSelectedShipment(shipment);
    setPendingPointType(null);
  }, []);

  const filteredShipments = contextualShipments.filter((shipment) => {
    const matchesSearch =
      shipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.route.vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shipment.route.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isEditingAllowed = context === 'active-shipments' || context === 'route-planning';
  const hasValidData =
    (context === 'route-planning' && !!planningRoute) ||
    (contextualShipments.length > 0 && !!selectedShipment);
  const currentRoute = context === 'route-planning' ? planningRoute : selectedShipment;

  return {
    context,
    contextEntity,
    searchTerm,
    statusFilter,
    entitySearchTerm,
    showEntityDropdown,
    selectedShipment,
    pendingPointType,
    planningRoute,
    contextualShipments,
    filteredShipments,
    isEditingAllowed,
    hasValidData,
    currentRoute,
    setSearchTerm,
    setStatusFilter,
    setEntitySearchTerm,
    setShowEntityDropdown,
    handleContextChange,
    handleEntitySelect,
    handleEntityClear,
    handleAddPoint,
    handleRemovePoint,
    handleEditPoint,
    handleReorderPoints,
    handleOptimizeRoute,
    handleAddRestStops,
    handleAddPointOfType,
    handleShipmentSelect,
  };
};
