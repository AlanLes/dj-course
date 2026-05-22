import {
  BasePdfGenerator,
  formatCurrency,
  formatDate,
  PdfDocumentBuilder,
} from '@deliveroo/pdf-core'

export interface InvoiceData {
  id: string
  number: string
  description: string
  date: Date
  amount: number
  status: 'Paid' | 'Unpaid' | 'Overdue'
  dueDate: Date
}

class InvoicePdfGenerator extends BasePdfGenerator<InvoiceData> {
  protected getTitle(_data: InvoiceData): string {
    return 'Invoice'
  }

  protected getFilename(data: InvoiceData): string {
    return `Invoice_${data.number}.pdf`
  }

  protected renderSections(builder: PdfDocumentBuilder, invoice: InvoiceData): void {
    builder
      .section('Invoice Details')
      .field('Invoice Number', invoice.number)
      .field('Invoice ID', String(invoice.id))
      .field('Description', invoice.description)
      .field('Amount', formatCurrency(invoice.amount, 'USD'))
      .field('Status', invoice.status)
      .field('Invoice Date', formatDate(invoice.date))
      .field('Due Date', formatDate(invoice.dueDate))
  }
}

const invoicePdfGenerator = new InvoicePdfGenerator()

export async function generateInvoicePDF(invoice: InvoiceData): Promise<void> {
  return invoicePdfGenerator.generate(invoice)
}
