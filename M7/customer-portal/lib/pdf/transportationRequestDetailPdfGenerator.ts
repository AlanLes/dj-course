import {
  BasePdfGenerator,
  formatCurrency,
  formatDate,
  PdfDocumentBuilder,
} from '@deliveroo/pdf-core'

export interface TransportationRequestDetailData {
  id: string
  requestNumber: string
  status: string
  priority: string
  pickupLocation: {
    address: {
      street: string
      city: string
      postalCode: string
      country: string
    }
    contactPerson: string
    contactPhone: string
    contactEmail: string
  }
  deliveryLocation: {
    address: {
      street: string
      city: string
      postalCode: string
      country: string
    }
    contactPerson: string
    contactPhone: string
    contactEmail: string
  }
  cargo: {
    description: string
    cargoType: string
    weight: number
    dimensions: {
      length: number
      width: number
      height: number
      unit: string
    }
    value: number
    currency: string
    packaging: string
    quantity: number
    unitType: string
  }
  serviceType: string
  vehicleRequirements?: {
    vehicleType: string
    capacity: number
  }
  requestedPickupDate: Date | string
  requestedDeliveryDate: Date | string
  specialInstructions?: string
  requiresInsurance: boolean
  requiresCustomsClearance: boolean
  estimatedCost?: number
  finalCost?: number
  currency: string
  trackingNumber?: string
  createdAt: Date | string
}

class TransportationRequestDetailPdfGenerator extends BasePdfGenerator<TransportationRequestDetailData> {
  protected getTitle(_data: TransportationRequestDetailData): string {
    return 'Transportation Request'
  }

  protected getFilename(data: TransportationRequestDetailData): string {
    return `Transportation_Request_${data.requestNumber}.pdf`
  }

  protected renderSections(
    builder: PdfDocumentBuilder,
    request: TransportationRequestDetailData,
  ): void {
    const pickupAddress = `${request.pickupLocation.address.street}, ${request.pickupLocation.address.city}, ${request.pickupLocation.address.postalCode}, ${request.pickupLocation.address.country}`
    const deliveryAddress = `${request.deliveryLocation.address.street}, ${request.deliveryLocation.address.city}, ${request.deliveryLocation.address.postalCode}, ${request.deliveryLocation.address.country}`

    builder
      .section('Request Information')
      .inlineField('Request Number:', request.requestNumber)
      .inlineField('Status:', request.status)
      .inlineField('Priority:', request.priority)
      .inlineField('Created:', formatDate(request.createdAt))
      .section('Pickup Location')
      .fieldMultiline('Address:', pickupAddress)
      .inlineField('Contact Person:', request.pickupLocation.contactPerson)
      .inlineField('Phone:', request.pickupLocation.contactPhone)
      .inlineField('Email:', request.pickupLocation.contactEmail)
      .section('Delivery Location')
      .fieldMultiline('Address:', deliveryAddress)
      .inlineField('Contact Person:', request.deliveryLocation.contactPerson)
      .inlineField('Phone:', request.deliveryLocation.contactPhone)
      .inlineField('Email:', request.deliveryLocation.contactEmail)
      .section('Cargo Information')
      .fieldMultiline('Description:', request.cargo.description)
      .inlineField('Cargo Type:', request.cargo.cargoType)
      .inlineField('Weight:', `${request.cargo.weight} kg`)
      .inlineField(
        'Dimensions:',
        `${request.cargo.dimensions.length} × ${request.cargo.dimensions.width} × ${request.cargo.dimensions.height} ${request.cargo.dimensions.unit}`,
      )
      .inlineField('Quantity:', `${request.cargo.quantity} ${request.cargo.unitType}`)
      .inlineField('Value:', formatCurrency(request.cargo.value, request.cargo.currency))
      .inlineField('Packaging:', request.cargo.packaging)
      .section('Service Details')
      .inlineField('Service Type:', request.serviceType)
      .inlineField('Requested Pickup Date:', formatDate(request.requestedPickupDate))
      .inlineField('Requested Delivery Date:', formatDate(request.requestedDeliveryDate))

    if (request.vehicleRequirements) {
      builder.inlineField('Vehicle Type:', request.vehicleRequirements.vehicleType)
    }

    builder
      .inlineField('Requires Insurance:', request.requiresInsurance ? 'Yes' : 'No')
      .inlineField('Requires Customs Clearance:', request.requiresCustomsClearance ? 'Yes' : 'No')

    if (request.specialInstructions) {
      builder.fieldMultiline('Special Instructions:', request.specialInstructions)
    }

    if (request.trackingNumber) {
      builder.inlineField('Tracking Number:', request.trackingNumber)
    }

    builder.section('Pricing')

    if (request.estimatedCost) {
      builder.inlineField('Estimated Cost:', formatCurrency(request.estimatedCost, request.currency))
    }
    if (request.finalCost) {
      builder.inlineField('Final Cost:', formatCurrency(request.finalCost, request.currency))
    }
  }
}

const transportationRequestDetailPdfGenerator = new TransportationRequestDetailPdfGenerator()

export async function generateTransportationRequestDetailPDF(
  request: TransportationRequestDetailData,
): Promise<void> {
  return transportationRequestDetailPdfGenerator.generate(request)
}
