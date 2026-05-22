import { BasePdfGenerator, PdfDocumentBuilder } from '@deliveroo/pdf-core'

export interface TrackingEvent {
  id: number | string
  status: string
  location: string
  timestamp: string
  description: string
}

export interface ShipmentInfo {
  id: string | number
  origin: string
  destination: string
  driver: string
  eta?: string
  status?: string
}

export interface ShipmentRoutePdfData {
  shipment: ShipmentInfo
  events: TrackingEvent[]
}

class ShipmentRoutePdfGenerator extends BasePdfGenerator<ShipmentRoutePdfData> {
  protected getTitle(data: ShipmentRoutePdfData): string {
    return `Shipment Route - #${data.shipment.id}`
  }

  protected getFilename(data: ShipmentRoutePdfData): string {
    return `Shipment_${data.shipment.id}_Route.pdf`
  }

  protected renderSections(builder: PdfDocumentBuilder, data: ShipmentRoutePdfData): void {
    const { shipment, events } = data

    builder
      .section('Route Overview')
      .field('From', shipment.origin)
      .field('To', shipment.destination)
      .field('Driver', shipment.driver)

    if (shipment.eta) {
      builder.field('ETA', shipment.eta)
    }
    if (shipment.status) {
      builder.field('Status', shipment.status)
    }

    builder.section('Timeline').timeline(events)
  }
}

const shipmentRoutePdfGenerator = new ShipmentRoutePdfGenerator()

export async function generateShipmentRoutePDF(
  shipment: ShipmentInfo,
  events: TrackingEvent[],
): Promise<void> {
  return shipmentRoutePdfGenerator.generate({ shipment, events })
}
