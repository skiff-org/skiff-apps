import { insertMathCmd, mathPlugin } from '@benrbray/prosemirror-math';
import { setBaseName } from '@skiff-org/prosemirror-tables';
import { ThemeMode } from '@skiff-org/skiff-ui';
import { gapCursor } from 'prosemirror-gapcursor';
import { keymap } from 'prosemirror-keymap';
import { Schema } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';

import { codeBlockArrowHandlers } from './codeblock';
import codeBlockPlugin, { codeblockSettings } from './codeblock';
import { CommentPopupPlugin } from './comments/comment.plugin';
import ContentPlaceholderPlugin from './ContentPlaceholderPlugin';
import createEditorKeyMap, { getBaseKeymap } from './createEditorKeyMap';
import CursorPlaceholderPlugin from './CursorPlaceholderPlugin';
import createMultipleSelectionPlugin from './drag-and-drop/ActiveSelection';
import DropCursorPlugin from './drag-and-drop/DropCursorPlugin';
import textBlockHandle from './drag-and-drop/HandlesPlugin';
import EditorPageLayoutPlugin from './EditorPageLayoutPlugin';
import endWithTextBlock from './endWithEmptyParagraph';
import floatingToolbarPlugin from './floatingToolbar';
import transformPastedSlice from './GdocImport/transformPastedSlice';
import buildInputRules from './inputRules/buildInputRules';
import InsertLinkOnEnter from './InsertLinkOnEnter';
import LinkTooltipPlugin from './LinkTooltipPlugin';
import LocalstorageCleanerPlugin from './LocalstorageCleanerPlugin';
import MentionsMenuPlugin from './mentionsMenu/MentionsMenuPlugin';
import SelectionTracker from './normalizeSelection/selectionTracker';
import { docPlaceholders } from './plugins/DocTitlePlaceholder';
import { SyncPlugin } from './plugins/SyncPlugin';
import SelectPlugin from './SelectPlugin';
import SlashMenuPlugin from './slashMenu/SlashMenuPlugin';
import { FocusTitlePlugin } from './subpages/FocusTitlePlugin';
import { SubpagePlugin } from './subpages/SubpagePlugin';
import TablePlugins from './TablePlugins';
import { UserSettings } from './Types';
import { injectSpreadsheet } from './ui/renderLaTeXAsHTML';

interface BuildEditorPluginsProps {
  schema: Schema;
  userSettings?: UserSettings;
  readOnly?: boolean;
  theme?: ThemeMode;
  isTemplate?: boolean;
}

const SLASH_MENU = 'slash-menu';
const LOCAL_STORAGE_CLEANER = 'local-storage-cleaner';
const MENTIONS_PLUGIN = 'mentions-plugin';
const TABLE_PLUGINS = 'table-plugins';
const INSERT_LINK_OR_ENTER = 'insert-link-or-enter';
const CONTENT_PLACEHOLDER = 'content-placeholder';
const CURSOR_PLACEHOLDER = 'cursor-placeholder';
const EDITOR_PAGE_LAYOUT = 'editor-page-layout';
const LINK_TOOLTIP = 'link-tooltip';
const COMMENTS_POPUP = 'comments-popup';
const SELECT_PLUGIN = 'select-plugin';
const MATH_PLUGIN = 'math-plugin';
const MATH_KEY_MAP = 'math-keymap';
const INPUT_RULES = 'input-rules';
const GAP_CURSOR = 'gap-cursor';
const TEXT_BLOCK_HANDLE = 'text-block-handle';
const MULTIPLE_SELECTION = 'multiple-selection';
const DROP_CURSOR = 'drop-cursor';
const EDITOR_KEY_MAP = 'editor-key-map';
const BASE_KEYMAP = 'base-keymap';
const END_WITH_TEXTBLOCK = 'end-with-textblock';
const SELECTION_TRACKER = 'selection-tracker';
const FLOATING_TOOLBAR = 'floating-toolbar';
const TRANSFORM_PASTED_SLICE = 'transform-pasted-slice';
const CODE_BLOCK = 'code-block';
const CODE_BLOCK_KEY_MAP = 'code-block-key-map';
const SUBPAGE = 'subpage';
const FOCUS_TITLE = 'focus-title';
const DOC_PLACEHOLDERS = 'doc-placeholders';
const SYNC_PLUGIN = 'sync-plugin';

// plugins loading order is very important, before making any changes to the plugins priority make sure that everything works well
const pluginsMap: {
  [pluginName: string]: {
    getPlugin: (props: BuildEditorPluginsProps) => Plugin | Plugin[];
    priority: number;
  };
} = {
  [SLASH_MENU]: { getPlugin: () => SlashMenuPlugin, priority: 1 },
  [LOCAL_STORAGE_CLEANER]: { getPlugin: () => LocalstorageCleanerPlugin, priority: 3 },
  [MENTIONS_PLUGIN]: { getPlugin: () => MentionsMenuPlugin(), priority: 4 },
  [TABLE_PLUGINS]: {
    getPlugin: ({ userSettings, readOnly, isTemplate }) => TablePlugins(userSettings, readOnly, isTemplate),
    priority: 5
  },
  [INSERT_LINK_OR_ENTER]: { getPlugin: () => InsertLinkOnEnter, priority: 6 },
  [CONTENT_PLACEHOLDER]: { getPlugin: () => new ContentPlaceholderPlugin(), priority: 7 },
  [CURSOR_PLACEHOLDER]: { getPlugin: () => new CursorPlaceholderPlugin(), priority: 8 },
  [EDITOR_PAGE_LAYOUT]: { getPlugin: () => new EditorPageLayoutPlugin(), priority: 9 },
  [LINK_TOOLTIP]: { getPlugin: () => new LinkTooltipPlugin(), priority: 10 },
  [COMMENTS_POPUP]: { getPlugin: () => new CommentPopupPlugin(), priority: 11 },
  [SELECT_PLUGIN]: { getPlugin: () => SelectPlugin, priority: 12 },
  [MATH_PLUGIN]: {
    getPlugin: () => {
      injectSpreadsheet();
      return mathPlugin;
    },
    priority: 13
  },
  [MATH_KEY_MAP]: {
    getPlugin: ({ schema }) =>
      keymap({
        'Mod-Space': insertMathCmd(schema.nodes.math_inline)
      }),
    priority: 13.5
  },
  [INPUT_RULES]: { getPlugin: ({ schema }) => buildInputRules(schema), priority: 14 },
  [GAP_CURSOR]: { getPlugin: () => gapCursor(), priority: 15 },
  [TEXT_BLOCK_HANDLE]: { getPlugin: () => textBlockHandle(), priority: 16 },
  [MULTIPLE_SELECTION]: { getPlugin: () => createMultipleSelectionPlugin(), priority: 17 },
  [DROP_CURSOR]: { getPlugin: () => DropCursorPlugin, priority: 18 },
  [EDITOR_KEY_MAP]: { getPlugin: () => keymap(createEditorKeyMap()), priority: 19 },
  [BASE_KEYMAP]: { getPlugin: () => keymap(getBaseKeymap()), priority: 20 },
  [END_WITH_TEXTBLOCK]: { getPlugin: () => endWithTextBlock(), priority: 21 },
  [SELECTION_TRACKER]: { getPlugin: () => SelectionTracker(), priority: 22 },
  [FLOATING_TOOLBAR]: { getPlugin: () => floatingToolbarPlugin(), priority: 23 },
  [TRANSFORM_PASTED_SLICE]: { getPlugin: () => transformPastedSlice(), priority: 24 },
  [CODE_BLOCK]: {
    getPlugin: ({ theme = ThemeMode.LIGHT, readOnly = false }) => codeBlockPlugin(codeblockSettings(theme, readOnly)),
    priority: 25
  },
  [CODE_BLOCK_KEY_MAP]: { getPlugin: () => keymap(codeBlockArrowHandlers), priority: 26 },
  [SUBPAGE]: { getPlugin: () => new SubpagePlugin(), priority: 27 },
  [FOCUS_TITLE]: { getPlugin: () => new FocusTitlePlugin(), priority: 28 },
  [DOC_PLACEHOLDERS]: {
    getPlugin: () => docPlaceholders('Title'),
    priority: 29
  },
  [SYNC_PLUGIN]: { getPlugin: () => new SyncPlugin(), priority: 30 }
};

const getAndSortPluginsByPriority = (pluginsNames: string[], pluginsProps: BuildEditorPluginsProps) =>
  pluginsNames
    .sort((a, b) => pluginsMap[a].priority - pluginsMap[b].priority)
    .map((p) => pluginsMap[p].getPlugin(pluginsProps))
    .flat();

export default function buildEditorPlugins({
  schema,
  userSettings,
  readOnly = false,
  isTemplate = false,
  theme
}: BuildEditorPluginsProps): Array<Plugin> {
  // sets CSS base name for tables
  setBaseName('skiff');
  const editOnlyPlugins = [TEXT_BLOCK_HANDLE, DROP_CURSOR, EDITOR_KEY_MAP, BASE_KEYMAP];
  const nonTemplatesPlugins = [FLOATING_TOOLBAR, MENTIONS_PLUGIN, COMMENTS_POPUP];

  const plugins = [
    SLASH_MENU,
    LOCAL_STORAGE_CLEANER,
    TABLE_PLUGINS,
    INSERT_LINK_OR_ENTER,
    CONTENT_PLACEHOLDER,
    CURSOR_PLACEHOLDER,
    EDITOR_PAGE_LAYOUT,
    LINK_TOOLTIP,
    SELECT_PLUGIN,
    MATH_PLUGIN,
    MATH_KEY_MAP,
    INPUT_RULES,
    GAP_CURSOR,
    MULTIPLE_SELECTION,
    END_WITH_TEXTBLOCK,
    SELECTION_TRACKER,
    TRANSFORM_PASTED_SLICE,
    CODE_BLOCK,
    CODE_BLOCK_KEY_MAP,
    SUBPAGE,
    FOCUS_TITLE,
    DOC_PLACEHOLDERS,
    SYNC_PLUGIN
  ];

  if (!readOnly) {
    plugins.push(...editOnlyPlugins);
  }

  if (!isTemplate) {
    plugins.push(...nonTemplatesPlugins);
  }

  return getAndSortPluginsByPriority(plugins, { schema, userSettings, readOnly, theme });
}
