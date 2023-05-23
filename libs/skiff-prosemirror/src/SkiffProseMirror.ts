import { TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { syncPluginKey } from './plugins/SyncPlugin';
import CustomEditorView from './ui/CustomEditorView';
import UICommand from './ui/UICommand';

const commandsRegistery = new Map();
const viewsRegistery = new Map();
export function registeryKeys(): Array<string> {
  return Array.from(viewsRegistery.keys());
}

// Help verify that document is ready and Yjs doc synced with the editor,
// helps on e2e to be sure doc is ready before start tests
export function checkYjsSynced(id?: string | null): boolean {
  if (!id && viewsRegistery.size) {
    id = registeryKeys()[0];
  }

  const view = viewsRegistery.get(String(id));

  if (!view) {
    return false;
  }

  return !!syncPluginKey.getState(view.state)?.synced;
}

export function exportJSON(id?: string | null): Record<string, any> {
  if (!id && viewsRegistery.size) {
    id = registeryKeys()[0];
    console.log(`use default editor id "${id}"`);
  }

  const view = viewsRegistery.get(String(id));

  if (!view) {
    throw new Error('view ${id} does not exist');
  }

  return view.state.doc.toJSON();
}
export function registerEditorView(id: string, view: EditorView): void {
  if (viewsRegistery.has(id)) {
    throw new Error('view ${id} already registered');
  }

  if (!(view instanceof CustomEditorView)) {
    throw new Error(`invalid view ${id}`);
  }

  if (!id) {
    throw new Error('id is required');
  }

  viewsRegistery.set(id, view);
}
export function releaseEditorView(id: string): void {
  if (!viewsRegistery.has(id)) {
    // throw new Error('view ${id} was released');
    console.error('View was released?');
  } else {
    viewsRegistery.delete(id);
  }
}
export function findEditorView(id: string): EditorView | null {
  return viewsRegistery.get(id) || null;
}
export function executeCommand(name: string, viewID?: string | null): boolean {
  const command = commandsRegistery.get(name);

  if (command) {
    const view = viewID ? viewsRegistery.get(viewID) : Array.from(viewsRegistery.values())[0];

    if (view) {
      try {
        return command.execute(view.state, view.dispatch, view, null);
      } catch (ex) {
        console.warn(ex);
        return false;
      }
    }
  }

  return false;
}
export function registerCommand(name: string, command: UICommand): void {
  if (!(command instanceof UICommand)) {
    throw new Error(`invalid command ${name}`);
  }

  if (!name) {
    throw new Error('invalid command name');
  }

  if (commandsRegistery.has(name)) {
    throw new Error('command ${name} already registered');
  }

  commandsRegistery.set(name, command);
}

/**
 * Returns [view, { useful Prosemirror classes }].
 *
 * Used in end-to-end tests to manipulate the editor state.
 */
export function getViewAndClasses(id?: string | null) {
  if (!id && viewsRegistery.size) {
    id = registeryKeys()[0];
  }

  const view = viewsRegistery.get(String(id));

  if (!view) {
    throw new Error('view with id not found');
  }

  return [view, { TextSelection }];
}
