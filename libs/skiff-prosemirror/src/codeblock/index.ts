import { Plugin, PluginKey } from 'prosemirror-state';

import { codeMirrorBlockNodeView } from './codeMirrorBlockNodeView';
import { defaultSettings } from './defaults';
import languageLoaders, { legacyLanguageLoaders } from './languageLoaders';
import { CodeBlockLanguages, LegacyLanguages } from './languages';
import codeblockSettings from './settings';
import { CodeBlockSettings, LanguageLoaders } from './types';
import { codeBlockArrowHandlers, resetCodemirrorSelection } from './utils';

export const codeMirrorBlockKey = new PluginKey('codemirror-block');

const codeMirrorBlockPlugin = (settings: CodeBlockSettings) =>
  new Plugin({
    key: codeMirrorBlockKey,
    props: {
      nodeViews: {
        code_block: codeMirrorBlockNodeView(settings)
      },
      handleDOMEvents: {
        focus: () => {
          const cmView = window.lastActiveCodemirrorView;
          if (!cmView) return false;
          resetCodemirrorSelection(cmView);
          return false;
        }
      }
    }
  });

export default codeMirrorBlockPlugin;

export {
  codeMirrorBlockNodeView,
  codeBlockArrowHandlers,
  codeMirrorBlockPlugin,
  CodeBlockSettings,
  LanguageLoaders,
  CodeBlockLanguages,
  LegacyLanguages,
  defaultSettings,
  languageLoaders,
  legacyLanguageLoaders,
  codeblockSettings
};
