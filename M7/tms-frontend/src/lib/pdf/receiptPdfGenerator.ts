import { BasePdfGenerator, PdfDocumentBuilder } from '@deliveroo/pdf-core'

export interface PaymentReceiptData {
  id: string | number
  amount: string | number
  status: string
  method: string
  invoice?: string
  date: string
}

class ReceiptPdfGenerator extends BasePdfGenerator<PaymentReceiptData> {
  protected getTitle(_data: PaymentReceiptData): string {
    return 'Payment Receipt'
  }

  protected getFilename(data: PaymentReceiptData): string {
    return `Receipt_${data.id}.pdf`
  }

  protected renderSections(builder: PdfDocumentBuilder, data: PaymentReceiptData): void {
    builder
      .section('Payment Details')
      .field('Payment ID', String(data.id))
      .field('Amount', String(data.amount))
      .field('Status', data.status)
      .field('Method', data.method)
      .field('Invoice', data.invoice ?? '-')
      .field('Date', data.date)
  }
}

const receiptPdfGenerator = new ReceiptPdfGenerator()

export async function generateReceiptPDF(payment: PaymentReceiptData): Promise<void> {
  return receiptPdfGenerator.generate(payment)
}
