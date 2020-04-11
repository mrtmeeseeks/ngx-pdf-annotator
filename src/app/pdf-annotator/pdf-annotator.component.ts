import {
  Component,
  OnInit,
  HostBinding,
  ElementRef,
  ChangeDetectionStrategy,
  Renderer2,
} from '@angular/core';
import { PdfService } from './services/pdf.service';
import { RenderOptions } from './models/render-options';
import { PdfAnnotationStorageService } from './services/pdf-annotation-storage.service';
import { PdfStoreAdapterService } from './services/pdf-store-adapter.service';
import { PdfToolService } from './services/pdf-tool.service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { PdfAnnotationRenderer } from './pdf-utils/pdf-renderer';

@Component({
  selector: 'app-pdf-annotator',
  templateUrl: './pdf-annotator.component.html',
  styleUrls: ['./pdf-annotator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfAnnotatorComponent implements OnInit {
  @HostBinding('class.pdf-annotator') _pdfAnnotator = true;

  public options$: Observable<RenderOptions>;
  public selectedTool: string;
  public renderOptions: RenderOptions;
  public comments: any[] = [];

  constructor(
    private _el: ElementRef,
    private _pdfService: PdfService,
    private _pdfStorageService: PdfAnnotationStorageService,
    private _pdfStoreAdapter: PdfStoreAdapterService,
    private _pdfToolService: PdfToolService,
    private _renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this._pdfToolService.getSelectedTool().subscribe((tool) => {
      this.selectedTool = tool;
    });

    const annotationRenderer = new PdfAnnotationRenderer(this._renderer);

    this.renderOptions = new RenderOptions(
      '/pdf/assets/rest2.pdf',
      this._el.nativeElement,
      annotationRenderer
    );

    this._pdfStoreAdapter.init(this.renderOptions);
    this._pdfStorageService.setRenderOptions(this.renderOptions);

    this._pdfStoreAdapter
      .getAllAnnotations(this.renderOptions.documentId)
      .then((comments: any[]) => {
        this.comments = comments;
      });

    // this.scaleChange$ = this._pdfStorageService.scaleChange$;
    // this.rotationChange$ = this._pdfStorageService.rotationChange$;

    const { scale, rotation } = this._pdfStorageService;

    this.renderOptions.scale = scale;
    this.renderOptions.rotate = rotation;
    this._pdfStorageService.setScale(scale);
    this._pdfStorageService.setRotation(rotation);

    this.options$ = this._pdfService
      .loadDocument(this.renderOptions.documentId)
      .pipe(
        tap((pdf) => {
          this.renderOptions.setPagesSize(pdf.numPages);
          this.renderOptions.setpdfDoc(pdf);
        }),
        map(() => this.renderOptions)
      );
  }
}
