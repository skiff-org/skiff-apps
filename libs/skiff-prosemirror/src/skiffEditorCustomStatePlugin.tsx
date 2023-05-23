import { Icon, ThemeMode } from 'nightwatch-ui';
import { Node } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey } from 'prosemirror-state';

import { MentionSuggestions } from './mentionsMenu/utils';
import { AnchorTypes } from './utils/deeplink';
export interface UserData {
  name: string;
  userID: string;
}

// TODO copied types from react-client
// need to create shared types
export type TemplateMetaData = {
  title: string;
  icon?: Icon;
  color?: string;
  description?: string;
};

export type TemplateDocData = {
  metaData: TemplateMetaData;
  pmDoc: Node;
  parentID?: string;
  ID: string;
};

export interface DeepLinkMeta {
  type: AnchorTypes;
  id: string;
}
export interface EditorCustomState {
  currentUser: UserData;
  createInlineDoc: ((docName: string) => any) | null;
  setSubpageDocID: ((docID: string) => any) | null;
  createCacheElement: ((cacheData: ArrayBuffer, type: string) => Promise<string>) | null;
  isPublicDocument: boolean;
  getMentionSuggestions: (query: string) => Promise<MentionSuggestions>;
  onComment: (commenters?: string[], commentID?: string) => void | Promise<void>;
  onMention: (mentionedUser: string, mentionId: string, inComment?: boolean) => void | Promise<void>;
  docID: string | undefined;
  theme: ThemeMode;
  collabsDisplayNamesMap: { [userID: string]: string } | null;
  useDocumentCollabDisplayNames: (docId: string) => { collabsDisplayName: { [userID: string]: string } | null };
  deeplink?: DeepLinkMeta;
  curDocumumentLink?: string;
  setCommentsSidepanel: (open: boolean) => void;
  triggerToast: (icon: Icon) => void;
  setConfirmState: React.Dispatch<React.SetStateAction<any>>;
  changePermissions: (userID: string) => void;
  readOnly: boolean;
  documentChildrenIDs: string[];
  templatesFunctions?: {
    navigateTemplateWizard: null | ((docID: string) => void);
    setTemplateDocIcon: (docID: string, icon: Icon, color: string) => void;
    getTemplateDocument?: (templateID: string) => TemplateDocData;
  };
}

export const customStateKey = new PluginKey<EditorCustomState>('editorState');
export const getCustomState = (editorState: EditorState) => {
  const pluginState = customStateKey.getState(editorState);
  if (!pluginState) {
    throw new Error('editorCustomStatePlugin not found');
  }
  return pluginState;
};

export const EditorCustomStatePlugin = (initalState: EditorCustomState) =>
  new Plugin<EditorCustomState>({
    key: customStateKey,
    state: {
      init: () => initalState,
      apply(_tr, value) {
        return value;
      }
    }
  });
