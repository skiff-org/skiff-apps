import * as DOMPurify from 'dompurify';
import { Color, Icon, Icons, Size } from '@skiff-org/skiff-ui';
import { NodeSpec } from 'prosemirror-model';
import { renderToStaticMarkup } from 'react-dom/server';

export const style = 'font-size: 60px; display: block;';
export const DOC_ICON_CLASS = 'doc-icon';

export const DocIconNodeSpec: NodeSpec = {
  parseDOM: [
    {
      getAttrs(dom) {
        if (!(dom instanceof HTMLElement)) {
          return {};
        }

        const color = dom.getAttribute('data-color');
        const icon = dom.getAttribute('data-icon');

        return { icon, color };
      },
      tag: `div.${DOC_ICON_CLASS}`,
      priority: 100
    }
  ],
  selectable: false,
  toDOM(node) {
    const { icon, color } = node.attrs;
    const iconProp = icon as Icon;
    const colorProp = color as Color;

    const nwIcon = Icons({ icon: iconProp || Icon.File, color: colorProp || 'primary', size: Size.X_LARGE });

    const iconElement = nwIcon ? renderToStaticMarkup(nwIcon) : '';
    const div = document.createElement('div');
    div.setAttribute(
      'style',
      `
        width: 56px;
        aspect-ratio: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 12px;
        background: var(--bg-cell-hover);
        cursor: pointer;

        transition: all 100ms;
        `
    );
    div.innerHTML = DOMPurify.sanitize(iconElement);
    (div.firstChild as HTMLElement)?.setAttribute('style', 'height: 45px;');

    return ['div', { class: DOC_ICON_CLASS, style, 'data-icon': iconProp, 'data-color': colorProp }, div];
  },
  attrs: {
    layout: {
      default: ''
    },
    icon: {
      default: Icon.File
    },
    color: {
      default: 'primary'
    }
  }
};
