import {
  Component,
  OnInit,
  ComponentFactoryResolver,
  ApplicationRef,
  Injector,
  EmbeddedViewRef,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { PdfToolService } from '../services/pdf-tool.service';
import { CdkPortal, DomPortalOutlet } from '@angular/cdk/portal';
import { SelectionRectangle } from '../pdf-tools/text-hightlight-tool/text-selection';

@Component({
  selector: 'app-pdf-popover-container',
  templateUrl: './pdf-popover-container.component.html',
  styleUrls: ['./pdf-popover-container.component.scss'],
})
export class PdfPopoverContainerComponent implements OnInit {
  @ViewChild('container', { static: false }) container: ElementRef;
  public hostRectangle: SelectionRectangle;
  private toolTemplate: CdkPortal;
  private embeddedViewRef: EmbeddedViewRef<any>;

  constructor(
    private _cfr: ComponentFactoryResolver,
    private _ar: ApplicationRef,
    private _injector: Injector,
    private _pdfToolService: PdfToolService,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this._pdfToolService.getPopoverOptions().subscribe(options => {
      this.toolTemplate = options.template;
      this.hostRectangle = options.rect;
      if (options && options.template && options.rect) {
        this.openPopover();
        this._cd.markForCheck();
      } else {
        this.destroyHost();
      }
    });
  }

  public openPopover() {
    this.destroyHost();
    this.embeddedViewRef = new DomPortalOutlet(
      this.container.nativeElement,
      this._cfr,
      this._ar,
      this._injector
    ).attachTemplatePortal(this.toolTemplate);
  }

  public destroyHost() {
    if (this.embeddedViewRef) {
      this.embeddedViewRef.destroy();
    }
  }
}
