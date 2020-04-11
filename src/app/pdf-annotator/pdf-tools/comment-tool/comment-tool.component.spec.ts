import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentToolComponent } from './comment-tool.component';

describe('CommentToolComponent', () => {
  let component: CommentToolComponent;
  let fixture: ComponentFixture<CommentToolComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CommentToolComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommentToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
