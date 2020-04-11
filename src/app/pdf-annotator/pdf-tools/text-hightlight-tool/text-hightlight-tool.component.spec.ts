import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextHightlightToolComponent } from './text-hightlight-tool.component';

describe('TextHightlightToolComponent', () => {
  let component: TextHightlightToolComponent;
  let fixture: ComponentFixture<TextHightlightToolComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextHightlightToolComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextHightlightToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
