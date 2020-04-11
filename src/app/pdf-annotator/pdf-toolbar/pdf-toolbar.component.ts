import { Component, OnInit } from '@angular/core';
import { PdfToolService } from '../services/pdf-tool.service';
import { PdfAnnotationStorageService } from '../services/pdf-annotation-storage.service';

@Component({
  selector: 'app-pdf-toolbar',
  templateUrl: './pdf-toolbar.component.html',
  styleUrls: ['./pdf-toolbar.component.scss'],
})
export class PdfToolbarComponent implements OnInit {
  public scale: number;
  public selectedTool: string;

  public tools = [
    {
      name: 'hand',
      icon: 'pan_tool',
      tooltip: 'Pan',
    },
    {
      name: 'highlight',
      icon: 'font_download',
      tooltip: 'Highlight',
    },
    {
      name: 'text',
      icon: 'title',
      tooltip: 'Free text',
    },
    {
      name: 'comment',
      icon: 'mode_comment',
      tooltip: 'Comment',
    },
  ];
  constructor(
    private _pdfToolService: PdfToolService,
    private _pdfStorageService: PdfAnnotationStorageService
  ) {}

  ngOnInit(): void {
    this._pdfToolService.getSelectedTool().subscribe((tool) => {
      this.selectedTool = tool;
    });
  }

  public setTool(tool: string) {
    this._pdfToolService.setSelectedTool(tool);
  }

  public setScale(scale: number) {
    this.scale = scale * 100;
    this._pdfStorageService.setScale(scale);
  }
}
