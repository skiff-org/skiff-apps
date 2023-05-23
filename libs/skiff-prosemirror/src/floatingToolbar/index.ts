import { Plugin, PluginKey } from 'prosemirror-state';

import FloatingToolbarView from './floatingToolbarView';

export const floatingToolbarPluginKey = new PluginKey('floatingToolbarPlugin');

const floatingToolbarPlugin = () =>
  new Plugin({
    key: floatingToolbarPluginKey,
    view: (view) => new FloatingToolbarView(view)
  });

export default floatingToolbarPlugin;
