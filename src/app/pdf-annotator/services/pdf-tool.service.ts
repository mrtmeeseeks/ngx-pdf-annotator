import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { CdkPortal } from '@angular/cdk/portal';

@Injectable({
  providedIn: 'root',
})
export class PdfToolService {
  private _selectToolSubject: BehaviorSubject<string> = new BehaviorSubject(
    'cursor'
  );
  private _selectMsgSubject: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  private _popoverOptions: Subject<{
    template: CdkPortal;
    rect: DOMRect;
  }> = new Subject();

  private _prevTemplate: boolean;

  constructor() {}

  public setPopoverOptions(template: CdkPortal, rect: DOMRect, from?: string) {
    this._prevTemplate = template !== null;
    console.log(`Popover: ${this._prevTemplate}`, from);
    this._popoverOptions.next({
      template,
      rect,
    });
  }

  public getPopoverOptions() {
    return this._popoverOptions.asObservable();
  }

  public setMessageStatus(status: boolean) {
    this._selectMsgSubject.next(status);
  }

  public getMessageStatus() {
    return this._selectMsgSubject.asObservable();
  }

  public setSelectedTool(tool: string): void {
    this._selectToolSubject.next(tool);
  }

  public getSelectedTool(): Observable<string> {
    return this._selectToolSubject.asObservable();
  }
}
