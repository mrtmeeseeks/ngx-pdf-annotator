import { RenderOptions } from '../models/render-options';
import { EventEmitter } from 'events';
import { findAnnotationAtPoint } from '../pdf-utils/utils';
import { Annotation } from '../models/annotation';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export enum AnnotationEventType {
  Add = 'Add',
  Remove = 'Remove',
  Click = 'Click',
  Blur = 'Blur',
  Message = 'Message'
}

export interface AnnotationEvent {
  event: AnnotationEventType;
  annotation?: Annotation;
  target?: SVGElement;
  annotationId?: string;
}

export class PdfEvents {
  private _annotationEventSubject: Subject<AnnotationEvent> = new Subject();

  constructor(private options: RenderOptions) {
    this._initAnnotationClick();
  }

  private _initAnnotationClick() {
    let clickNode: SVGElement;
    this.options.container.addEventListener('click', (e: MouseEvent) => {
      const target: SVGElement = findAnnotationAtPoint(e.clientX, e.clientY);
      if (clickNode && clickNode !== target) {
        this._annotationEventSubject.next({
          event: AnnotationEventType.Blur,
          target: clickNode,
        });
      }

      if (target) {
        this._annotationEventSubject.next({
          event: AnnotationEventType.Click,
          target: target,
        });
      }

      clickNode = target;
    });
  }

  public removeEvents() {}

  public setAnnotationEvent({ event, annotation = null, target = null, annotationId = null }) {
    this._annotationEventSubject.next({
      event,
      annotation,
      target,
      annotationId
    });
  }

  public getAnyEvent(): Observable<AnnotationEvent> {
    return this._annotationEventSubject.asObservable();
  }

  public onClick(): Observable<SVGElement> {
    return this.getAnyEvent().pipe(
      filter(({ event }) => event === AnnotationEventType.Click),
      map(({ target }) => target)
    );
  }

  public onBlur(): Observable<SVGElement> {
    return this.getAnyEvent().pipe(
      filter(({ event }) => event === AnnotationEventType.Blur),
      map(({ target }) => target)
    );
  }

  public onMessage(): Observable<string> {
    return this.getAnyEvent().pipe(
      filter(({ event }) => event === AnnotationEventType.Message),
      map(({ annotationId }) => annotationId)
    );
  }

  public onAdd(): Observable<Annotation> {
    return this.getAnyEvent().pipe(
      filter(({ event }) => event === AnnotationEventType.Add),
      map(({ annotation }) => annotation)
    );
  }

  public onRemove(): Observable<Annotation> {
    return this.getAnyEvent().pipe(
      filter(({ event }) => event === AnnotationEventType.Remove),
      map(({ annotation }) => annotation)
    );
  }
}
