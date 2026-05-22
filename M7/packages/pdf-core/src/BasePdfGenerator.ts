import jsPDF from 'jspdf'
import {
  COMPANY_NAME,
  CONTENT_START_Y,
  FOOTER_LINES,
  LOGO_PATH,
  MARGINS,
} from './constants'
import { PdfDocumentBuilder } from './PdfDocumentBuilder'
import type { PdfGeneratorOptions } from './types'
import { loadLogo } from './utils/logoLoader'

export abstract class BasePdfGenerator<TData> {
  protected logoPath: string = LOGO_PATH
  protected companyName: string = COMPANY_NAME
  protected options: PdfGeneratorOptions = {}

  protected abstract getTitle(data: TData): string
  protected abstract getFilename(data: TData): string
  protected abstract renderSections(builder: PdfDocumentBuilder, data: TData): void

  protected renderSubtitle(_doc: jsPDF, _data: TData): void {
    // optional hook
  }

  protected getContentStartY(): number {
    return CONTENT_START_Y
  }

  async generate(data: TData, options: PdfGeneratorOptions = {}): Promise<void> {
    this.options = { includeFooter: true, ...options }
    const doc = await this.buildDocument(data)
    doc.save(this.getFilename(data))
  }

  async toBlob(data: TData, options: PdfGeneratorOptions = {}): Promise<Blob> {
    this.options = { includeFooter: true, ...options }
    const doc = await this.buildDocument(data)
    return doc.output('blob')
  }

  protected async buildDocument(data: TData): Promise<jsPDF> {
    const doc = new jsPDF()
    const logoDataUrl = await loadLogo(this.logoPath)

    await this.renderHeader(doc, logoDataUrl, data)
    this.renderSubtitle(doc, data)

    if (this.options.includeWatermark) {
      this.renderWatermark(doc)
    }

    const builder = new PdfDocumentBuilder(doc, this.getContentStartY())
    this.renderSections(builder, data)

    if (this.options.includeFooter !== false) {
      this.renderFooter(doc)
    }

    return doc
  }

  protected async renderHeader(
    doc: jsPDF,
    logoDataUrl: string | null,
    data: TData,
  ): Promise<void> {
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 15, 15, 15, 15)
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(this.getTitle(data), MARGINS.left, 35)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(this.companyName, MARGINS.left, 42)
  }

  protected renderWatermark(doc: jsPDF): void {
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(50)
    doc.setTextColor(200, 200, 200)
    doc.setFont('helvetica', 'bold')
    doc.text('SAMPLE DOCUMENT', pageWidth / 2, pageHeight / 2, {
      angle: 45,
      align: 'center',
    })
    doc.setTextColor(0, 0, 0)
  }

  protected renderFooter(doc: jsPDF): void {
    const pageHeight = doc.internal.pageSize.height
    const pageWidth = doc.internal.pageSize.width

    doc.setDrawColor(200, 200, 200)
    doc.line(MARGINS.left, pageHeight - 25, pageWidth - MARGINS.right, pageHeight - 25)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)

    FOOTER_LINES.forEach((line, idx) =>
      doc.text(line, MARGINS.left, pageHeight - 18 + idx * 6),
    )

    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 12)
    }

    doc.setTextColor(0, 0, 0)
  }
}
