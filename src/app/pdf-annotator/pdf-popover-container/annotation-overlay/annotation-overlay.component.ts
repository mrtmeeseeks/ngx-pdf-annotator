import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import {
  findSVGContainer,
  getAnnotationRect,
  enableUserSelect,
  getMetadata,
  disableUserSelect,
  scaleDown,
  scaleUp,
} from '../../pdf-utils/utils';
import { PdfToolService } from '../../services/pdf-tool.service';
import { CdkPortal } from '@angular/cdk/portal';
import { SelectionRectangle } from '../../pdf-tools/text-hightlight-tool/text-selection';
import { PdfStoreAdapterService } from '../../services/pdf-store-adapter.service';
import { RenderOptions } from '../../models/render-options';
import { Annotation } from '../../models/annotation';
import { AnnotationEventType } from '../../services/pdf-events.service';

@Component({
  selector: 'app-annotation-overlay',
  templateUrl: './annotation-overlay.component.html',
  styleUrls: ['./annotation-overlay.component.scss'],
})
export class AnnotationOverlayComponent implements OnInit {
  @ViewChild('pdfEditOverlay', { static: true }) pdfEditOverlay: ElementRef;
  @ViewChild('editPopover', { static: true }) editPopover: CdkPortal;

  @Input() renderOptions: RenderOptions;

  private _overlay: HTMLElement;
  private _parentNode: HTMLElement;

  private dragOffsetX: number;
  private dragOffsetY: number;
  private dragStartX: number;
  private dragStartY: number;
  private OVERLAY_BORDER_SIZE = 2;
  private _selectedAnnotationId: string;
  private isMessageOpened: boolean;
  constructor(
    private _pdfToolService: PdfToolService,
    private _pdfStoreAdapter: PdfStoreAdapterService
  ) {}

  public deleteAnnotation() {
    if (!this._overlay) {
      return;
    }

    let annotationId = this._overlay.getAttribute('data-target-id');
    let nodes = document.querySelectorAll(
      `[data-pdf-annotate-id="${annotationId}"]`
    );
    let svg: SVGElement = this._overlay.parentNode.querySelector(
      'svg.annotationLayer'
    );
    let { documentId } = getMetadata(svg);

    [...(nodes as any)].forEach((n) => {
      n.parentNode.removeChild(n);
    });

    this._pdfStoreAdapter.deleteAnnotation(documentId, annotationId);

    this.destroyEditOverlay();
    this._pdfToolService.setPopoverOptions(
      null,
      null,
      'overlay delete annotation'
    );
  }

  addNote() {
    this.renderOptions.events.setAnnotationEvent({
      event: AnnotationEventType.Message,
      annotationId: this._selectedAnnotationId
    });
    this._pdfToolService.setPopoverOptions(
      null,
      null,
      'overlay delete annotation'
    );
  }

  public createEditOverlay = (target) => {
    this.destroyEditOverlay();
    this._parentNode = findSVGContainer(target).parentNode as HTMLElement;
    let id = target.getAttribute('data-pdf-annotate-id');
    this._selectedAnnotationId = id;
    let rect = getAnnotationRect(target);
    let styleLeft = rect.left - this.OVERLAY_BORDER_SIZE;
    let styleTop = rect.top - this.OVERLAY_BORDER_SIZE;

    this._overlay.setAttribute('data-target-id', id);

    this._overlay.style.top = `${styleTop}px`;
    this._overlay.style.left = `${styleLeft}px`;
    this._overlay.style.width = `${rect.width}px`;
    this._overlay.style.height = `${rect.height}px`;
    this._overlay.style.display = 'flex';

    this._parentNode.appendChild(this._overlay);
    document.addEventListener('mousedown', this.handleDocumentMousedown);
  };

  public destroyEditOverlay = () => {
    if (this._parentNode) {
      this._parentNode.removeChild(this._overlay);
      this._parentNode = null;
    }

    document.removeEventListener('mousedown', this.handleDocumentMousedown);
    document.removeEventListener('mouseup', this.handleDocumentMouseup);
  };

  public handleDocumentKeyup = (e) => {
    if (
      this._overlay &&
      e.keyCode === 46 &&
      e.target.nodeName.toLowerCase() !== 'textarea' &&
      e.target.nodeName.toLowerCase() !== 'input'
    ) {
      this.deleteAnnotation();
    }
  };

  public handleDocumentMousedown = (e) => {
    if (this.isMessageOpened) {
      return;
    }
    if (e.target !== this._overlay) {
      this.destroyEditOverlay();
      return;
    }

    let annotationId = this._overlay.getAttribute('data-target-id');
    let target = document.querySelector(
      `[data-pdf-annotate-id="${annotationId}"]`
    );
    let type = target.getAttribute('data-pdf-annotate-type');

    if (type === 'highlight' || type === 'strikeout') {
      return;
    }

    this.dragOffsetX = e.clientX;
    this.dragOffsetY = e.clientY;
    this.dragStartX = this._overlay.offsetLeft;
    this.dragStartY = this._overlay.offsetTop;

    this._overlay.style.background = 'rgba(255, 255, 255, 0.7)';
    this._overlay.style.cursor = 'move';

    document.addEventListener('mousemove', this.handleDocumentMousemove);
    document.addEventListener('mouseup', this.handleDocumentMouseup);
    disableUserSelect();
  };

  public handleDocumentMousemove = (e) => {
    let annotationId = this._overlay.getAttribute('data-target-id');
    let parentNode = this._overlay.parentNode as HTMLElement;
    let rect = parentNode.getBoundingClientRect();
    let y = this.dragStartY + (e.clientY - this.dragOffsetY);
    let x = this.dragStartX + (e.clientX - this.dragOffsetX);
    let minY = 0;
    let maxY = rect.height;
    let minX = 0;
    let maxX = rect.width;

    if (y > minY && y + this._overlay.offsetHeight < maxY) {
      this._overlay.style.top = `${y}px`;
    }

    if (x > minX && x + this._overlay.offsetWidth < maxX) {
      this._overlay.style.left = `${x}px`;
    }
  };

  public handleDocumentMouseup = (e) => {
    const sel = document.getSelection();
    if (sel.type === 'Range') {
      return;
    }

    let target: NodeListOf<any> = document.querySelectorAll(
      `[data-pdf-annotate-id="${this._selectedAnnotationId}"]`
    );
    let type = target[0].getAttribute('data-pdf-annotate-type');
    let svg: SVGElement = this._overlay.parentNode.querySelector(
      'svg.annotationLayer'
    );
    let { documentId } = getMetadata(svg);

    function getDelta(propX, propY) {
      return calcDelta(
        parseInt(target[0].getAttribute(propX), 10),
        parseInt(target[0].getAttribute(propY), 10)
      );
    }

    const calcDelta = (x, y) => {
      return {
        deltaX:
          this.OVERLAY_BORDER_SIZE +
          scaleDown(svg, { x: this._overlay.offsetLeft } as DOMRect).x -
          x,
        deltaY:
          this.OVERLAY_BORDER_SIZE +
          scaleDown(svg, { y: this._overlay.offsetTop } as DOMRect).y -
          y,
      };
    };

    this._pdfStoreAdapter
      .getAnnotation(documentId, this._selectedAnnotationId)
      .then((annotation) => {
        if (['area', 'highlight', 'point', 'textbox'].indexOf(type) > -1) {
          let { deltaX, deltaY } = getDelta('x', 'y');
          [...(target as any)].forEach((t, i) => {
            if (deltaY !== 0) {
              let modelY = parseInt(t.getAttribute('y'), 10) + deltaY;
              let viewY = modelY;

              if (type === 'textbox') {
                viewY += annotation.size;
              }

              if (type === 'point') {
                viewY = scaleUp(svg, { y: viewY } as DOMRect).y;
              }

              t.setAttribute('y', viewY);
              if (annotation.rectangles) {
                annotation.rectangles[i].y = modelY;
              } else if (annotation.y) {
                annotation.y = modelY;
              }
            }
            if (deltaX !== 0) {
              let modelX = parseInt(t.getAttribute('x'), 10) + deltaX;
              let viewX = modelX;

              if (type === 'point') {
                viewX = scaleUp(svg, { x: viewX } as DOMRect).y;
              }

              t.setAttribute('x', viewX);
              if (annotation.rectangles) {
                annotation.rectangles[i].x = modelX;
              } else if (annotation.x) {
                annotation.x = modelX;
              }
            }
          });
        }

        this._pdfStoreAdapter.editAnnotation(
          documentId,
          this._selectedAnnotationId,
          annotation
        );
      });

    this._overlay.style.background = '';
    this._overlay.style.cursor = '';

    document.removeEventListener('mousemove', this.handleDocumentMousemove);
    document.removeEventListener('mouseup', this.handleDocumentMouseup);
    enableUserSelect();
  };

  public handleAnnotationClick = (target: SVGElement) => {
    const sel = document.getSelection();
    if (sel.type === 'Range') {
      return;
    }

    this.createEditOverlay(target);
    const rect = target.getBoundingClientRect();
    this._pdfToolService.setPopoverOptions(
      this.editPopover,
      {
        left: rect.left,
        top: rect.top - 50,
        width: rect.width,
        height: rect.height,
      } as any,
      'overlay handle annotation click'
    );
  };

  ngOnInit(): void {
    this._overlay = this.pdfEditOverlay.nativeElement;

    this._pdfToolService.getMessageStatus().subscribe((status) => {
      this.isMessageOpened = status;
    });

    this.renderOptions.events.onClick().subscribe((target: SVGElement) => {
      this.handleAnnotationClick(target);
    });

    this.renderOptions.events.onBlur().subscribe((target: SVGElement) => {
      this.destroyEditOverlay();
      const sel = document.getSelection();
      if (sel.type === 'Range' || this.isMessageOpened) {
        return;
      }

      this._pdfToolService.setPopoverOptions(
        null,
        null,
        'overlay annotation blur'
      );
    });

    this.renderOptions.events.onAdd().subscribe((annotation: Annotation) => {
      let target: SVGElement = document.querySelector(
        `[data-pdf-annotate-id="${annotation.id}"]`
      );
      if (!target) {
        return;
      }
      this.handleAnnotationClick(target);
    });
  }
}
