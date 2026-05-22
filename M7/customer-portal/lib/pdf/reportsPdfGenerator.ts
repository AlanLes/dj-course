import {
  BasePdfGenerator,
  formatCurrency,
  formatDate,
  PdfDocumentBuilder,
} from '@deliveroo/pdf-core'

interface MetricsData {
  totalShipments: number
  onTimeDelivery: number
  totalCost: number
  storageVolume: number
}

interface RoutePerformanceData {
  route: string
  shipments: number
  onTimePercentage: number
  avgCost: number
  totalRevenue: number
}

export interface ReportsData {
  dateRange: {
    from: string
    to: string
  }
  metrics: MetricsData
  routePerformance: RoutePerformanceData[]
}

class ReportsPdfGenerator extends BasePdfGenerator<ReportsData> {
  protected getTitle(_data: ReportsData): string {
    return 'Logistics Report'
  }

  protected getFilename(data: ReportsData): string {
    const fromDateStr = data.dateRange.from.replace(/-/g, '')
    const toDateStr = data.dateRange.to.replace(/-/g, '')
    return `Logistics_Report_${fromDateStr}_${toDateStr}.pdf`
  }

  protected renderSections(builder: PdfDocumentBuilder, data: ReportsData): void {
    const fromDate = formatDate(data.dateRange.from)
    const toDate = formatDate(data.dateRange.to)

    builder
      .section('Report Period')
      .field('Period', `${fromDate} - ${toDate}`)
      .section('Key Metrics')
      .inlineField('Total Shipments:', String(data.metrics.totalShipments))
      .inlineField('On-Time Delivery:', `${data.metrics.onTimeDelivery.toFixed(1)}%`)
      .inlineField('Total Cost:', formatCurrency(data.metrics.totalCost, 'EUR'))
      .inlineField('Storage Volume:', `${data.metrics.storageVolume.toLocaleString()} m³`)
      .section('Route Performance')
      .table(
        ['Route', 'Shipments', 'On-Time %', 'Avg Cost', 'Revenue'],
        data.routePerformance.map((route) => [
          route.route,
          String(route.shipments),
          `${route.onTimePercentage}%`,
          formatCurrency(route.avgCost, 'EUR', 0),
          formatCurrency(route.totalRevenue, 'EUR', 0),
        ]),
        { colWidths: [60, 30, 30, 30, 30], rowFontSize: 8 },
      )
  }
}

const reportsPdfGenerator = new ReportsPdfGenerator()

export async function generateReportsPDF(reportsData: ReportsData): Promise<void> {
  return reportsPdfGenerator.generate(reportsData)
}
