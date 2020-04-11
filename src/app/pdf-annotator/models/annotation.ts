export interface AnnotationRectangle {
  y: number;
  x: number;
  width: number;
  height: number;
}

export class Annotation {
  id?: string;
  class?: string;
  type: string;
  color: string;
  rectangles: AnnotationRectangle[];
  page?: number;
  timestamp: Date;
  text: string;
  notes?: any[];
}
