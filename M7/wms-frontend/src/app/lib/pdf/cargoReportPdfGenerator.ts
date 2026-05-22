import {
  BasePdfGenerator,
  formatCurrency,
  formatDateShort,
  formatDateTime,
  PdfDocumentBuilder,
  WMS_LOGO_PATH,
} from '@deliveroo/pdf-core'
import { InventoryItem } from '../../features/inventory/inventory.model'
import {
  CargoDocument,
  CargoEvent,
  CargoLocationHistory,
} from '../../features/cargo-management/cargo.model'

export interface CargoReportData extends InventoryItem {
  events?: CargoEvent[]
  locationHistory?: CargoLocationHistory[]
  documents?: CargoDocument[]
}

class CargoReportPdfGenerator extends BasePdfGenerator<CargoReportData> {
  protected override logoPath = WMS_LOGO_PATH

  protected getTitle(data: CargoReportData): string {
    return `Cargo Report - ${data.sku}`
  }

  protected getFilename(data: CargoReportData): string {
    const reportDate = formatDateShort(new Date()).replace(/\s+/g, '_')
    return `Cargo_Report_${data.sku}_${reportDate}.pdf`
  }

  protected override renderSubtitle(doc: import('jspdf').default, _data: CargoReportData): void {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Report Date: ${formatDateShort(new Date())}`, 20, 48)
  }

  protected override getContentStartY(): number {
    return 55
  }

  protected renderSections(builder: PdfDocumentBuilder, data: CargoReportData): void {
    builder
      .section('Basic Information')
      .field('SKU', data.sku)
      .field('Name', data.name)
      .field('Description', data.description, 160)
      .field('Category', data.category)
      .field('Status', data.status.toUpperCase())
      .section('Quantity & Storage')
      .field('Quantity', `${data.quantity} ${data.unit}`)
      .field('Location', data.location)
      .field('Zone', `${data.zoneName} (Zone ID: ${data.zoneId})`)
      .field('Shelf Location', `${data.shelfLocation} (Shelf ID: ${data.shelfId})`)
      .section('Physical Attributes')
      .field('Weight', `${data.weight} kg`)
      .field('Volume', `${data.volume} m³`)
      .field('Value', formatCurrency(data.value, data.currency))

    if (data.batchNumber) {
      builder.field('Batch Number', data.batchNumber)
    }
    if (data.serialNumber) {
      builder.field('Serial Number', data.serialNumber)
    }
    if (data.expiryDate) {
      builder.field('Expiry Date', formatDateShort(data.expiryDate))
    }

    builder.field('Last Updated', formatDateTime(data.lastUpdated))

    if (data.contractorId && data.contractorName) {
      builder
        .section('Contractor Information')
        .field('Contractor Name', data.contractorName)
        .field('Contractor ID', data.contractorId)
    }

    if (data.events && data.events.length > 0) {
      builder
        .section('Event Timeline')
        .table(
          ['Type', 'Title', 'Employee', 'Date'],
          data.events.map((event) => [
            event.type.substring(0, 12),
            event.title.substring(0, 25),
            event.employee.substring(0, 18),
            formatDateTime(event.timestamp),
          ]),
          { colWidths: [30, 60, 45, 40], rowFontSize: 8 },
        )
    }

    if (data.locationHistory && data.locationHistory.length > 0) {
      builder
        .section('Location History')
        .table(
          ['Location', 'Details', 'Date', 'Duration'],
          data.locationHistory.map((history) => [
            history.location.substring(0, 20),
            history.details.substring(0, 18),
            formatDateShort(history.movedDate),
            history.duration,
          ]),
          { colWidths: [60, 55, 35, 30], rowFontSize: 8 },
        )
    }

    if (data.documents && data.documents.length > 0) {
      builder
        .section('Documentation')
        .table(
          ['Document Name', 'Type', 'Size', 'Upload Date'],
          data.documents.map((document) => [
            document.name.substring(0, 30),
            document.type,
            document.size,
            formatDateShort(document.uploadDate),
          ]),
          { colWidths: [90, 30, 25, 35], rowFontSize: 8 },
        )
    }

    builder
      .section('Report Summary')
      .field('Report Generated', formatDateTime(new Date()))
      .field('Report Type', 'Comprehensive Cargo Report')
      .fieldMultiline(
        'Notes',
        'This cargo report provides a comprehensive overview of the cargo item including its current status, location, physical attributes, and historical data. For more detailed information or updates, please access the warehouse management system.',
        160,
      )
  }
}

const cargoReportPdfGenerator = new CargoReportPdfGenerator()

export async function generateCargoReportPDF(cargoData: CargoReportData): Promise<void> {
  return cargoReportPdfGenerator.generate(cargoData)
}
