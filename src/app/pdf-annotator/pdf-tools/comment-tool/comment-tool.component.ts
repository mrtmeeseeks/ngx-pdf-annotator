import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Annotation } from '../../models/annotation';
import { trigger, style, transition, animate } from '@angular/animations';
import { FormControl } from '@angular/forms';
import { PdfStoreAdapterService } from '../../services/pdf-store-adapter.service';
import { RenderOptions } from '../../models/render-options';
import { PdfToolService } from '../../services/pdf-tool.service';
import { AnnotationEventType } from '../../services/pdf-events.service';
import { findSVGContainer } from '../../pdf-utils/utils';

@Component({
  selector: 'app-comment-tool',
  templateUrl: './comment-tool.component.html',
  styleUrls: ['./comment-tool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ height: '0px', visibility: 'hidden' }),
        animate('150ms', style({ height: '*' })),
      ]),
      transition(':leave', [
        style({ visibility: 'hidden' }),
        animate('150ms', style({ height: '0px' })),
      ]),
    ]),
  ],
})
export class CommentToolComponent implements OnInit {
  @ViewChild('textInput', {static: false}) textInput: ElementRef;
  @Input() renderOptions: RenderOptions;

  public annotations: {
    page: number;
    annotations: Annotation[];
  }[] = [];
  public selected: Annotation;
  public text: FormControl = new FormControl('');
  public notes = [];

  constructor(
    private _pdfStoreAdapter: PdfStoreAdapterService,
    private _pdfToolService: PdfToolService,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this._pdfStoreAdapter
      .getAllAnnotations(this.renderOptions.documentId)
      .then((res) => {
        this.annotations = res as any;
        this._cd.markForCheck();
      });

      this.renderOptions.events.onMessage().subscribe((annotationId: string) => {
        if (this.textInput) {
          this.textInput.nativeElement.focus();
        }
      });

      this.renderOptions.events.onBlur().subscribe((target: SVGElement) => {
        this.selected = null;
        this._cd.markForCheck();
      });

      this.renderOptions.events.onClick().subscribe((target: SVGElement) => {
        this.selected = null;
        const pageNumber = (target.parentNode as HTMLElement).getAttribute('data-pdf-annotate-page');
        const id = target.getAttribute('data-pdf-annotate-id');
        const page = this.annotations.find((p) => p.page === +pageNumber);
        const annotation = page.annotations.find((a) => a.id === id);
        this.selected = annotation;
        this._cd.markForCheck();
      });

    this.renderOptions.events.onAdd().subscribe((annotation: Annotation) => {
      const page = this.annotations.find((p) => p.page === annotation.page);
      page.annotations = [...page.annotations, annotation];
      this.open(annotation);
      this._cd.markForCheck();
    });

    this.renderOptions.events.onRemove().subscribe((annotation: Annotation) => {
      const page = this.annotations.find((p) => p.page === annotation.page);
      page.annotations = page.annotations.filter((a) => a.id === annotation.id);
      this.selected = null;
      this._cd.markForCheck();
    });
  }

  open(selected: Annotation) {
    if (!selected) {
      return;
    }
    const annotationTarget = document.querySelector(
      `[data-pdf-annotate-id="${selected.id}"]`
    );

    this.text.reset();

    if (this.selected === selected) {
      this.selected = null;
      if (annotationTarget) {
        this._pdfToolService.setMessageStatus(!!this.selected);
        this.renderOptions.events.setAnnotationEvent({
          event: AnnotationEventType.Blur,
          target: annotationTarget,
        });
      }
    } else {
      if (annotationTarget) {
        this._pdfToolService.setMessageStatus(!!this.selected);
        annotationTarget.scrollIntoView({ block: 'center' });
        this.renderOptions.events.setAnnotationEvent({
          event: AnnotationEventType.Click,
          target: annotationTarget,
        });
      }
      this.selected = selected;
    }
  }

  addNote(annotation: Annotation) {
    const text = this.text.value;

    const notes = [
      ...(annotation.notes || []),
      {
        text: text,
        timestamp: new Date(),
      },
    ];

    annotation = {
      ...annotation,
      notes,
    };

    const page = this.annotations.find((p) => p.page === annotation.page);
    const ann = page.annotations.find((a) => a.id === annotation.id);
    ann.notes = notes;
    this.selected = annotation;

    this.text.reset();
    this._cd.markForCheck();

    this._pdfStoreAdapter
      .editAnnotation(this.renderOptions.documentId, annotation.id, annotation)
      .then(() => {});
  }
}
