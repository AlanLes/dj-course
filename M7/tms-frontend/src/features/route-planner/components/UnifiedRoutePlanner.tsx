import React from 'react';
import { MapPin } from 'lucide-react';
import { UnifiedRoutePlannerProps } from '../route-planner.types';
import { useRoutePlannerState } from '../hooks/useRoutePlannerState';
import { useEntitySuggestions } from '../hooks/useEntitySuggestions';
import { RoutePlannerHeader } from './RoutePlannerHeader';
import { RouteListPanel } from './RouteListPanel';
import { LogisticsMap } from './map/LogisticsMap';
import { RouteSummary } from './route-controls/RouteSummary';

export const UnifiedRoutePlanner: React.FC<UnifiedRoutePlannerProps> = (props) => {
  const state = useRoutePlannerState(props);
  const entitySuggestions = useEntitySuggestions(
    state.context,
    state.entitySearchTerm,
    props.drivers ?? [],
    props.vehicles ?? []
  );

  const { context, currentRoute, isEditingAllowed, showEntityDropdown, setShowEntityDropdown } = state;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <RoutePlannerHeader
        context={context}
        contextEntity={state.contextEntity}
        onBack={props.onBack}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <RouteListPanel
          state={state}
          entitySuggestions={entitySuggestions}
          drivers={props.drivers ?? []}
          vehicles={props.vehicles ?? []}
        />

        {/* Main content: map + summary */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-[600px]">
              {currentRoute ? (
                <LogisticsMap
                  points={currentRoute.route.points}
                  vehicle={currentRoute.route.vehicle}
                  onPointAdd={isEditingAllowed ? state.handleAddPoint : undefined}
                  onPointRemove={isEditingAllowed ? state.handleRemovePoint : undefined}
                  onPointEdit={isEditingAllowed ? state.handleEditPoint : undefined}
                  pendingPointType={isEditingAllowed ? state.pendingPointType : null}
                />
              ) : (
                <NoRouteSelected context={context} />
              )}
            </div>
          </div>

          {currentRoute && (
            <RouteSummary
              route={currentRoute.route}
              onReorderPoints={isEditingAllowed ? state.handleReorderPoints : undefined}
              allowReordering={isEditingAllowed}
            />
          )}
        </div>
      </div>

      {/* Backdrop to close entity dropdown */}
      {showEntityDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowEntityDropdown(false)}
        />
      )}
    </div>
  );
};

interface NoRouteSelectedProps {
  context: string;
}

const NoRouteSelected: React.FC<NoRouteSelectedProps> = ({ context }) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Route Selected</h3>
      <p className="text-gray-500">
        {context === 'active-shipments'
          ? 'Select a shipment to view its route'
          : context === 'driver-routes'
            ? 'Select a driver and route to view on the map'
            : context === 'vehicle-routes'
              ? 'Select a vehicle and route to view on the map'
              : 'Start planning your route by adding points to the map'}
      </p>
    </div>
  </div>
);
