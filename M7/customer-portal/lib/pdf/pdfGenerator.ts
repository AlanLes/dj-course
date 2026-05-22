import { generateTransportationRequestDetailPDF } from './transportationRequestDetailPdfGenerator'
import type { TransportationRequestDetailData } from './transportationRequestDetailPdfGenerator'
import { generateWarehousingRequestDetailPDF } from './warehousingRequestDetailPdfGenerator'
import type { WarehousingRequestDetailData } from './warehousingRequestDetailPdfGenerator'

/** @deprecated Use generateWarehousingRequestDetailPDF directly */
export type WarehousingRequestData = WarehousingRequestDetailData

/** @deprecated Use generateTransportationRequestDetailPDF directly */
export type TransportationRequestData = TransportationRequestDetailData

export const PDFGenerator = {
  generateTransportationRequestPDF: generateTransportationRequestDetailPDF,
  generateWarehousingRequestPDF: generateWarehousingRequestDetailPDF,
}
