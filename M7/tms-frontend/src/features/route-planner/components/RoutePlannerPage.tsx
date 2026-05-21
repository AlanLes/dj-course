import React from 'react';
import { LoadingPage, ErrorMessage } from '@/components';
import { Shipment } from '@/model/shipments';
import { useRoutePlannerData } from '../hooks/useRoutePlannerData';
import { UnifiedRoutePlanner } from './UnifiedRoutePlanner';

export const RoutePlannerPage: React.FC = () => {
  const { context, contextEntity, shipments, drivers, vehicles, isLoading, error, refetchAll } =
    useRoutePlannerData();

  const handleShipmentUpdate = async (updatedShipment: Shipment) => {
    try {
      console.log('Shipment updated:', updatedShipment);
    } catch (err) {
      console.error('Failed to update shipment:', err);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ErrorMessage
          error={error instanceof Error ? error.message : 'Failed to load route planner data'}
          onRetry={refetchAll}
        />
      </div>
    );
  }

  return (
    <UnifiedRoutePlanner
      context={context}
      contextEntity={contextEntity}
      shipments={shipments}
      drivers={drivers}
      vehicles={vehicles}
      onShipmentUpdate={handleShipmentUpdate}
    />
  );
};
