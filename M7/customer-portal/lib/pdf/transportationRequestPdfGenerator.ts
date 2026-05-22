import {
  BasePdfGenerator,
  formatCurrency,
  formatDate,
  formatEnumLabel,
  formatYesNo,
  PdfDocumentBuilder,
} from '@deliveroo/pdf-core'

export interface TransportationRequestFormData {
  serviceType: string
  pickupLocation: {
    address: {
      street: string
      city: string
      country: string
    }
    contactPerson: string
    contactPhone: string
    contactEmail?: string
    loadingType?: string
  }
  deliveryLocation: {
    address: {
      street: string
      city: string
      country: string
    }
    contactPerson: string
    contactPhone: string
    contactEmail?: string
    loadingType?: string
  }
  cargo: {
    description: string
    cargoType: string
    weight: number
    packaging: string
    quantity: number
    unitType: string
    value: number
    currency: string
    fragile?: boolean
    stackable?: boolean
  }
  requestedPickupDate: string | Date
  requestedDeliveryDate?: string | Date
  specialInstructions?: string
  requiresInsurance: boolean
  requiresCustomsClearance: boolean
  priority: string
  currency: string
}

export interface TransportationRequestPdfOptions {
  requestNumber?: string
  createdAt?: Date | string
}

export interface TransportationRequestPdfInput {
  formData: TransportationRequestFormData
  options?: TransportationRequestPdfOptions
}

class TransportationRequestPdfGenerator extends BasePdfGenerator<TransportationRequestPdfInput> {
  protected getTitle(_data: TransportationRequestPdfInput): string {
    return 'Transportation Request'
  }

  protected getFilename(data: TransportationRequestPdfInput): string {
    const { options } = data
    return options?.requestNumber
      ? `Transportation_Request_${options.requestNumber}.pdf`
      : `Transportation_Request_${new Date().toISOString().split('T')[0]}.pdf`
  }

  protected renderSections(
    builder: PdfDocumentBuilder,
    { formData, options = {} }: TransportationRequestPdfInput,
  ): void {
    const pickupAddress = `${formData.pickupLocation.address.street}, ${formData.pickupLocation.address.city}, ${formData.pickupLocation.address.country}`
    const deliveryAddress = `${formData.deliveryLocation.address.street}, ${formData.deliveryLocation.address.city}, ${formData.deliveryLocation.address.country}`
    const pickupDate =
      typeof formData.requestedPickupDate === 'string'
        ? new Date(formData.requestedPickupDate)
        : formData.requestedPickupDate

    builder.section('Request Information')

    if (options.requestNumber) {
      builder.inlineField('Request Number:', options.requestNumber)
    }

    builder
      .inlineField('Service Type:', formatEnumLabel(formData.serviceType))
      .inlineField('Priority:', formatEnumLabel(formData.priority))

    if (options.createdAt) {
      const createdDate =
        typeof options.createdAt === 'string' ? new Date(options.createdAt) : options.createdAt
      builder.inlineField('Created:', formatDate(createdDate))
    }

    builder
      .spacer()
      .section('Pickup Location')
      .fieldMultiline('Address:', pickupAddress)
      .inlineField('Contact Person:', formData.pickupLocation.contactPerson)
      .inlineField('Phone:', formData.pickupLocation.contactPhone)
      .inlineFieldIf('Email:', formData.pickupLocation.contactEmail)
      .inlineField('Requested Pickup Date:', formatDate(pickupDate))
      .inlineFieldIf(
        'Loading Type:',
        formData.pickupLocation.loadingType
          ? formatEnumLabel(formData.pickupLocation.loadingType)
          : undefined,
      )
      .spacer()
      .section('Delivery Location')
      .fieldMultiline('Address:', deliveryAddress)
      .inlineField('Contact Person:', formData.deliveryLocation.contactPerson)
      .inlineField('Phone:', formData.deliveryLocation.contactPhone)
      .inlineFieldIf('Email:', formData.deliveryLocation.contactEmail)

    if (formData.requestedDeliveryDate) {
      const deliveryDate =
        typeof formData.requestedDeliveryDate === 'string'
          ? new Date(formData.requestedDeliveryDate)
          : formData.requestedDeliveryDate
      builder.inlineField('Requested Delivery Date:', formatDate(deliveryDate))
    }

    if (formData.deliveryLocation.loadingType) {
      builder.inlineField(
        'Unloading Type:',
        formatEnumLabel(formData.deliveryLocation.loadingType),
      )
    }

    builder
      .spacer()
      .section('Cargo Information')
      .fieldMultiline('Description:', formData.cargo.description)
      .inlineField('Cargo Type:', formatEnumLabel(formData.cargo.cargoType))
      .inlineField('Weight:', `${formData.cargo.weight} kg`)
      .inlineField('Packaging:', formatEnumLabel(formData.cargo.packaging))
      .inlineField('Quantity:', `${formData.cargo.quantity} ${formData.cargo.unitType}`)

    if (formData.cargo.value > 0) {
      builder.inlineField(
        'Estimated Value:',
        formatCurrency(formData.cargo.value, formData.cargo.currency || 'EUR'),
      )
    }

    if (formData.cargo.fragile !== undefined) {
      builder.inlineField('Fragile:', formatYesNo(formData.cargo.fragile))
    }
    if (formData.cargo.stackable !== undefined) {
      builder.inlineField('Stackable:', formatYesNo(formData.cargo.stackable))
    }

    builder
      .spacer()
      .section('Service Requirements')
      .inlineField('Requires Insurance:', formatYesNo(formData.requiresInsurance))
      .inlineField('Requires Customs Clearance:', formatYesNo(formData.requiresCustomsClearance))

    if (formData.specialInstructions) {
      builder.fieldMultiline('Special Instructions:', formData.specialInstructions)
    }
  }
}

const transportationRequestPdfGenerator = new TransportationRequestPdfGenerator()

export async function generateTransportationRequestPDF(
  formData: TransportationRequestFormData,
  options: TransportationRequestPdfOptions = {},
): Promise<void> {
  return transportationRequestPdfGenerator.generate({ formData, options })
}
