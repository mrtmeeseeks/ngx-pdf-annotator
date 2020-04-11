import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { IRenderOptions } from '../../models/render-options';
import { PdfAnnotationStorageService } from '../../services/pdf-annotation-storage.service';
import { findSVGAtPoint, getMetadata, scaleDown } from '../../pdf-utils/utils';
import { PdfToolService } from '../../services/pdf-tool.service';
import { CdkPortal } from '@angular/cdk/portal';
import { FormControl } from '@angular/forms';
import { PdfStoreAdapterService } from '../../services/pdf-store-adapter.service';
import { Annotation } from '../../models/annotation';

@Component({
  selector: 'text-tool',
  templateUrl: './text-tool.component.html',
  styleUrls: ['./text-tool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextToolComponent implements OnInit {
  @ViewChild('textTool', { static: true }) textTool: CdkPortal;
  @Input() renderOptions: IRenderOptions;

  public selectedTool: string;
  public formControl = new FormControl();
  private _textSize: number;
  private _textColor: string;
  private _clientX: number;
  private _clientY: number;

  constructor(
    private _pdfAnnotationStorage: PdfAnnotationStorageService,
    private _pdfToolService: PdfToolService,
    private _pdfStoreAdapterService: PdfStoreAdapterService,
  ) {}

  ngOnInit(): void {
    const { textSize, textColor } = this._pdfAnnotationStorage;
    this._textColor = textColor || 'red';
    this._textSize = parseInt(textSize) || 10;

    this._pdfToolService.getSelectedTool().subscribe((tool) => {
      this.selectedTool = tool;
    });

    document.addEventListener('mouseup', this._handleMouseUp, false);
  }

  onBlur() {
    if (this.formControl.value) {
      this._saveText(this.formControl.value);
      this.formControl.reset();
    }
  }

  private _handleMouseUp = (e: MouseEvent) => {
    if (this.selectedTool !== 'text') {
      return;
    }

    try {
      let svg = findSVGAtPoint(e.clientX, e.clientY);
      if (!svg) {
        this._pdfToolService.setPopoverOptions(
          null,
          null,
          'text mouse up handle !svg'
        );
        return;
      }
    } catch {}

    this._clientX = e.clientX;
    this._clientY = e.clientY;
    const rect = {
      top: this._clientY - 50,
      left: this._clientX,
    } as DOMRect;

    this._pdfToolService.setPopoverOptions(
      this.textTool,
      rect,
      'text mouse up handle'
    );
  };

  private _saveText(value: string) {
    if (value.trim().length > 0) {
      const svg = findSVGAtPoint(this._clientX, this._clientY);

      if (!svg) {
        return;
      }
      let { documentId, pageNumber } = getMetadata(svg);

      let rect = svg.getBoundingClientRect();
      let annotation = Object.assign(
        {
          type: 'textbox',
          size: this._textSize,
          color: this._textColor,
          text: value,
          timestamp: new Date(),
        },
        scaleDown(svg, {
          x: this._clientX - rect.left,
          y: this._clientY - rect.top,
          width: 40,
          height: 40,
        } as DOMRect)
      ) as any;

      this._pdfStoreAdapterService
        .addAnnotation(documentId, pageNumber, annotation, svg)
        .then((annotation: Annotation) => {});
    }
  }
}
