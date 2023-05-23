import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

import { CodeBlockSettings } from './types';

export const defaultCreateSelect = (
  settings: CodeBlockSettings,
  dom: HTMLElement,
  node: Node,
  view: EditorView,
  getPos: (() => number) | boolean
) => {
  if (!settings.languageLoaders) return () => {};
  const { languageLoaders } = settings;
  const select = document.createElement('select');
  select.className = 'codeblock-select';
  const noneOption = document.createElement('option');
  noneOption.value = 'none';
  noneOption.textContent = settings.languageNameMap?.none || 'none';
  select.append(noneOption);
  Object.keys(languageLoaders)
    .sort()
    .forEach((lang) => {
      if (settings.languageWhitelist && !settings.languageWhitelist.includes(lang)) return;
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = settings.languageNameMap?.[lang] || lang;
      select.append(option);
    });
  select.value = node.attrs.lang || 'none';
  dom.prepend(select);
  select.onchange = async (e) => {
    if (!(e.target instanceof HTMLSelectElement)) return;
    const lang = e.target.value;
    if (typeof getPos === 'function') {
      view.dispatch(
        view.state.tr.setNodeMarkup(getPos(), undefined, {
          ...node.attrs,
          lang
        })
      );
    }
  };
  // Delete code.
  return () => {};
};

const defaultUpdateSelect = (
  settings: CodeBlockSettings,
  dom: HTMLElement,
  node: Node,
  view: EditorView,
  getPos: (() => number) | boolean,
  oldNode: Node
) => {
  if (oldNode.attrs.lang !== node.attrs.lang) {
    const select = dom.querySelector('.codeblock-select');
    if (!(select instanceof HTMLSelectElement)) return;
    select.value = node.attrs.lang || 'none';
  }
};

const defaultStopEvent = () => true;

export const defaultSettings: CodeBlockSettings = {
  createSelect: defaultCreateSelect,
  updateSelect: defaultUpdateSelect,
  stopEvent: defaultStopEvent,
  readOnly: false
};
