import {
  BasePdfGenerator,
  formatCurrency,
  formatDate,
  formatEnumLabel,
  formatYesNo,
  PdfDocumentBuilder,
} from '@deliveroo/pdf-core'

export interface WarehousingRequestFormData {
  storageType: string
  securityLevel: string
  estimatedVolume: number
  estimatedWeight: number
  estimatedStorageDuration: {
    value: number
    unit: 'days' | 'weeks' | 'months' | 'years'
  }
  plannedStartDate: string | Date
  plannedEndDate?: string | Date
  handlingServices: string[]
  valueAddedServices: string[]
  requiresTemperatureControl: boolean
  requiresHumidityControl: boolean
  requiresSpecialHandling: boolean
  specialInstructions?: string
  billingType: string
  cargo: {
    description: string
    cargoType: string
    packaging: string
    quantity: number
    unitType: string
    value: number
    currency: string
  }
  priority: string
}

export interface WarehousingRequestPdfOptions {
  requestNumber?: string
  createdAt?: Date | string
  storageLocation?: string
}

export interface WarehousingRequestPdfInput {
  formData: WarehousingRequestFormData
  options?: WarehousingRequestPdfOptions
}

function formatPlannedDate(date: string | Date | undefined): string {
  if (!date) return 'Not specified'
  try {
    const d = date instanceof Date ? date : new Date(date)
    return formatDate(d)
  } catch {
    return 'Not specified'
  }
}

class WarehousingRequestPdfGenerator extends BasePdfGenerator<WarehousingRequestPdfInput> {
  protected getTitle(_data: WarehousingRequestPdfInput): string {
    return 'Warehousing Request'
  }

  protected getFilename(data: WarehousingRequestPdfInput): string {
    const { options } = data
    return options?.requestNumber
      ? `Warehousing_Request_${options.requestNumber}.pdf`
      : `Warehousing_Request_${new Date().toISOString().split('T')[0]}.pdf`
  }

  protected renderSections(builder: PdfDocumentBuilder, { formData, options = {} }: WarehousingRequestPdfInput): void {
    builder.section('Request Information')

    if (options.requestNumber) {
      builder.inlineField('Request Number:', options.requestNumber)
    }

    builder
      .inlineField(
        'Storage Type:',
        formData.storageType ? formatEnumLabel(formData.storageType) : 'Not specified',
      )
      .inlineField(
        'Priority:',
        formData.priority ? formatEnumLabel(formData.priority) : 'Not specified',
      )

    if (options.createdAt) {
      const createdDate =
        typeof options.createdAt === 'string' ? new Date(options.createdAt) : options.createdAt
      builder.inlineField('Created:', formatDate(createdDate))
    }

    builder
      .spacer()
      .section('Storage Information')
      .inlineField('Estimated Volume:', `${formData.estimatedVolume} m³`)
      .inlineField('Estimated Weight:', `${formData.estimatedWeight} kg`)
      .inlineField(
        'Security Level:',
        formData.securityLevel ? formatEnumLabel(formData.securityLevel) : 'Not specified',
      )

    if (options.storageLocation) {
      builder.inlineField('Storage Location:', options.storageLocation)
    }

    builder
      .inlineField('Planned Start Date:', formatPlannedDate(formData.plannedStartDate))
      .inlineFieldIf('Planned End Date:', formData.plannedEndDate ? formatPlannedDate(formData.plannedEndDate) : undefined)
      .inlineField(
        'Storage Duration:',
        `${formData.estimatedStorageDuration?.value ?? 0} ${formData.estimatedStorageDuration?.unit ?? 'months'}`,
      )
      .inlineField(
        'Billing Type:',
        formData.billingType ? formatEnumLabel(formData.billingType) : 'Not specified',
      )
      .section('Cargo Information')
      .fieldMultiline('Description:', formData.cargo?.description || 'No description provided')
      .inlineField(
        'Cargo Type:',
        formData.cargo?.cargoType ? formatEnumLabel(formData.cargo.cargoType) : 'Not specified',
      )
      .inlineField(
        'Packaging:',
        formData.cargo?.packaging ? formatEnumLabel(formData.cargo.packaging) : 'Not specified',
      )
      .inlineField('Quantity:', `${formData.cargo?.quantity || 0} ${formData.cargo?.unitType || ''}`)

    if (formData.cargo?.value && formData.cargo.value > 0) {
      builder.inlineField(
        'Estimated Value:',
        formatCurrency(formData.cargo.value, formData.cargo.currency || 'EUR'),
      )
    }

    builder
      .spacer()
      .section('Service Requirements')

    if (formData.handlingServices?.length > 0) {
      builder.inlineField(
        'Handling Services:',
        formData.handlingServices.map((s) => formatEnumLabel(String(s))).join(', '),
      )
    }

    if (formData.valueAddedServices?.length > 0) {
      builder.inlineField(
        'Value Added Services:',
        formData.valueAddedServices.map((s) => formatEnumLabel(String(s))).join(', '),
      )
    }

    builder
      .inlineField('Requires Temperature Control:', formatYesNo(formData.requiresTemperatureControl))
      .inlineField('Requires Humidity Control:', formatYesNo(formData.requiresHumidityControl))
      .inlineField('Requires Special Handling:', formatYesNo(formData.requiresSpecialHandling))

    if (formData.specialInstructions) {
      builder.fieldMultiline('Special Instructions:', formData.specialInstructions)
    }
  }
}

const warehousingRequestPdfGenerator = new WarehousingRequestPdfGenerator()

export async function generateWarehousingRequestPDF(
  formData: WarehousingRequestFormData,
  options: WarehousingRequestPdfOptions = {},
): Promise<void> {
  return warehousingRequestPdfGenerator.generate({ formData, options })
}
