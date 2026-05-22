import type jsPDF from 'jspdf'

export interface TimelineEvent {
  status: string
  location: string
  timestamp: string
  description: string
}

export interface TableColumn {
  header: string
  width?: number
  x?: number
  align?: 'left' | 'right' | 'center'
}

export interface TextOptions {
  x?: number
  fontSize?: number
  maxWidth?: number
  bold?: boolean
}

export interface PdfGeneratorOptions {
  includeFooter?: boolean
  includeWatermark?: boolean
}

export interface PdfBuildContext {
  doc: jsPDF
  pageWidth: number
  pageHeight: number
}
