import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'renderPages'
})
export class RenderPagesPipe implements PipeTransform {
  transform(numPages: number): unknown {
    return Array.from({ length: numPages }).map((_, index) => {
      const pageNumber = index + 1;
      return {
        pageNumber,
        containerId: `pageContainer${pageNumber}`,
        canvasId: `page${pageNumber}`
      };
    });
  }
}
