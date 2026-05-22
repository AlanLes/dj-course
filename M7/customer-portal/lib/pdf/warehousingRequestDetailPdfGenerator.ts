import {
  BasePdfGenerator,
  formatCurrency,
  formatDate,
  PdfDocumentBuilder,
} from '@deliveroo/pdf-core'

export interface WarehousingRequestDetailData {
  id: string
  requestNumber: string
  status: string
  priority: string
  storageType: string
  estimatedVolume: number
  estimatedWeight: number
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
  estimatedStorageDuration: {
    value: number
    unit: string
  }
  plannedStartDate: Date | string
  plannedEndDate?: Date | string
  handlingServices: string[]
  valueAddedServices: string[]
  securityLevel: string
  requiresTemperatureControl: boolean
  requiresHumidityControl: boolean
  requiresSpecialHandling: boolean
  specialInstructions?: string
  estimatedCost?: number
  finalCost?: number
  currency: string
  billingType: string
  storageLocation?: string
  createdAt: Date | string
}

class WarehousingRequestDetailPdfGenerator extends BasePdfGenerator<WarehousingRequestDetailData> {
  protected getTitle(_data: WarehousingRequestDetailData): string {
    return 'Warehousing Request'
  }

  protected getFilename(data: WarehousingRequestDetailData): string {
    return `Warehousing_Request_${data.requestNumber}.pdf`
  }

  protected renderSections(builder: PdfDocumentBuilder, request: WarehousingRequestDetailData): void {
    builder
      .section('Request Information')
      .inlineField('Request Number:', request.requestNumber)
      .inlineField('Status:', request.status)
      .inlineField('Priority:', request.priority)
      .inlineField('Created:', formatDate(request.createdAt))
      .section('Storage Information')
      .inlineField('Storage Type:', request.storageType)
      .inlineField('Estimated Volume:', `${request.estimatedVolume} m³`)
      .inlineField('Estimated Weight:', `${request.estimatedWeight} kg`)
      .inlineField('Security Level:', request.securityLevel)
      .inlineFieldIf('Storage Location:', request.storageLocation)
      .inlineField('Planned Start Date:', formatDate(request.plannedStartDate))
      .inlineFieldIf(
        'Planned End Date:',
        request.plannedEndDate ? formatDate(request.plannedEndDate) : undefined,
      )
      .inlineField(
        'Storage Duration:',
        `${request.estimatedStorageDuration.value} ${request.estimatedStorageDuration.unit}`,
      )
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
      .section('Service Requirements')

    if (request.handlingServices.length > 0) {
      builder.inlineField('Handling Services:', request.handlingServices.join(', '))
    }

    if (request.valueAddedServices.length > 0) {
      builder.inlineField('Value Added Services:', request.valueAddedServices.join(', '))
    }

    builder
      .inlineField('Requires Temperature Control:', request.requiresTemperatureControl ? 'Yes' : 'No')
      .inlineField('Requires Humidity Control:', request.requiresHumidityControl ? 'Yes' : 'No')
      .inlineField('Requires Special Handling:', request.requiresSpecialHandling ? 'Yes' : 'No')

    if (request.specialInstructions) {
      builder.fieldMultiline('Special Instructions:', request.specialInstructions)
    }

    builder.section('Pricing').inlineField('Billing Type:', request.billingType)

    if (request.estimatedCost) {
      builder.inlineField('Estimated Cost:', formatCurrency(request.estimatedCost, request.currency))
    }
    if (request.finalCost) {
      builder.inlineField('Final Cost:', formatCurrency(request.finalCost, request.currency))
    }
  }
}

const warehousingRequestDetailPdfGenerator = new WarehousingRequestDetailPdfGenerator()

export async function generateWarehousingRequestDetailPDF(
  request: WarehousingRequestDetailData,
): Promise<void> {
  return warehousingRequestDetailPdfGenerator.generate(request)
}
