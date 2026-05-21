import React from 'react';
import { Vehicle } from '@/model/vehicles';
import { Truck, User, Hash, MapPin, ExternalLink } from 'lucide-react';

interface VehicleStatusProps {
  vehicle: Vehicle;
}

export const VehicleStatus: React.FC<VehicleStatusProps> = ({ vehicle }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Truck className="w-5 h-5 text-blue-600" />
        Vehicle Status
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Driver:</span>
          </div>
          <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
            {vehicle.currentDriver}
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Vehicle:</span>
          </div>
          <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
            {vehicle.plateNumber}
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Location:</span>
          </div>
          <button className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
            {vehicle.currentLocation?.address || 'Location not available'}
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-800">Vehicle Online</span>
          </div>
          <p className="text-xs text-green-600 mt-1">GPS tracking active</p>
        </div>
      </div>
    </div>
  );
};
