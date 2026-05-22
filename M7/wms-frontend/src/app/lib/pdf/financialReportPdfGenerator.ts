import {
  BasePdfGenerator,
  formatCurrency,
  formatDateShort,
  PdfDocumentBuilder,
  WMS_LOGO_PATH,
} from '@deliveroo/pdf-core'
import { BillingOverview, Invoice } from '../../features/billing-payments/billing.model'

export interface FinancialReportData {
  overview: BillingOverview
  invoices: Invoice[]
  reportPeriod?: string
}

class FinancialReportPdfGenerator extends BasePdfGenerator<FinancialReportData> {
  protected override logoPath = WMS_LOGO_PATH

  protected getTitle(_data: FinancialReportData): string {
    return 'Financial Report'
  }

  protected getFilename(_data: FinancialReportData): string {
    const saveDate = formatDateShort(new Date()).replace(/\s+/g, '_')
    return `Financial_Report_${saveDate}.pdf`
  }

  protected override renderSubtitle(doc: import('jspdf').default, data: FinancialReportData): void {
    const reportPeriod =
      data.reportPeriod ??
      `As of ${formatDateShort(new Date())}`
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(reportPeriod, 20, 48)
  }

  protected renderSections(builder: PdfDocumentBuilder, data: FinancialReportData): void {
    const paidRevenue = data.invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0)

    const overdueRevenue = data.invoices
      .filter((inv) => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0)

    const pendingRevenue = data.invoices
      .filter((inv) => inv.status === 'sent')
      .reduce((sum, inv) => sum + inv.amount, 0)

    const draftRevenue = data.invoices
      .filter((inv) => inv.status === 'draft')
      .reduce((sum, inv) => sum + inv.amount, 0)

    const statusCounts = {
      paid: data.invoices.filter((inv) => inv.status === 'paid').length,
      sent: data.invoices.filter((inv) => inv.status === 'sent').length,
      overdue: data.invoices.filter((inv) => inv.status === 'overdue').length,
      draft: data.invoices.filter((inv) => inv.status === 'draft').length,
    }

    builder
      .section('Revenue Summary')
      .field('Total Revenue', formatCurrency(data.overview.totalRevenue, 'USD'))
      .field('Total Invoices', data.overview.totalInvoices.toString())
      .field('Paid Invoices', data.overview.paidInvoices.toString())
      .field('Overdue Invoices', data.overview.overdueInvoices.toString())
      .field('Average Invoice Value', formatCurrency(data.overview.avgInvoiceValue, 'USD'))
      .section('Performance Metrics')
      .field('Average Payment Time', `${data.overview.avgPaymentTime} days`)
      .field('Collection Rate', `${data.overview.collectionRate.toFixed(1)}%`)
      .field('Paid Revenue', formatCurrency(paidRevenue, 'USD'))
      .field('Overdue Revenue', formatCurrency(overdueRevenue, 'USD'))
      .field('Pending Revenue', formatCurrency(pendingRevenue, 'USD'))
      .section('Invoice Status Breakdown')
      .tableWithColumns(
        [
          { header: 'Status', x: 20 },
          { header: 'Count', x: 100 },
          { header: 'Revenue', x: 140, align: 'right' },
        ],
        [
          ['Paid', statusCounts.paid.toString(), formatCurrency(paidRevenue, 'USD')],
          ['Sent', statusCounts.sent.toString(), formatCurrency(pendingRevenue, 'USD')],
          ['Overdue', statusCounts.overdue.toString(), formatCurrency(overdueRevenue, 'USD')],
          ['Draft', statusCounts.draft.toString(), formatCurrency(draftRevenue, 'USD')],
        ],
        10,
      )

    const contractorRevenue = new Map<string, { name: string; total: number; count: number }>()
    data.invoices.forEach((invoice) => {
      const existing = contractorRevenue.get(invoice.contractorId)
      if (existing) {
        existing.total += invoice.amount
        existing.count += 1
      } else {
        contractorRevenue.set(invoice.contractorId, {
          name: invoice.contractorName,
          total: invoice.amount,
          count: 1,
        })
      }
    })

    const topContractors = Array.from(contractorRevenue.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    if (topContractors.length > 0) {
      builder
        .section('Top 5 Contractors by Revenue')
        .tableWithColumns(
          [
            { header: 'Contractor', x: 20, width: 85 },
            { header: 'Invoices', x: 110 },
            { header: 'Total Revenue', x: 165, align: 'right' },
          ],
          topContractors.map((c) => [
            c.name,
            c.count.toString(),
            formatCurrency(c.total, 'USD'),
          ]),
          10,
        )
    }

    const recentInvoices = [...data.invoices]
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
      .slice(0, 10)

    if (recentInvoices.length > 0) {
      builder
        .section('Recent Invoices (Last 10)')
        .tableWithColumns(
          [
            { header: 'Invoice #', x: 20 },
            { header: 'Contractor', x: 55 },
            { header: 'Date', x: 110 },
            { header: 'Status', x: 145 },
            { header: 'Amount', x: 180, align: 'right' },
          ],
          recentInvoices.map((invoice) => [
            invoice.invoiceNumber,
            invoice.contractorName.substring(0, 15),
            formatDateShort(invoice.issueDate),
            invoice.status.toUpperCase(),
            formatCurrency(invoice.amount, 'USD'),
          ]),
          8,
        )
    }

    builder
      .section('Report Summary')
      .field('Report Generated', formatDateShort(new Date()))
      .field('Total Accounts', contractorRevenue.size.toString())
      .fieldMultiline(
        'Notes',
        'This financial report provides a comprehensive overview of billing and payment activities. For detailed invoice information, please refer to individual invoice documents.',
        160,
      )
  }
}

const financialReportPdfGenerator = new FinancialReportPdfGenerator()

export async function generateFinancialReportPDF(data: FinancialReportData): Promise<void> {
  return financialReportPdfGenerator.generate(data)
}
