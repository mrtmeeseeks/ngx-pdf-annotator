import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfAnnotatorComponent } from './pdf-annotator.component';

describe('PdfAnnotatorComponent', () => {
  let component: PdfAnnotatorComponent;
  let fixture: ComponentFixture<PdfAnnotatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PdfAnnotatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PdfAnnotatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
