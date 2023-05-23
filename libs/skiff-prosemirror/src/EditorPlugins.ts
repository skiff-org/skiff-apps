import buildEditorPlugins from './buildEditorPlugins';
import EditorSchema from './EditorSchema';
import { UserSettings } from './Types';
// Plugin
const EditorPlugins = (userSettings?: UserSettings) => buildEditorPlugins({ schema: EditorSchema, userSettings });
export default EditorPlugins;
