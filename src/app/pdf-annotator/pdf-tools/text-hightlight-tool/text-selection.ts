export interface TextSelectEvent {
  text: string;
  viewportRectangle: SelectionRectangle | null;
  hostRectangle: SelectionRectangle | null;
  rects: any[];
}

export interface SelectionRectangle {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface MarkerRange {
  container: any;
  offset: number;
}

interface MarkerSelection {
  range: Range;
  selection: Selection;
}

export class TextSelectionUtil {
  private _startMarker: HTMLElement;
  private _endMarker: HTMLElement;
  private _startRange: MarkerRange;
  private _endRange: MarkerRange;
  private _downRange: MarkerRange;
  private _moveRange: MarkerRange;
  private _drag: boolean;
  private _isStart: boolean;
  private _isEnd: boolean;

  constructor(private _elementRef: HTMLElement) {}

  public init() {
    this._startMarker = document.getElementById('marker-start');
    this._endMarker = document.getElementById('marker-end');
  }

  isDragging() {
    return this._drag;
  }

  enableDrag() {
    this._drag = true;
  }

  disableDrag() {
    this._drag = false;
  }

  isRangeSelection(): boolean {
    const res = this.markersSelectRange();
    return res && res.selection.type === 'Range';
  }

  updateMarkersPositionOnScroll = () => {
    const sel = document.getSelection();
    if (sel.type === 'Range') {
      const range = sel.getRangeAt(0);
      this.setMarkers(range);
    } else {
      this.setMarkers();
    }
  };

  public setStartAndEndMarker(e) {
    this._isStart = this.isOverMarker(e, this._startMarker);
    this._isEnd = this.isOverMarker(e, this._endMarker);

    if (!this._isStart && !this._isEnd) {
      this.clearMarkers();
      this._downRange = this.markersGetClickRange(e);
    }
    if (this._downRange) {
      e.preventDefault();
    }
  }

  private getRangeContainer(range: Range): Node {
    let container = range.commonAncestorContainer;
    while (container.nodeType !== Node.ELEMENT_NODE) {
      container = container.parentNode;
    }
    return container;
  }

  private viewportToHost(
    viewportRectangle: SelectionRectangle
  ): SelectionRectangle {
    const hostRectangle = this._elementRef.getBoundingClientRect();

    const localLeft = viewportRectangle.left - hostRectangle.left;
    const localTop = viewportRectangle.top - hostRectangle.top;
    return {
      left: localLeft,
      top: localTop,
      width: viewportRectangle.width,
      height: viewportRectangle.height,
    } as SelectionRectangle;
  }

  markersSelectionRemoveRange = (): Selection => {
    const sel = document.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (sel.removeRange) {
        sel.removeRange(range);
      } else if (sel.removeAllRanges) {
        sel.removeAllRanges();
      }
    }
    return sel;
  };

  public removeTextSelection() {
    if (window.getSelection) {
      if (window.getSelection().empty) {
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {
        window.getSelection().removeAllRanges();
      }
    } else if (document['selection']) {
      document['selection'].empty();
    }
  }

  markersGetClickRange = (e: MouseEvent): MarkerRange => {
    let range: CaretPosition | Range;
    let node: Node;
    let offset: number;

    if (document.caretPositionFromPoint) {
      range = document.caretPositionFromPoint(e.clientX, e.clientY);
      node = range ? range.offsetNode : null;
      offset = range ? range.offset : null;
    } else if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(e.clientX, e.clientY);
      node = range ? range.startContainer : null;
      offset = range ? range.startOffset : null;
    }
    if (!node || offset === null || node.nodeName !== '#text') {
      return null;
    }
    return {
      container: node,
      offset: offset,
    };
  };

  makersSwapDirectionFlags = () => {
    if (this._isEnd) {
      this._isEnd = false;
      this._isStart = true;
    } else if (this._isStart) {
      this._isStart = false;
      this._isEnd = true;
    }
  };

  isOverMarker = (e: MouseEvent, marker: HTMLElement) => {
    const rect = marker.getBoundingClientRect();
    rect.x -= 20;
    rect.width += 40;
    rect.y -= 50;
    rect.height += 100;
    const isPointInsideRect = (x: number, y: number, rect: DOMRect) => {
      return (
        x > rect.x &&
        y > rect.y &&
        x < rect.x + rect.width &&
        y < rect.y + rect.height
      );
    };
    return isPointInsideRect(e.clientX, e.clientY, rect);
  };

  getMarkersPos = (range: Range): Partial<DOMRect> => {
    const rr = range.getClientRects();
    const rects = [];
    for (let i = 0; i < rr.length; i++) {
      rects.push(rr[i]);
    }
    rects.sort((a, b) => {
      if (a.y + a.height <= b.y) return -1;
      if (a.y >= b.y + b.height) return 1;
      return a.x >= b.x ? 1 : -1;
    });
    if (rects.length > 0) {
      const last = rects[rects.length - 1];
      return {
        left: rects[0].x + window.scrollX,
        top: rects[0].y + window.scrollY,
        right: last.x + last.width + window.scrollX,
        bottom: last.y + last.height + window.scrollY,
      };
    }
    return null;
  };

  markersSelectRange = (): MarkerSelection => {
    if (!this._downRange || !this._moveRange) {
      return;
    }

    if (this._isEnd) {
      this._endRange = this._moveRange;
    } else if (this._isStart) {
      this._startRange = this._moveRange;
    } else {
      this._startRange = this._downRange;
      this._endRange = this._moveRange;
    }

    let sel = this.markersSetSelection(this._startRange, this._endRange);
    if (!sel.toString()) {
      sel = this.markersSetSelection(this._endRange, this._startRange);
      this.makersSwapDirectionFlags();
    }
    return {
      range: sel.getRangeAt(0),
      selection: sel,
    };
  };

  markersSetSelection = (start: MarkerRange, end: MarkerRange): Selection => {
    const range = document.createRange();
    range.setStart(start.container, start.offset);
    range.setEnd(end.container, end.offset);
    const sel = this.markersSelectionRemoveRange();
    sel.addRange(range);
    return sel;
  };

  getselectionEvent = (range: Range, selection: Selection): TextSelectEvent => {
    const viewportRectangle = range.getBoundingClientRect();
    const rects = range.getClientRects();
    const hostRectangle = this.viewportToHost(viewportRectangle);

    return {
      text: selection.toString(),
      viewportRectangle,
      hostRectangle,
      rects: [...(rects as any)].map((r) => {
        return {
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
        };
      }),
    };
  };

  markersProcessSelection = (e: MouseEvent) => {
    this._moveRange = this.markersGetClickRange(e);

    const markerSelection: MarkerSelection = this.markersSelectRange();

    if (markerSelection) {
      const rangeContainer = this.getRangeContainer(markerSelection.range);
      if (!this._elementRef.contains(rangeContainer)) {
        return;
      }

      this.setMarkers(markerSelection.range);
    }
    e.preventDefault();
  };

  clearMarkers = (): void => {
    this.setMarkers();
    this.markersSelectionRemoveRange();
  };

  setMarkers = (range: Range = null) => {
    if (!this._startMarker) {
      return;
    }

    const pos: Partial<DOMRect> = range ? this.getMarkersPos(range) : null;
    if (pos) {
      this._startMarker.style.display = 'flex';
      this._endMarker.style.display = 'flex';
      this._startMarker.style.left = pos.left + 'px';
      this._startMarker.style.top = pos.top + 'px';
      this._endMarker.style.left = pos.right + 'px';
      this._endMarker.style.top = pos.bottom + 'px';
    } else {
      this._startMarker.style.display = 'none';
      this._endMarker.style.display = 'none';
    }
  };
}
