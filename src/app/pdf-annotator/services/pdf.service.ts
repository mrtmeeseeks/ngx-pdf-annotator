import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import * as PDFJS from 'pdfjs-dist';
PDFJS.GlobalWorkerOptions.workerSrc = 'https://taulantdisha.github.io/ngx-pdf-annotator/assets/pdf.worker.min.js';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  constructor() {}

  public loadDocument(documentId: string): Observable<PDFJS.PDFDocumentProxy> {
    return new Observable((observer: Observer<PDFJS.PDFDocumentProxy>) => {
      PDFJS.getDocument(documentId).promise.then(
        (pdf: PDFJS.PDFDocumentProxy) => {
          observer.next(pdf);
        }
      );
    });
  }
}
