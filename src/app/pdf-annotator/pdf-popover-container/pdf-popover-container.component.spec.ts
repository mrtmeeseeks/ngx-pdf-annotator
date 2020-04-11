import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfPopoverContainerComponent } from './pdf-popover-container.component';

describe('PdfPopoverContainerComponent', () => {
  let component: PdfPopoverContainerComponent;
  let fixture: ComponentFixture<PdfPopoverContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PdfPopoverContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PdfPopoverContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
