import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
  Renderer2,
} from '@angular/core';
import { PdfToolService } from '../../services/pdf-tool.service';
import { CdkPortal } from '@angular/cdk/portal';
import {
  getMetadata,
  findSVGAtPoint,
  disableUserSelect,
  enableUserSelect,
} from '../../pdf-utils/utils';
import { PdfStoreAdapterService } from '../../services/pdf-store-adapter.service';
import { constructHighlightAnnotation } from './highlight-annotation';
import { TextSelectionUtil, TextSelectEvent } from './text-selection';

@Component({
  selector: 'app-text-hightlight-tool',
  templateUrl: './text-hightlight-tool.component.html',
  styleUrls: ['./text-hightlight-tool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextHightlightToolComponent implements OnInit {
  @ViewChild('highlightPopover', { static: true }) highlightPopover: CdkPortal;
  private _initialized: boolean;
  private _elementRef: HTMLElement;
  private selection: TextSelectionUtil;
  private selectionEvent: TextSelectEvent;
  private isMessageOpened: boolean;

  public constructor(
    private _pdfToolService: PdfToolService,
    private _pdfStoreAdapter: PdfStoreAdapterService,
    private _cd: ChangeDetectorRef,
    private _ngZone: NgZone
  ) {}

  public ngOnInit(): void {
    this._elementRef = document.getElementById('content-wrapper');
    this.selection = new TextSelectionUtil(this._elementRef);

    this._pdfToolService.getMessageStatus().subscribe((status) => {
      this.isMessageOpened = status;
    });

    this._pdfToolService.getSelectedTool().subscribe((tool: string) => {
      if (tool === 'highlight' && !this._initialized) {
        enableUserSelect();
        this.init();
        this._initialized = true;
      } else {
        disableUserSelect();
        this._removeListeners();
        this._initialized = false;
      }
    });
  }

  public ngOnDestroy(): void {
    this._removeListeners();
  }

  private _removeListeners() {
    this._removeMarkerEvents();
    this.selection.clearMarkers();
  }

  public init() {
    this.selection.init();
    this._initMarkerEvents();
  }

  private _initMarkerEvents() {
    this._elementRef.addEventListener('mouseup', this._mouseUpHandle, false);
    this._ngZone.runOutsideAngular(() => {
      this._elementRef.addEventListener('scroll', this._scrollHandle, false);
      this._elementRef.addEventListener(
        'mousemove',
        this._mouseMoveHandle,
        false
      );
    });
    document.addEventListener('mousedown', this._mouseDownHandle, false);
    document.addEventListener('mouseup', this._documentMouseUpHandle, false);
    document.addEventListener('contextmenu', this._contextMoveHandle, false);
  }

  private _removeMarkerEvents() {
    this._elementRef.removeEventListener('mouseup', this._mouseUpHandle);
    this._elementRef.removeEventListener('mousemove', this._mouseMoveHandle);
    this._elementRef.removeEventListener('scroll', this._scrollHandle);

    document.removeEventListener('mousedown', this._mouseDownHandle);
    document.removeEventListener('mouseup', this._documentMouseUpHandle);
    document.removeEventListener('contextmenu', this._contextMoveHandle);
  }

  private _scrollHandle = (e: MouseEvent) => {
    this.selection.disableDrag();
    document.body.style.overflow = 'hidden';
    this.selection.updateMarkersPositionOnScroll();
  };

  private _documentMouseUpHandle = (e: MouseEvent) => {
    this.selection.disableDrag();

    if (!document.getSelection) {
      return;
    }
    const sel = document.getSelection();
    let res: {
      range: Range;
      selection: Selection;
    };
    if (sel && sel.type === 'Range') {
      res = {
        range: sel.getRangeAt(0),
        selection: sel,
      };
    }
    if (!res || res.selection.type !== 'Range') {
      this.selection.setMarkers();
      document.body.style.overflow = 'auto';
      return;
    } else {
      this.selectionEvent = this.selection.getselectionEvent(
        res.range,
        res.selection
      );
      this._pdfToolService.setPopoverOptions(
        this.highlightPopover,
        this.selectionEvent.hostRectangle as DOMRect,
        'highlight document mouse up handle'
      );

      this._cd.markForCheck();
    }
  };

  private _mouseDownHandle = (e: MouseEvent) => {
    this._pdfToolService.setPopoverOptions(
      null,
      null,
      'highlight mouse down handle'
    );
    this.selection.enableDrag();
    if (!this.selection.isRangeSelection()) {
      this.selection.setMarkers();
      document.body.style.overflow = 'auto';
    }
    this.selection.setStartAndEndMarker(e);
  };

  private _mouseUpHandle = (e: MouseEvent) => {
    this.selection.disableDrag();
    this.selection.markersProcessSelection(e);
  };

  private _mouseMoveHandle = (e: MouseEvent) => {
    if (!this.selection.isDragging()) return;
    this.selection.markersProcessSelection(e);
  };

  private _contextMoveHandle = (e: MouseEvent) => {
    this.selection.disableDrag();
    this.selection.clearMarkers();
  };

  public highlight() {
    const { rects, text } = this.selectionEvent;

    if (!rects.length) {
      return;
    }

    const [{ left, top }] = rects;
    let svg = findSVGAtPoint(left, top);
    if (!svg) {
      return;
    }

    const annotation = constructHighlightAnnotation(
      'highlight',
      'green',
      rects,
      svg,
      text
    );

    this.selection.removeTextSelection();

    let { documentId, pageNumber } = getMetadata(svg);
    this._pdfStoreAdapter
      .addAnnotation(documentId, pageNumber, annotation, svg)
      .then(() => {
        this.selection.clearMarkers();
      });
  }
}
