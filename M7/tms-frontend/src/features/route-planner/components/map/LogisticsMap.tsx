import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RoutePoint, Vehicle, Coordinates } from '@/model/shipments';
import { createCustomIcon, getPointColor, defaultMapCenter, defaultZoom } from '../../shared/map.utils';
import { PointTooltip } from './PointTooltip';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiMzQjgyRjYiLz4KPHBhdGggZD0iTTEyLjUgMTdDMTUuMjYxNCAxNyAxNy41IDE0Ljc2MTQgMTcuNSAxMkMxNy41IDkuMjM4NTggMTUuMjYxNCA3IDEyLjUgN0M5LjczODU4IDcgNy41IDkuMjM4NTggNy41IDEyQzcuNSAxNC43NjE0IDkuNzM4NTggMTcgMTIuNSAxN1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMi41IDQxTDcuNSAyNUwxNy41IDI1TDEyLjUgNDFaIiBmaWxsPSIjM0I4MkY2Ii8+Cjwvc3ZnPgo=',
  iconUrl:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiMzQjgyRjYiLz4KPHBhdGggZD0iTTEyLjUgMTdDMTUuMjYxNCAxNyAxNy41IDE0Ljc2MTQgMTcuNSAxMkMxNy41IDkuMjM4NTggMTUuMjYxNCA3IDEyLjUgN0M5LjczODU4IDcgNy41IDkuMjM4NTggNy41IDEyQzcuNSAxNC43NjE0IDkuNzM4NTggMTcgMTIuNSAxN1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMi41IDQxTDcuNSAyNUwxNy41IDI1TDEyLjUgNDFaIiBmaWxsPSIjM0I4MkY2Ii8+Cjwvc3ZnPgo=',
  shadowUrl:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjIwLjUiIGN5PSIyMC41IiByeD0iMjAuNSIgcnk9IjIwLjUiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuMyIvPgo8L3N2Zz4K',
});

interface LogisticsMapProps {
  points: RoutePoint[];
  vehicle: Vehicle;
  onPointAdd?: (coordinates: Coordinates, type: RoutePoint['type']) => void;
  onPointRemove?: (pointId: string) => void;
  onPointEdit?: (point: RoutePoint) => void;
  pendingPointType?: RoutePoint['type'] | null;
}

export const LogisticsMap: React.FC<LogisticsMapProps> = ({
  points,
  vehicle,
  onPointAdd,
  onPointRemove,
  onPointEdit,
  pendingPointType,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<RoutePoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pointToDelete, setPointToDelete] = useState<RoutePoint | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [defaultMapCenter.lat, defaultMapCenter.lng],
      zoom: defaultZoom,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (pendingPointType && onPointAdd) {
        onPointAdd({ lat: e.latlng.lat, lng: e.latlng.lng }, pendingPointType);
      }
      setSelectedPoint(null);
      setTooltipPosition(null);
    };

    mapInstanceRef.current.off('click');
    mapInstanceRef.current.on('click', handleMapClick);

    return () => {
      mapInstanceRef.current?.off('click', handleMapClick);
    };
  }, [pendingPointType, onPointAdd]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      const container = mapInstanceRef.current.getContainer();
      container.style.cursor = pendingPointType ? 'crosshair' : '';
    }
  }, [pendingPointType]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    points.forEach((point) => {
      const icon = createCustomIcon(point.type, getPointColor(point.type));
      const marker = L.marker([point.coordinates.lat, point.coordinates.lng], { icon }).addTo(
        mapInstanceRef.current!
      );

      marker.on('click', (e) => {
        e.originalEvent.stopPropagation();
        setSelectedPoint(point);
        const pixelPosition = mapInstanceRef.current!.latLngToContainerPoint(e.latlng);
        setTooltipPosition({ x: pixelPosition.x, y: pixelPosition.y });
      });

      if (onPointEdit) {
        marker.dragging?.enable();
        marker.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          onPointEdit({ ...point, coordinates: { lat: newPos.lat, lng: newPos.lng } });
        });
      }

      markersRef.current.set(point.id, marker);
    });

    if (routeLineRef.current) {
      routeLineRef.current.remove();
    }

    if (points.length > 1) {
      const routeCoords = points.map((p) => [p.coordinates.lat, p.coordinates.lng] as [number, number]);
      routeLineRef.current = L.polyline(routeCoords, {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 5',
      }).addTo(mapInstanceRef.current);
    }
  }, [points, onPointEdit]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    vehicleMarkerRef.current?.remove();

    const vehicleIcon = createCustomIcon('truck', '#F97316');
    vehicleMarkerRef.current = L.marker([vehicle.coordinates.lat, vehicle.coordinates.lng], {
      icon: vehicleIcon,
      zIndexOffset: 1000,
    }).addTo(mapInstanceRef.current);
  }, [vehicle]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (points.length > 0) {
      const group = new L.FeatureGroup();
      points.forEach((point) =>
        L.marker([point.coordinates.lat, point.coordinates.lng]).addTo(group)
      );
      L.marker([vehicle.coordinates.lat, vehicle.coordinates.lng]).addTo(group);

      if (group.getLayers().length > 0) {
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    } else {
      mapInstanceRef.current.setView([vehicle.coordinates.lat, vehicle.coordinates.lng], 10);
    }
  }, [points.length, vehicle.coordinates]);

  const handleDeleteClick = (point: RoutePoint) => {
    setPointToDelete(point);
    setShowDeleteModal(true);
    setSelectedPoint(null);
    setTooltipPosition(null);
  };

  const handleDeleteConfirm = () => {
    if (pointToDelete && onPointRemove) {
      onPointRemove(pointToDelete.id);
    }
    setShowDeleteModal(false);
    setPointToDelete(null);
  };

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg overflow-hidden shadow-lg"
        style={{ minHeight: '500px' }}
      />

      <style>
        {`
          .custom-marker { width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center; }
          .marker-icon { transform:rotate(45deg);font-size:14px; }
          .custom-div-icon { background:transparent !important;border:none !important; }
          .leaflet-container { font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif; }
          .leaflet-control-zoom { border:none !important;box-shadow:0 4px 12px rgba(0,0,0,.15) !important; }
          .leaflet-control-zoom a { background:white !important;border:none !important;color:#374151 !important;font-weight:600 !important;transition:all .2s ease !important; }
          .leaflet-control-zoom a:hover { background:#F3F4F6 !important;color:#1F2937 !important; }
        `}
      </style>

      {selectedPoint && tooltipPosition && (
        <div
          className="absolute z-[1000]"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            transform: 'translateY(-100%)',
          }}
        >
          <PointTooltip
            point={selectedPoint}
            onEdit={onPointEdit}
            onDelete={handleDeleteClick}
            onClose={() => { setSelectedPoint(null); setTooltipPosition(null); }}
          />
        </div>
      )}

      {pendingPointType && (
        <div className="absolute top-4 left-4 z-[1000] bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            <span className="text-sm font-medium">
              Click on the map to add a {pendingPointType.replace('-', ' ')} point
            </span>
          </div>
        </div>
      )}

      {showDeleteModal && pointToDelete && (
        <DeleteConfirmationModal
          pointName={pointToDelete.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setShowDeleteModal(false); setPointToDelete(null); }}
        />
      )}
    </div>
  );
};
