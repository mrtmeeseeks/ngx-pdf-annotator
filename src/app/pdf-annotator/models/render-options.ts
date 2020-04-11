import { PDFLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import { PdfAnnotationRenderer } from '../pdf-utils/pdf-renderer';
import { PdfEvents } from '../services/pdf-events.service';

export interface IRenderOptions {
  pdfDocument: PDFLoadingTask<PDFDocumentProxy>;
  documentId: string;
  container: Element;
  scale: number;
  rotate: number;
  pagesSize: number;
  pageHeight: number;
}

export class RenderOptions {
  pdfDocument: PDFDocumentProxy;
  documentId: string;
  container: HTMLElement;
  scale: number;
  rotate: number;
  pagesSize: number;
  page: {
    width: number;
    height: number;
  };
  annotationRenderer: PdfAnnotationRenderer;
  events: PdfEvents;

  constructor(documentId: string, container: HTMLElement, renderer: PdfAnnotationRenderer) {
    this.documentId = documentId;
    this.container = container;
    this.annotationRenderer = renderer;
    this.events = new PdfEvents(this);
  }

  setpdfDoc(pdfDoc: PDFDocumentProxy) {
    this.pdfDocument = pdfDoc;
  }

  setScale(scale: number) {
    this.scale = scale;
  }

  setRotation(rotation: number) {
    this.rotate = rotation;
  }

  setPagesSize(pagesSize: number) {
    this.pagesSize = pagesSize;
  }

  setPageHeight(pageHeight: { width: number; height: number }) {
    this.page = pageHeight;
  }
}
