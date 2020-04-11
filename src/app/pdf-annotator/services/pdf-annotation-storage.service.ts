import { Injectable } from '@angular/core';
import { RenderOptions } from '../models/render-options';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfAnnotationStorageService {
  private _renderOptions: RenderOptions;
  private _reloadPdf: BehaviorSubject<void> = new BehaviorSubject(null);
  private _scaleChange: Subject<number> = new Subject();
  private _rotationChange: Subject<number> = new Subject();

  constructor() {}

  setRenderOptions(renderOptions: RenderOptions) {
    this._renderOptions = renderOptions;
    const { rotate, scale } = renderOptions;
  }

  public get isReloading$() {
    return this._reloadPdf.asObservable();
  }

  public get scaleChange$() {
    return this._scaleChange.asObservable();
  }

  public get rotationChange$() {
    return this._rotationChange.asObservable();
  }

  setRotation(rotation: number) {
    localStorage.setItem(
      `${this._renderOptions.documentId}/rotate`,
      rotation.toString()
    );
    this._rotationChange.next(rotation);
  }

  get rotation() {
    return (
      parseInt(
        localStorage.getItem(`${this._renderOptions.documentId}/rotate`),
        10
      ) || 0
    );
  }

  setScale(scale: number) {
    localStorage.setItem(
      `${this._renderOptions.documentId}/scale`,
      scale.toString()
    );
    this._scaleChange.next(scale);
  }

  get scale() {
    return (
      parseFloat(
        localStorage.getItem(`${this._renderOptions.documentId}/scale`)
      ) || 1.33
    );
  }

  setTextColor(color: string) {
    localStorage.setItem(`${this._renderOptions.documentId}/scale`, color);
  }

  get textColor(): string {
    return localStorage.getItem(`${this._renderOptions.documentId}/text/color`);
  }

  setTextSize(size: string) {
    localStorage.setItem(`${this._renderOptions.documentId}/text/size`, size);
  }

  get textSize(): string {
    return localStorage.getItem(`${this._renderOptions.documentId}/text/size`);
  }
}
