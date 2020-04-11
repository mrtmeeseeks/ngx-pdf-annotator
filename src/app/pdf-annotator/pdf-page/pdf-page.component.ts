import {
  Component,
  OnInit,
  ElementRef,
  Input,
  ChangeDetectorRef,
  Renderer2,
  ChangeDetectionStrategy,
  OnChanges,
} from '@angular/core';
import { RenderOptions } from '../models/render-options';
import { fromEvent, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import {
  PDFPageViewport,
  PDFPageProxy,
  TextContent,
} from 'pdfjs-dist';
import { renderTextLayer } from '../pdf-utils/text-layer-builder';
import { PdfStoreAdapterService } from '../services/pdf-store-adapter.service';

@Component({
  selector: 'app-pdf-page',
  templateUrl: './pdf-page.component.html',
  styleUrls: ['./pdf-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfPageComponent implements OnInit, OnChanges {
  private _renderOptions: RenderOptions;
  private _scrollInitialized: boolean;

  @Input() set renderOptions(options: RenderOptions) {
    this._renderOptions = options;
    if (options && !this._scrollInitialized) {
      setTimeout(() => {
        this.renderPage(1);
        this._scrollInitialized = true;
        this.isPageVisibleScroll();
      }, 0);
    }
  }

  get renderOptions() {
    return this._renderOptions;
  }

  public pagesSize: number = 1;
  private container: HTMLElement;
  private _currEl: HTMLElement;
  private _renderedPages: number[] = [1];

  constructor(
    private _el: ElementRef,
    private _cd: ChangeDetectorRef,
    private _renderer: Renderer2,
    private _pdfStoreAdapter: PdfStoreAdapterService
  ) {
    this._currEl = this._el.nativeElement;
    this.container = this._currEl.parentElement;
  }

  ngOnChanges() {}

  ngOnInit(): void {}

  public isPageVisibleScroll() {
    const scrollObservable: Observable<any> = fromEvent(
      this.container,
      'scroll'
    );
    scrollObservable
      .pipe(
        debounceTime(30),
        distinctUntilChanged(),
        map((e: MouseEvent) => e.target)
      )
      .subscribe((target: HTMLElement) => {
        if (this._renderOptions.page) {
          const scrollPosition =
            target.scrollTop / this._renderOptions.page.height;
          const page = Math.round(scrollPosition) + 1;
          if (!this._renderedPages.some((p) => p === page)) {
            this._renderedPages.push(page);
            this.renderPage(page);
          }
        }
      });
  }

  public async renderPage(pageNumber: number) {
    let {
      documentId,
      pdfDocument,
      scale,
      rotate,
      container,
    } = this._renderOptions;

    const page: HTMLElement = container.querySelector(
      `#pageContainer${pageNumber}`
    );

    const annotationLayer: SVGElement = page.querySelector('.annotationLayer');
    const canvasWrapper: HTMLElement = page.querySelector('.canvasWrapper');
    const canvas: HTMLCanvasElement = page.querySelector(
      '.canvasWrapper canvas'
    );
    const textLayer: HTMLElement = page.querySelector(
      '.textLayer'
    ) as HTMLElement;

    this._renderer.setStyle(canvas, 'visibility', 'hidden');
    this._renderer.setStyle(annotationLayer, 'visibility', 'hidden');
    const resolveAll: Promise<any>[] = [
      pdfDocument.getPage(pageNumber) as any,
      this._pdfStoreAdapter.getAnnotations(documentId, pageNumber),
    ];

    Promise.all(resolveAll).then(([pdfPage, annotations]) => {
      const canvasContext = canvas.getContext('2d', { alpha: false });
      const viewport = pdfPage.getViewport({
        scale: scale || 0,
        rotation: rotate || 0,
      });

      this.scalePage(
        viewport,
        canvas,
        canvasContext,
        annotationLayer,
        canvasWrapper,
        textLayer
      );

      return pdfPage
        .render({
          canvasContext,
          viewport,
        })
        .promise.then(() => {
          return this.render(annotationLayer, viewport, annotations);
        })
        .then(() => {
          return this._textContext(viewport, pdfPage, textLayer);
        })
        .then(() => {
          this._renderer.setStyle(canvas, 'visibility', 'visible');
          setTimeout(() => {
            this._renderer.setStyle(annotationLayer, 'visibility', 'visible');
          }, 20);
          page.setAttribute('data-loaded', 'true');
        });
    });
  }

  private _textContext(
    viewport: PDFPageViewport,
    pdfPage: PDFPageProxy,
    textLayer: HTMLElement
  ) {
    return pdfPage.getTextContent().then((textContent: TextContent) => {
      return new Promise<any>((resolve, reject) => {
        textLayer.innerHTML = '';
        renderTextLayer({
          textContent: textContent,
          container: textLayer,
          viewport: viewport,
          enhanceTextSelection: false,
          renderer: this._renderer,
        });
        resolve();
      });
    });
  }

  private render(svg, viewport, data) {
    return new Promise((resolve, reject) => {
      // Reset the content of the SVG
      svg.innerHTML = '';

      this._renderer.setAttribute(
        svg,
        'data-pdf-annotate-container',
        `${true}`
      );
      this._renderer.setAttribute(
        svg,
        'data-pdf-annotate-viewport',
        JSON.stringify(viewport)
      );
      this._renderer.removeAttribute(svg, 'data-pdf-annotate-document');
      this._renderer.removeAttribute(svg, 'data-pdf-annotate-page');

      // If there's no data nothing can be done
      if (!data) {
        return resolve(svg);
      }

      this._renderer.setAttribute(
        svg,
        'data-pdf-annotate-document',
        data.documentId
      );
      this._renderer.setAttribute(
        svg,
        'data-pdf-annotate-page',
        data.pageNumber
      );

      // Make sure annotations is an array
      if (!Array.isArray(data.annotations) || data.annotations.length === 0) {
        return resolve(svg);
      }

      // Append annotation to svg
      data.annotations.forEach((a) => {
        this.renderOptions.annotationRenderer.appendChild(svg, a, viewport);
      });

      resolve(svg);
    });
  }

  private scalePage(
    viewport: PDFPageViewport,
    canvas: HTMLCanvasElement,
    canvasContext: CanvasRenderingContext2D,
    annotationLayer: SVGElement,
    canvasWrapper: HTMLElement,
    textLayer: HTMLElement
  ) {
    let outputScale = getOutputScale(canvasContext);
    let transform = !outputScale.scaled
      ? null
      : [outputScale.sx, 0, 0, outputScale.sy, 0, 0];
    let sfx = approximateFraction(outputScale.sx);
    let sfy = approximateFraction(outputScale.sy);

    if (!this._renderOptions.page || this._renderOptions.page !== viewport) {
      this._renderOptions.page = viewport;
      this._cd.markForCheck();
    }

    this._renderer.setAttribute(
      canvas,
      'width',
      roundToDivide(viewport.width * outputScale.sx, sfx[0])
    );
    this._renderer.setAttribute(
      canvas,
      'height',
      roundToDivide(viewport.height * outputScale.sy, sfy[0])
    );

    this._renderer.setStyle(
      canvas,
      'width',
      roundToDivide(viewport.width, sfx[1]) + 'px'
    );
    this._renderer.setStyle(
      canvas,
      'height',
      roundToDivide(viewport.height, sfx[1]) + 'px'
    );

    this._renderer.setAttribute(
      annotationLayer,
      'width',
      viewport.width.toString()
    );
    this._renderer.setAttribute(
      annotationLayer,
      'height',
      viewport.height.toString()
    );

    this._renderer.setStyle(annotationLayer, 'width', `${viewport.width}px`);
    this._renderer.setStyle(annotationLayer, 'height', `${viewport.height}px`);
    this._renderer.setStyle(canvasWrapper, 'width', `${viewport.width}px`);
    this._renderer.setStyle(canvasWrapper, 'height', `${viewport.height}px`);
    this._renderer.setStyle(textLayer, 'width', `${viewport.width}px`);
    this._renderer.setStyle(textLayer, 'height', `${viewport.height}px`);

    return transform;
  }
}

function approximateFraction(x) {
  // Fast path for int numbers or their inversions.
  if (Math.floor(x) === x) {
    return [x, 1];
  }

  const xinv = 1 / x;
  const limit = 8;
  if (xinv > limit) {
    return [1, limit];
  } else if (Math.floor(xinv) === xinv) {
    return [1, xinv];
  }

  const x_ = x > 1 ? xinv : x;

  // a/b and c/d are neighbours in Farey sequence.
  let a = 0,
    b = 1,
    c = 1,
    d = 1;

  // Limit search to order 8.
  while (true) {
    // Generating next term in sequence (order of q).
    let p = a + c,
      q = b + d;
    if (q > limit) {
      break;
    }
    if (x_ <= p / q) {
      c = p;
      d = q;
    } else {
      a = p;
      b = q;
    }
  }

  // Select closest of neighbours to x.
  if (x_ - a / b < c / d - x_) {
    return x_ === x ? [a, b] : [b, a];
  } else {
    return x_ === x ? [c, d] : [d, c];
  }
}

function getOutputScale(ctx) {
  let devicePixelRatio = window.devicePixelRatio || 1;
  let backingStoreRatio =
    ctx.webkitBackingStorePixelRatio ||
    ctx.mozBackingStorePixelRatio ||
    ctx.msBackingStorePixelRatio ||
    ctx.oBackingStorePixelRatio ||
    ctx.backingStorePixelRatio ||
    1;
  let pixelRatio = devicePixelRatio / backingStoreRatio;
  return {
    sx: pixelRatio,
    sy: pixelRatio,
    scaled: pixelRatio !== 1,
  };
}

function roundToDivide(x, div) {
  let r = x % div;
  return r === 0 ? x : Math.round(x - r + div);
}
