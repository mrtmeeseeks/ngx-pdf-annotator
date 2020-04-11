import { removeIntercetingRects } from './text-highlight-rect';
import { scaleDown } from '../../pdf-utils/utils';
import { Annotation } from '../../models/annotation';
import { SelectionRectangle } from './text-selection';

export const constructHighlightAnnotation = (
  type: string,
  color: string,
  rects: SelectionRectangle[],
  svg: SVGElement,
  text: string
): Annotation => {
  let boundingRect = svg.getBoundingClientRect();
  if (!color) {
    if (type === 'highlight') {
      color = 'red';
    } else if (type === 'strikeout') {
      color = 'FF0000';
    }
  }

  const mappedRects = [...rects]
    .map((r) => {
      return scaleDown(svg, {
        y: r.top - boundingRect.top,
        x: r.left - boundingRect.left,
        width: r.width,
        height: r.height,
      } as DOMRect);
    })
    .filter((r) => r.width > 0 && r.height > 0 && r.x > -1 && r.y > -1);

  const rectangles = removeIntercetingRects(mappedRects);
  return {
    text,
    type,
    color,
    rectangles,
    timestamp: new Date(),
  };
};
