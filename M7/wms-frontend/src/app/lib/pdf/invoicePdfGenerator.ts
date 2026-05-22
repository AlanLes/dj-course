import {
  BasePdfGenerator,
  formatCurrency,
  formatDateShort,
  PdfDocumentBuilder,
  WMS_LOGO_PATH,
} from '@deliveroo/pdf-core'
import { Invoice } from '../../features/billing-payments/billing.model'

export interface InvoiceData extends Invoice {
  companyInfo?: {
    name: string
    address: string
    city: string
    phone: string
    email: string
  }
  contractorInfo?: {
    address: string
    city: string
    email: string
  }
  taxRate?: number
  paymentTerms?: string
  notes?: string
}

class InvoicePdfGenerator extends BasePdfGenerator<InvoiceData> {
  protected override logoPath = WMS_LOGO_PATH

  protected getTitle(data: InvoiceData): string {
    return `Invoice - ${data.invoiceNumber}`
  }

  protected getFilename(data: InvoiceData): string {
    return `Invoice_${data.invoiceNumber}.pdf`
  }

  protected renderSections(builder: PdfDocumentBuilder, data: InvoiceData): void {
    const companyInfo = data.companyInfo ?? {
      name: 'Warehouse Management System',
      address: '123 Industrial Blvd',
      city: 'Chicago, IL 60601',
      phone: '+1-555-0100',
      email: 'billing@wms.com',
    }

    const contractorInfo = data.contractorInfo ?? {
      address: '123 Business Ave',
      city: 'Business City, BC 12345',
      email: `contact@${data.contractorName.toLowerCase().replace(/\s+/g, '')}.com`,
    }

    const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const taxRate = data.taxRate ?? 0.085
    const tax = subtotal * taxRate
    const total = subtotal + tax

    builder
      .section('Invoice Information')
      .field('Invoice Number', data.invoiceNumber)
      .field('Status', data.status.toUpperCase())
      .field('Issue Date', formatDateShort(data.issueDate))
      .field('Due Date', formatDateShort(data.dueDate))
      .section('From')
      .field('Company', companyInfo.name)
      .field('Address', companyInfo.address)
      .field('City', companyInfo.city)
      .field('Phone', companyInfo.phone)
      .field('Email', companyInfo.email)
      .section('Bill To')
      .field('Contractor', data.contractorName)
      .field('Contractor ID', data.contractorId)
      .field('Address', contractorInfo.address)
      .field('City', contractorInfo.city)
      .field('Email', contractorInfo.email)
      .section('Invoice Items')
      .table(
        ['Description', 'Qty', 'Unit Price', 'Total'],
        data.items.map((item) => [
          item.description,
          item.quantity.toString(),
          formatCurrency(item.unitPrice, 'USD'),
          formatCurrency(item.totalPrice, 'USD'),
        ]),
        { colWidths: [100, 20, 35, 35], startX: 20, rowFontSize: 10 },
      )
      .section('Summary')
      .field('Subtotal', formatCurrency(subtotal, 'USD'))
      .field('Tax', `${formatCurrency(tax, 'USD')} (${(taxRate * 100).toFixed(1)}%)`)
      .field('Total Amount', formatCurrency(total, 'USD'))
      .section('Payment Information')
      .field('Payment Terms', data.paymentTerms ?? 'Net 30 days')
      .field(
        'Payment Methods',
        'Bank Transfer: Account #123-456-789 or Check: Payable to "WMS Inc."',
        160,
      )
      .section('Notes')
      .fieldMultiline(
        'Additional Information',
        data.notes ??
          'Thank you for your business! Please remit payment within 30 days of the invoice date. ' +
            'For any questions regarding this invoice, please contact our billing department at billing@wms.com.',
        160,
      )
  }
}

const invoicePdfGenerator = new InvoicePdfGenerator()

export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<void> {
  return invoicePdfGenerator.generate(invoiceData)
}
