import { Injectable } from '@angular/core';
import { Annotation } from '../models/annotation';
import uuid from '../pdf-utils/uuid';
import { RenderOptions } from '../models/render-options';
import { AnnotationEventType } from './pdf-events.service';

@Injectable({
  providedIn: 'root',
})
export class PdfStoreAdapterService {
  private _renderOptions: RenderOptions;

  constructor() {}

  public init(renderOptions: RenderOptions) {
    this._renderOptions = renderOptions;
  }

  public clearAnnotations(documentId: string, pagesSize: number) {
    if (confirm('Are you sure you want to clear annotations?')) {
      for (let i = 0; i < pagesSize; i++) {
        document.querySelector(
          `div#pageContainer${i + 1} svg.annotationLayer`
        ).innerHTML = '';
      }

      localStorage.removeItem(`${documentId}/annotations`);
    }
  }

  public getAllAnnotations(documentId: string): Promise<Annotation[]> {
    return new Promise((resolve, reject) => {
      let annotations = this._getAnnotations(documentId);
      resolve(this.groupBy(annotations, 'page') as any);
    });
  }

  private groupBy(data: Annotation[], by: string) {
    return data
      .reduce((annotation, curr) => {
        if (!annotation[curr[by]]) {
          annotation[curr[by]] = [];
        }
        annotation[curr[by]].push(curr);
        return annotation;
      }, [])
      .map((ann, i) => {
        return {
          page: i,
          annotations: ann,
        };
      })
      .filter((ann) => !!ann);
  }

  public getAnnotations(
    documentId: string,
    pageNumber: number
  ): Promise<{
    annotations: Annotation[];
    documentId: string;
    pageNumber: number;
  }> {
    return new Promise((resolve, reject) => {
      let annotations = this._getAnnotations(documentId).filter(
        (i: Annotation) => {
          return i.page === pageNumber && i.class === 'Annotation';
        }
      );
      resolve({
        documentId,
        pageNumber,
        annotations,
      });
    });
  }

  public getAnnotation(documentId: string, annotationId: string) {
    return Promise.resolve(
      this._getAnnotations(documentId)[
        this._findAnnotation(documentId, annotationId)
      ]
    ).then((annotation) => {
      return annotation;
    });
  }

  public addAnnotation(
    documentId: string,
    pageNumber: number,
    annotation: Annotation,
    svg: SVGElement
  ) {
    return new Promise((resolve, reject) => {
      annotation.class = 'Annotation';
      annotation.id = uuid();
      annotation.page = pageNumber;

      let annotations = this._getAnnotations(documentId);
      annotations.push(annotation);
      this._updateAnnotations(documentId, annotations);
      if (svg) {
        this._renderOptions.annotationRenderer.appendChild(
          svg,
          annotation,
          null
        );
      }
      this._renderOptions.events.setAnnotationEvent({
        event: AnnotationEventType.Add,
        annotation,
      });
      resolve(annotation);
    });
  }

  public editAnnotation(documentId, annotationId, annotation) {
    return new Promise((resolve, reject) => {
      let annotations = this._getAnnotations(documentId);
      annotations[this._findAnnotation(documentId, annotationId)] = annotation;
      this._updateAnnotations(documentId, annotations);

      resolve(annotation);
    }).then((updatedAnnotation) => {
      return updatedAnnotation;
    });
  }

  deleteAnnotation(documentId: string, annotationId: string) {
    return new Promise((resolve, reject) => {
      let index = this._findAnnotation(documentId, annotationId);
      if (index > -1) {
        let annotations = this._getAnnotations(documentId);
        this._renderOptions.events.setAnnotationEvent({
          event: AnnotationEventType.Remove,
          annotation: annotations[index],
        });
        annotations.splice(index, 1);
        this._updateAnnotations(documentId, annotations);
      }
      resolve(true);
    });
  }

  public getComments(documentId: string, annotationId: string) {
    return new Promise((resolve, reject) => {
      resolve(
        this._getAnnotations(documentId).filter((i) => {
          return i.class === 'Comment' && i.annotation === annotationId;
        })
      );
    });
  }

  public getAllComments(documentId: string) {
    return new Promise((resolve, reject) => {
      resolve(
        this._getAnnotations(documentId).filter((i) => {
          return i.class === 'Comment';
        })
      );
    });
  }

  public addComment(documentId: string, annotationId: string, content: string) {
    return new Promise((resolve, reject) => {
      let comment = {
        class: 'Comment',
        id: uuid(),
        annotation: annotationId,
        content: content,
      };

      let annotations = this._getAnnotations(documentId);
      annotations.push(comment);
      this._updateAnnotations(documentId, annotations);

      resolve(comment);
    });
  }

  public deleteComment(documentId: string, commentId: string) {
    return new Promise((resolve, reject) => {
      this._getAnnotations(documentId);
      let index = -1;
      let annotations = this._getAnnotations(documentId);
      for (let i = 0, l = annotations.length; i < l; i++) {
        if (annotations[i].id === commentId) {
          index = i;
          break;
        }
      }

      if (index > -1) {
        annotations.splice(index, 1);
        this._updateAnnotations(documentId, annotations);
      }

      resolve(true);
    });
  }

  private _getAnnotations(documentId: string) {
    return JSON.parse(localStorage.getItem(`${documentId}/annotations`)) || [];
  }

  private _updateAnnotations(documentId: string, annotations: Annotation[]) {
    localStorage.setItem(
      `${documentId}/annotations`,
      JSON.stringify(annotations)
    );
  }

  private _findAnnotation(documentId: string, annotationId: string) {
    let index = -1;
    let annotations = this._getAnnotations(documentId);
    for (let i = 0, l = annotations.length; i < l; i++) {
      if (annotations[i].id === annotationId) {
        index = i;
        break;
      }
    }
    return index;
  }
}
