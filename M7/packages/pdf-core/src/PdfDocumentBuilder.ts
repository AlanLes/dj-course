import type jsPDF from 'jspdf'
import {
  MARGINS,
  SECTION_BG,
  SECTION_HEIGHT,
} from './constants'
import type { TableColumn, TextOptions, TimelineEvent } from './types'

export class PdfDocumentBuilder {
  private yPos: number
  private readonly pageWidth: number
  private readonly pageHeight: number
  private readonly contentWidth: number

  constructor(
    private readonly doc: jsPDF,
    startY: number = 55,
  ) {
    this.pageWidth = doc.internal.pageSize.width
    this.pageHeight = doc.internal.pageSize.height
    this.contentWidth = this.pageWidth - MARGINS.left - MARGINS.right
    this.yPos = startY
  }

  getY(): number {
    return this.yPos
  }

  setY(y: number): this {
    this.yPos = y
    return this
  }

  getDoc(): jsPDF {
    return this.doc
  }

  getPageWidth(): number {
    return this.pageWidth
  }

  getPageHeight(): number {
    return this.pageHeight
  }

  private ensureSpace(height: number): void {
    if (this.yPos + height > this.pageHeight - MARGINS.footer) {
      this.doc.addPage()
      this.yPos = MARGINS.top
    }
  }

  section(title: string): this {
    this.ensureSpace(15)
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFillColor(...SECTION_BG)
    this.doc.rect(MARGINS.left, this.yPos, this.contentWidth, SECTION_HEIGHT, 'F')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(title, MARGINS.left + 2, this.yPos + 5.5)
    this.yPos += 15
    return this
  }

  /** Section title without gray background bar */
  sectionPlain(title: string): this {
    this.ensureSpace(13)
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text(title, MARGINS.left, this.yPos)
    this.yPos += 8
    return this
  }

  field(label: string, value: string, maxWidth: number = 80): this {
    this.ensureSpace(10)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(label, MARGINS.left, this.yPos)
    this.doc.setFont('helvetica', 'normal')
    const lines = this.doc.splitTextToSize(String(value), maxWidth)
    this.doc.text(lines, MARGINS.left, this.yPos + 4)
    this.yPos += lines.length * 4 + 6
    return this
  }

  inlineField(label: string, value: string, valueX: number = 80): this {
    this.ensureSpace(8)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(label, MARGINS.left, this.yPos)
    this.doc.setFont('helvetica', 'normal')
    const lines = this.doc.splitTextToSize(String(value), this.pageWidth - valueX - MARGINS.right)
    if (lines.length === 1) {
      this.doc.text(lines[0], valueX, this.yPos)
      this.yPos += 8
    } else {
      this.doc.text(lines, valueX, this.yPos)
      this.yPos += lines.length * 4 + 4
    }
    return this
  }

  /** Label at x, value at valueX on same line (TMS document style) */
  fieldPair(label: string, value: string, valueX: number = 60, maxWidth: number = 80): this {
    this.ensureSpace(10)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(label, MARGINS.left, this.yPos)
    this.doc.setFont('helvetica', 'normal')
    const lines = this.doc.splitTextToSize(String(value), maxWidth)
    this.doc.text(lines, valueX, this.yPos)
    this.yPos += Math.max(lines.length * 4, 6)
    return this
  }

  fieldIf(label: string, value: string | undefined | null, maxWidth?: number): this {
    if (value != null && value !== '') {
      this.field(label, value, maxWidth)
    }
    return this
  }

  inlineFieldIf(label: string, value: string | undefined | null, valueX?: number): this {
    if (value != null && value !== '') {
      this.inlineField(label, value, valueX)
    }
    return this
  }

  fieldMultiline(label: string, value: string, maxWidth?: number): this {
    const width = maxWidth ?? this.contentWidth - 40
    this.ensureSpace(10)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(label, MARGINS.left, this.yPos)
    this.doc.setFont('helvetica', 'normal')
    const lines = this.doc.splitTextToSize(String(value), width)
    this.doc.text(lines, MARGINS.left, this.yPos + 4)
    this.yPos += lines.length * 4 + 6
    return this
  }

  table(
    headers: string[],
    rows: string[][],
    options?: {
      colWidths?: number[]
      headerFontSize?: number
      rowFontSize?: number
      startX?: number
      rowHeight?: number
    },
  ): this {
    const startX = options?.startX ?? MARGINS.left + 2
    const colWidths = options?.colWidths ?? this.distributeColumnWidths(headers.length, startX)
    const headerFontSize = options?.headerFontSize ?? 10
    const rowFontSize = options?.rowFontSize ?? 8

    this.ensureSpace(10)
    this.doc.setFontSize(headerFontSize)
    this.doc.setFont('helvetica', 'bold')

    let xPos = startX
    headers.forEach((header, idx) => {
      this.doc.text(header, xPos, this.yPos)
      xPos += colWidths[idx] ?? 40
    })
    this.yPos += 6

    this.doc.setDrawColor(200, 200, 200)
    this.doc.line(MARGINS.left, this.yPos, this.pageWidth - MARGINS.right, this.yPos)
    this.yPos += 8

    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(rowFontSize)

    rows.forEach((row) => {
      this.ensureSpace(options?.rowHeight ?? 10)
      xPos = startX
      let rowExtraHeight = 0

      row.forEach((cell, idx) => {
        const colWidth = (colWidths[idx] ?? 40) - 4
        const cellLines = this.doc.splitTextToSize(String(cell), colWidth)
        this.doc.text(cellLines, xPos, this.yPos)
        rowExtraHeight = Math.max(rowExtraHeight, cellLines.length * 4)
        xPos += colWidths[idx] ?? 40
      })

      this.yPos += Math.max(rowExtraHeight, options?.rowHeight ?? 7) + 1
    })

    this.yPos += 5
    return this
  }

  /** Table with explicit column x positions and optional right-align */
  tableWithColumns(
    columns: TableColumn[],
    rows: string[][],
    rowFontSize: number = 8,
  ): this {
    this.ensureSpace(10)
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'bold')
    columns.forEach((col) => {
      const x = col.x ?? MARGINS.left
      if (col.align === 'right') {
        this.doc.text(col.header, x, this.yPos, { align: 'right' })
      } else {
        this.doc.text(col.header, x, this.yPos)
      }
    })
    this.yPos += 6

    this.doc.setDrawColor(200, 200, 200)
    this.doc.line(MARGINS.left, this.yPos, this.pageWidth - MARGINS.right, this.yPos)
    this.yPos += 8

    this.doc.setFontSize(rowFontSize)
    this.doc.setFont('helvetica', 'normal')

    rows.forEach((row) => {
      this.ensureSpace(10)
      columns.forEach((col, idx) => {
        const x = col.x ?? MARGINS.left
        const cell = row[idx] ?? ''
        if (col.align === 'right') {
          this.doc.text(cell, x, this.yPos, { align: 'right' })
        } else {
          const maxW = col.width ? col.width - 4 : 80
          this.doc.text(cell.substring(0, Math.floor(maxW / 2)), x, this.yPos, {
            maxWidth: maxW,
          })
        }
      })
      this.yPos += 7
    })

    this.yPos += 5
    return this
  }

  timeline(events: TimelineEvent[]): this {
    events.forEach((event, index) => {
      this.ensureSpace(20)
      const isLast = index === events.length - 1
      const fillColor: [number, number, number] = isLast ? [33, 150, 243] : [34, 197, 94]
      this.doc.setFillColor(...fillColor)
      this.doc.circle(MARGINS.left + 5, this.yPos, 2, 'F')

      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(0, 0, 0)
      this.doc.text(event.status, MARGINS.left + 10, this.yPos)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(event.timestamp, 140, this.yPos)
      this.yPos += 4
      this.doc.setFontSize(9)
      this.doc.text(event.location, MARGINS.left + 10, this.yPos)
      this.yPos += 4
      this.doc.setTextColor(100, 100, 100)
      this.doc.text(event.description, MARGINS.left + 10, this.yPos)
      this.doc.setTextColor(0, 0, 0)
      this.yPos += 10
    })
    return this
  }

  spacer(height: number = 7): this {
    this.yPos += height
    return this
  }

  rawText(text: string, options: TextOptions = {}): this {
    this.ensureSpace(8)
    const x = options.x ?? MARGINS.left
    this.doc.setFontSize(options.fontSize ?? 10)
    this.doc.setFont('helvetica', options.bold ? 'bold' : 'normal')
    if (options.maxWidth) {
      const lines = this.doc.splitTextToSize(text, options.maxWidth)
      lines.forEach((line: string) => {
        this.ensureSpace(6)
        this.doc.text(line, x, this.yPos)
        this.yPos += 5
      })
    } else {
      this.doc.text(text, x, this.yPos)
      this.yPos += 6
    }
    return this
  }

  private distributeColumnWidths(count: number, startX: number): number[] {
    const available = this.pageWidth - MARGINS.right - startX
    const width = Math.floor(available / count)
    return Array(count).fill(width)
  }
}
