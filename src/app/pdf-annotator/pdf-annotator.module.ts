import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfAnnotatorComponent } from './pdf-annotator.component';
import { RenderPagesPipe } from './pipes/render-pages.pipe';
import { PdfToolbarComponent } from './pdf-toolbar/pdf-toolbar.component';
import { TextToolComponent } from './pdf-tools/text-tool/text-tool.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PortalModule } from '@angular/cdk/portal';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PdfPopoverContainerComponent } from './pdf-popover-container/pdf-popover-container.component';
import { PdfPageComponent } from './pdf-page/pdf-page.component';
import { AnnotationOverlayComponent } from './pdf-popover-container/annotation-overlay/annotation-overlay.component';
import { TextHightlightToolComponent } from './pdf-tools/text-hightlight-tool/text-hightlight-tool.component';
import { CommentToolComponent } from './pdf-tools/comment-tool/comment-tool.component';
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
 
const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};

@NgModule({
  declarations: [
    PdfAnnotatorComponent,
    RenderPagesPipe,
    PdfToolbarComponent,
    TextToolComponent,
    PdfPopoverContainerComponent,
    PdfPageComponent,
    AnnotationOverlayComponent,
    TextHightlightToolComponent,
    CommentToolComponent,
  ],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    PortalModule,
    ReactiveFormsModule,
    FormsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PerfectScrollbarModule
    
  ],
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }
  ],
  exports: [PdfAnnotatorComponent, RenderPagesPipe],
})
export class PdfAnnotatorModule {}
