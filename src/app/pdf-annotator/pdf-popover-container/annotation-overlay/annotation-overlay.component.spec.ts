import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationOverlayComponent } from './annotation-overlay.component';

describe('AnnotationOverlayComponent', () => {
  let component: AnnotationOverlayComponent;
  let fixture: ComponentFixture<AnnotationOverlayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnnotationOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnotationOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
