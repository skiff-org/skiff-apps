import { Plugin, PluginKey } from 'prosemirror-state';
import { ySyncPluginKey } from 'y-prosemirror';

export type SyncPluginAttrs = {
  synced: boolean;
};

export const syncPluginKey = new PluginKey<SyncPluginAttrs>('sync-plugin');

/**
 * Keeps track on ySyncPlugin (yjs plugin).
 * If ySyncPlugin wasn't synced, and then synced - fires empty transaction
 */
export class SyncPlugin extends Plugin<SyncPluginAttrs> {
  constructor() {
    super({
      key: syncPluginKey,
      state: {
        init() {
          return {
            synced: false
          };
        },
        apply(_tr, _syncState, _oldState, newState) {
          const { binding } = ySyncPluginKey.getState(newState) || { binding: false };
          return {
            synced: !!binding
          };
        }
      },
      appendTransaction(_, oldState, newState) {
        const oldSyncState = syncPluginKey.getState(oldState);
        const newSyncState = syncPluginKey.getState(newState);
        if (!oldSyncState?.synced && newSyncState?.synced) {
          const { tr } = newState;
          return tr;
        }
        return null;
      }
    });
  }
}
