function createStyleSheet(blocks) {
  var style = document.createElement('style');
  var text = Object.keys(blocks)
    .map(function(selector) {
      return processRuleSet(selector, blocks[selector]);
    })
    .join('\n');

  style.setAttribute('type', 'text/css');
  style.appendChild(document.createTextNode(text));

  return style;
}

function processRuleSet(selector, block) {
  return selector + ' {\n' + processDeclarationBlock(block) + '\n}';
}

function processDeclarationBlock(block: any): string {
  return Object.keys(block)
    .map(function(prop) {
      return processDeclaration(prop, block[prop]);
    })
    .join('\n');
}

function processDeclaration(prop: string, value: number): string {
  if (!isNaN(value) && value != 0) {
    (value as any) = value + 'px';
  }

  return hyphenate(prop) + ': ' + value + ';';
}

function hyphenate(prop: string): string {
  return prop.replace(/[A-Z]/g, function(match: string) {
    return '-' + match.toLowerCase();
  });
}

export const BORDER_COLOR = '#00BFFF';

export const userSelectStyleSheet = createStyleSheet({
  body: {
    '-webkit-user-select': 'none',
    '-moz-user-select': 'none',
    '-ms-user-select': 'none',
    'user-select': 'none'
  }
});
userSelectStyleSheet.setAttribute('data-pdf-annotate-user-select', 'true');
