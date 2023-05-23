import { MenuItem, MenuItemSpec } from 'prosemirror-menu';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { CommandStateProperty, MobilePostMessageTypes } from '../../types';
import { ToolbarItemsIds } from '../itemsMap';

const COMMAND_INITIAL_STATE = {
  show: undefined,
  enable: undefined
};

/*
 * lot of the code in this file is copied from ProseMirror code base,
 * it is needed in order to override and improve some of the basic functionalities
 */

const prefix = 'ProseMirror-menu';

const SVG = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';

type IconSpec = { path: string; width: number; height: number; dom: Node; css: string; text: string };

function hashPath(path: string) {
  let hash = 0;
  for (let i = 0; i < path.length; i++) hash = ((hash << 5) - hash + path.charCodeAt(i)) | 0;
  return hash;
}

function buildSVG(name: string, data: { width: number; height: number; path: string }) {
  let collection: HTMLElement | null | SVGSVGElement = document.getElementById(prefix + '-collection');
  if (!collection) {
    collection = document.createElementNS(SVG, 'svg');
    collection.id = prefix + '-collection';
    collection.style.display = 'none';
    document.body.insertBefore(collection, document.body.firstChild);
  }
  const sym = document.createElementNS(SVG, 'symbol');
  sym.id = name;
  sym.setAttribute('viewBox', '0 0 ' + data.width + ' ' + data.height);
  const path = sym.appendChild(document.createElementNS(SVG, 'path'));
  path.setAttribute('d', data.path);
  collection.appendChild(sym);
}

function getIcon(icon: IconSpec) {
  const node = document.createElement('div');
  node.className = prefix;
  if (icon.path) {
    const name = 'pm-icon-' + hashPath(icon.path).toString(16);
    if (!document.getElementById(name)) buildSVG(name, icon);
    const svg = node.appendChild(document.createElementNS(SVG, 'svg'));
    svg.style.width = icon.width / icon.height + 'em';
    const use = svg.appendChild(document.createElementNS(SVG, 'use'));
    use.setAttributeNS(XLINK, 'href', /([^#]*)/.exec(document.location.href)![1] + '#' + name);
  } else if (icon.dom) {
    node.appendChild(icon.dom.cloneNode(true));
  } else {
    node.appendChild(document.createElement('span')).textContent = icon.text || '';
    if (icon.css && node.firstChild) (node.firstChild as HTMLElement).style.cssText = icon.css;
  }
  return node;
}

// Work around classList.toggle being broken in IE11
function setClass(dom: HTMLElement, cls: string, on: boolean) {
  if (on) dom.classList.add(cls);
  else dom.classList.remove(cls);
}

function translate(view: any, text: string) {
  return view._props.translate ? view._props.translate(text) : text;
}

interface SkiffMenuItemSpec extends Omit<MenuItemSpec, 'run' | 'icon'> {
  run: (state: EditorState, dispatch: (p: Transaction) => void, view: EditorView, e?: Event) => void;
  id: ToolbarItemsIds;
  updateDOM?: (dom: HTMLElement, state: EditorState) => void;
  eventType?: string;
  icon?: IconSpec;
}

const postMobileMessage = (
  type: MobilePostMessageTypes,
  commandId: ToolbarItemsIds,
  value: boolean,
  property: CommandStateProperty
) => {
  if (!window.ReactNativeWebView) return;

  if (!window.mobileToolbarState[commandId]) {
    // initialize the command state
    window.mobileToolbarState[commandId] = COMMAND_INITIAL_STATE;
  }

  if (window.mobileToolbarState[commandId][property] !== value) {
    // send message to react-native only the state has changed
    window.ReactNativeWebView.postMessage(JSON.stringify({ type, value, commandId }));
  }
};

/**
 * MenuItem that add new abilities to ProseMirrors MenuItem.
 * 1. able to update the dom through `updateDOM` in item spec
 * 2. sends mobile update messages
 * 3. can replace default 'mousedown' event with any event to active the item, through 'eventType'
 **/
class SkiffMenuItem extends MenuItem {
  updateDOM?: (dom: HTMLElement, state: EditorState) => void;

  spec: SkiffMenuItemSpec;

  id: ToolbarItemsIds;

  constructor(spec: SkiffMenuItemSpec) {
    super(spec);
    this.updateDOM = spec.updateDOM;
    this.id = spec.id;
    this.spec = spec;
  }

  render(view: EditorView) {
    const spec = this.spec;
    let dom: HTMLElement | null = null;
    if (spec.render) {
      dom = spec.render(view) as HTMLElement;
    } else if (spec.icon) {
      dom = getIcon(spec.icon);
    } else if (spec.label) {
      dom = document.createElement('div');
      dom.appendChild(document.createTextNode(spec.label));
    }

    if (!dom) throw new RangeError('MenuItem without icon or label property');

    if (spec.title) {
      const title = typeof spec.title === 'function' ? spec.title(view.state) : spec.title;
      dom.setAttribute('title', translate(view, title));
    }
    if (spec.class) dom.classList.add(spec.class);
    if (spec.css) dom.style.cssText += spec.css;

    dom.addEventListener(this.spec.eventType || 'mousedown', (e: Event) => {
      e.preventDefault();
      if (!dom) return;
      if (!dom.classList.contains(prefix + '-disabled')) spec.run(view.state, view.dispatch, view, e);
    });

    const update = (state: EditorState) => {
      if (!dom) return false;

      if (spec.select) {
        const selected = spec.select(state);
        dom.style.display = selected ? '' : 'none';
        postMobileMessage(MobilePostMessageTypes.show, this.id, selected, CommandStateProperty.show);
        if (!selected) return false;
      }
      let enabled = true;
      if (spec.enable) {
        enabled = spec.enable(state) || false;
        setClass(dom, prefix + '-disabled', !enabled);
        postMobileMessage(MobilePostMessageTypes.enable, this.id, enabled, CommandStateProperty.enable);
      }
      if (spec.active) {
        const active = (enabled && spec.active(state)) || false;
        setClass(dom, prefix + '-active', active);
      }
      if (this.updateDOM) this.updateDOM(dom, state);
      return true;
    };

    return { dom, update };
  }
}

export default SkiffMenuItem;
