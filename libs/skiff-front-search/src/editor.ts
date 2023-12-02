import { expose } from 'comlink';

import { createSearchIndexType } from './searchIndex';
import { editorSearchIndexIDBKey, IndexedDocument, SearchClient } from './types';

export const EditorSearchIndex = createSearchIndexType<IndexedDocument, null>(
  SearchClient.EDITOR,
  {
    fields: ['title', 'content', 'updatedAt', 'contentType'],
    // title needed for @ mentions to work
    storeFields: ['id', 'contentType', 'updatedAt', 'title']
  },
  editorSearchIndexIDBKey,
  null
);

expose(EditorSearchIndex);
