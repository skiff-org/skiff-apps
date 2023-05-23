import crelt from 'crelt';
import { Icon } from 'nightwatch-ui';
import { Dropdown } from 'prosemirror-menu';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { TOOLBAR_ANIMATIONS_DURATION } from '../../utils';
import { createElementWithClassAndIcon } from '../utils';

import SkiffMenuItem from './SkiffMenuItem';

const prefix = 'ProseMirror-menu';

interface DropdownOption {
  state?: EditorState;
  dataTest?: string;
  class?: string;
  label?: string;
}
class AnimatedDropdown extends Dropdown {
  options: DropdownOption;

  public content: SkiffMenuItem[];

  constructor(content: SkiffMenuItem[], options: DropdownOption) {
    super(content, options);
    this.options = options;
    this.content = content;
  }

  render(view: EditorView): {
    dom: Node;
    update: (p: EditorState) => boolean;
  } {
    const { dom, update } = super.render(view);
    (dom as HTMLElement).dataset.test = this.options.dataTest || '';
    if (dom.firstChild) {
      dom.firstChild.appendChild(createElementWithClassAndIcon({ type: 'div', iconName: Icon.ChevronDown }));
    }
    return { dom, update: update as (p: EditorState) => boolean };
  }

  expand(dom: HTMLElement, items: any[]) {
    const menuDOM = crelt('div', { class: prefix + '-dropdown-menu ' + (this.options.class || '') }, items);

    let done = false;
    function close() {
      if (done) return;
      done = true;
      menuDOM.classList.toggle('animate-dropdown-close', true);
      setTimeout(() => {
        dom.removeChild(menuDOM);
        menuDOM.classList.toggle('animate-dropdown-close', false);
      }, TOOLBAR_ANIMATIONS_DURATION - 100);

      return true;
    }

    menuDOM.classList.toggle('animate-dropdown-expand', true);
    dom.appendChild(menuDOM);
    setTimeout(() => menuDOM.classList.toggle('animate-dropdown-expand', false), TOOLBAR_ANIMATIONS_DURATION);

    return { close, node: menuDOM };
  }
}

export default AnimatedDropdown;
