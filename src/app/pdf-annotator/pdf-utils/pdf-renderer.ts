import { Annotation } from '../models/annotation';
import { Renderer2 } from '@angular/core';
import normalizeColor from './normalizeColor';

const UPPER_REGEX = /[A-Z]/g;
const isFirefox = /firefox/i.test(navigator.userAgent);
const SIZE = 25;
const D =
  'M499.968 214.336q-113.832 0 -212.877 38.781t-157.356 104.625 -58.311 142.29q0 62.496 39.897 119.133t112.437 97.929l48.546 27.9 -15.066 53.568q-13.392 50.778 -39.06 95.976 84.816 -35.154 153.45 -95.418l23.994 -21.204 31.806 3.348q38.502 4.464 72.54 4.464 113.832 0 212.877 -38.781t157.356 -104.625 58.311 -142.29 -58.311 -142.29 -157.356 -104.625 -212.877 -38.781z';

// Don't convert these attributes from camelCase to hyphenated-attributes
const BLACKLIST = ['viewBox'];

let keyCase = (key) => {
  if (BLACKLIST.indexOf(key) === -1) {
    key = key.replace(UPPER_REGEX, (match) => '-' + match.toLowerCase());
  }
  return key;
};

export class PdfAnnotationRenderer {
  constructor(private renderer: Renderer2) {}

  public appendChild(
    svg: SVGElement,
    annotation: Annotation,
    viewport: HTMLElement
  ) {
    if (!viewport) {
      viewport = JSON.parse(svg.getAttribute('data-pdf-annotate-viewport'));
    }

    let child;
    switch (annotation.type) {
      case 'area':
      case 'highlight':
        child = this.renderRect(annotation);
        break;
      case 'strikeout':
        child = this.renderLine(annotation);
        break;
      case 'point':
        child = this.renderPoint(annotation);
        break;
      case 'textbox':
        child = this.renderText(annotation);
        break;
      case 'drawing':
        child = this.renderPath(annotation);
        break;
    }

    // If no type was provided for an annotation it will result in node being null.
    // Skip appending/transforming if node doesn't exist.
    if (child) {
      // Set attributes
      this.renderer.setAttribute(child, 'data-pdf-annotate-id', annotation.id);
      this.renderer.setAttribute(
        child,
        'data-pdf-annotate-type',
        annotation.type
      );
      this.renderer.setAttribute(child, 'aria-hidden', `${true}`);
      this.renderer.appendChild(svg, this.transform(child, viewport));
    }

    return child;
  }

  private transform(node, viewport) {
    let trans = this.getTranslation(viewport);

    // Let SVG natively transform the element
    this.renderer.setAttribute(
      node,
      'transform',
      `scale(${viewport.scale}) rotate(${viewport.rotation}) translate(${trans.x}, ${trans.y})`
    );

    // Manually adjust x/y for nested SVG nodes
    if (!isFirefox && node.nodeName.toLowerCase() === 'svg') {
      this.renderer.setAttribute(
        node,
        'x',
        `${parseInt(node.getAttribute('x'), 10) * viewport.scale}`
      );
      this.renderer.setAttribute(
        node,
        'y',
        `${parseInt(node.getAttribute('y'), 10) * viewport.scale}`
      );

      let x = parseInt(node.getAttribute('x', 10));
      let y = parseInt(node.getAttribute('y', 10));
      let width = parseInt(node.getAttribute('width'), 10);
      let height = parseInt(node.getAttribute('height'), 10);
      let path = node.querySelector('path');
      let svg = path.parentNode;

      // Scale width/height
      [node, svg, path, node.querySelector('rect')].forEach((n) => {
        this.renderer.setAttribute(
          n,
          'width',
          `${parseInt(n.getAttribute('width'), 10) * viewport.scale}`
        );
        this.renderer.setAttribute(
          n,
          'height',
          `${parseInt(n.getAttribute('height'), 10) * viewport.scale}`
        );
      });

      // Transform path but keep scale at 100% since it will be handled natively
      this.transform(path, Object.assign({}, viewport, { scale: 1 }));

      switch (viewport.rotation % 360) {
        case 90:
          this.renderer.setAttribute(
            node,
            'x',
            `${viewport.width - y - width}`
          );
          this.renderer.setAttribute(node, 'y', `${x}`);
          this.renderer.setAttribute(svg, 'x', `${1}`);
          this.renderer.setAttribute(svg, 'y', `${0}`);
          break;
        case 180:
          this.renderer.setAttribute(
            node,
            'x',
            `${viewport.width - x - width}`
          );
          this.renderer.setAttribute(
            node,
            'y',
            `${viewport.height - y - height}`
          );
          this.renderer.setAttribute(svg, 'y', `${2}`);
          break;
        case 270:
          this.renderer.setAttribute(node, 'x', `${y}`);
          this.renderer.setAttribute(
            node,
            'y',
            `${viewport.height - x - height}`
          );
          this.renderer.setAttribute(svg, 'x', `${-1}`);
          this.renderer.setAttribute(svg, 'y', `${0}`);
          break;
      }
    }

    return node;
  }

  private renderPath(a) {
    let d = [];
    let path = this.renderer.createElement('path', 'svg');

    for (let i = 0, l = a.lines.length; i < l; i++) {
      var p1 = a.lines[i];
      var p2 = a.lines[i + 1];
      if (p2) {
        d.push(`M${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`);
      }
    }

    this.setAttributes(path, {
      d: `${d.join(' ')}Z`,
      stroke: normalizeColor(a.color || '#000'),
      strokeWidth: a.width || 1,
      fill: 'none',
    });

    return path;
  }

  private getTranslation(viewport) {
    let x;
    let y;

    // Modulus 360 on the rotation so that we only
    // have to worry about four possible values.
    switch (viewport.rotation % 360) {
      case 0:
        x = y = 0;
        break;
      case 90:
        x = 0;
        y = (viewport.width / viewport.scale) * -1;
        break;
      case 180:
        x = (viewport.width / viewport.scale) * -1;
        y = (viewport.height / viewport.scale) * -1;
        break;
      case 270:
        x = (viewport.height / viewport.scale) * -1;
        y = 0;
        break;
    }

    return { x, y };
  }

  private renderRect(a) {
    if (a.type === 'highlight') {
      let group = this.renderer.createElement('g', 'svg');
      this.setAttributes(group, {
        fill: normalizeColor(a.color || '#ff0'),
        fillOpacity: 0.4,
      });

      a.rectangles.forEach((r) => {
        this.renderer.appendChild(group, this.createRect(r));
      });

      return group;
    } else {
      let rect = this.createRect(a);
      this.setAttributes(rect, {
        stroke: normalizeColor(a.color || '#f00'),
        fill: 'none',
      });

      return rect;
    }
  }

  private createRect(r) {
    let rect = this.renderer.createElement('rect', 'svg');

    this.setAttributes(rect, {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
    });

    return rect;
  }

  private setAttributes(node, attributes) {
    Object.keys(attributes).forEach((key) => {
      this.renderer.setAttribute(node, keyCase(key), attributes[key]);
    });
  }

  private renderPoint(a) {
    let outerSVG = this.renderer.createElement('svg');
    let innerSVG = this.renderer.createElement('svg');
    let rect = this.renderer.createElement('rect', 'svg');
    let path = this.renderer.createElement('path', 'svg');

    this.setAttributes(outerSVG, {
      width: SIZE,
      height: SIZE,
      x: a.x,
      y: a.y,
    });

    this.setAttributes(innerSVG, {
      width: SIZE,
      height: SIZE,
      x: 0,
      y: SIZE * 0.05 * -1,
      viewBox: '0 0 1000 1000',
    });

    this.setAttributes(rect, {
      width: SIZE,
      height: SIZE,
      stroke: '#000',
      fill: '#ff0',
    });

    this.setAttributes(path, {
      d: D,
      strokeWidth: 50,
      stroke: '#000',
      fill: '#fff',
    });

    this.renderer.appendChild(innerSVG, path);
    this.renderer.appendChild(innerSVG, rect);
    this.renderer.appendChild(outerSVG, innerSVG);

    return outerSVG;
  }

  private renderText(a) {
    const text = this.renderer.createElement('text', 'svg');

    this.setAttributes(text, {
      x: a.x,
      y: a.y + parseInt(a.size, 10),
      fill: normalizeColor(a.color || '#000'),
      fontSize: a.size,
    });

    this.renderer.setProperty(text, 'innerHTML', a.text);

    return text;
  }

  private renderLine(a) {
    let group = this.renderer.createElement('g', 'svg');
    this.setAttributes(group, {
      stroke: normalizeColor(a.color || '#f00'),
      strokeWidth: 1,
    });

    a.rectangles.forEach((r) => {
      let line = this.renderer.createElement('line', 'svg');

      this.setAttributes(line, {
        x1: r.x,
        y1: r.y,
        x2: r.x + r.width,
        y2: r.y,
      });

      this.renderer.appendChild(group, line);
    });

    return group;
  }
}
