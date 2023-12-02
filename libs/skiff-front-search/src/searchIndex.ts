import * as IDB from 'idb-keyval';
import debounce from 'lodash/debounce';
import MiniSearch, { AsPlainObject, Options, SearchOptions } from 'minisearch';
import { Range } from 'semver';
import { createRawCompressedJSONDatagram, generateSymmetricKey } from 'skiff-crypto';

import { decryptSearchIndex, encryptSearchIndex } from './encryption';
import { DateRangeFilter, IndexedItemBase, MiniSearchResult, SearchClient } from './types';
import {
  chronSortResults,
  getCustomDateFilter,
  getDefaultSearchOptions,
  getSortableSearchResults
} from './utils';

interface StoredSearchIndex<T extends IndexedItemBase, IndexMetadata> {
  serializedIndex: AsPlainObject;
  indexMetadata: IndexMetadata;
  idToUpdatedAt: { [id: string]: number };
}

const NUM_RECENT = 10;

export const createSearchIndexType = <IndexedItem extends IndexedItemBase, IndexMetadata>(
  type: SearchClient,
  minisearchOptions: Options<IndexedItem>,
  searchIndexIDBKey: (userID: string) => string,
  defaultMetadata: IndexMetadata
) => {
  const searchIndexDatagram = createRawCompressedJSONDatagram<StoredSearchIndex<IndexedItem, IndexMetadata>>(
    `ddl://skiff/${type}SearchIndexDatagram`,
    '0.8.0',
    new Range('0.8.*')
  );

  return class SearchIndex {
    static async loadOrCreate(userID: string, userKeys: { publicKey: string; privateKey: string }) {
      const encryptedSearchData = await IDB.get(searchIndexIDBKey(userID));

      return new SearchIndex(userID, userKeys, encryptedSearchData);
    }

    static searchIndexIDBKey = searchIndexIDBKey;

    public symmetricKey: string;

    public miniSearch: MiniSearch<IndexedItem>;

    public metadata: IndexMetadata;

    public idToUpdatedAt: { [id: string]: number } = {};

    // should not be called directly, instead of .loadOrCreate
    constructor(
      public userID: string,
      public userKeys: { publicKey: string; privateKey: string },
      encryptedSearchData: any
    ) {
      if (encryptedSearchData) {
        try {
          const decryptedSearchData = decryptSearchIndex(
            encryptedSearchData,
            userKeys.publicKey,
            userKeys.privateKey,
            searchIndexDatagram
          );
          this.miniSearch = MiniSearch.loadJS<IndexedItem>(
            decryptedSearchData.searchIndex.serializedIndex,
            minisearchOptions
          );
          this.symmetricKey = decryptedSearchData.symmetricKey;
          this.metadata = decryptedSearchData.searchIndex.indexMetadata || defaultMetadata;
          this.idToUpdatedAt = decryptedSearchData.searchIndex.idToUpdatedAt || {};
          return;
        } catch (e) {
          console.error(`Error while decrypting or loading ${type} search index, cleaning out state`, e);
          void IDB.del(searchIndexIDBKey(userID));
        }
      }
      this.miniSearch = new MiniSearch<IndexedItem>(minisearchOptions);
      this.symmetricKey = generateSymmetricKey();
      this.metadata = defaultMetadata;
    }

    save = debounce(
      async () => {
        await this.miniSearch.vacuum();
        await IDB.set(
          searchIndexIDBKey(this.userID),
          encryptSearchIndex(
            {
              serializedIndex: this.miniSearch.toJSON(),
              indexMetadata: this.metadata,
              idToUpdatedAt: this.idToUpdatedAt
            },
            this.userKeys.publicKey,
            this.userKeys.privateKey,
            this.symmetricKey,
            searchIndexDatagram
          )
        );
        console.log('SAVED index');
      },
      5_000,
      {
        maxWait: 30_000 // save every 30s max
      }
    );

    setMetadata(newMetadata: Partial<IndexMetadata>) {
      this.metadata = Object.assign({}, this.metadata, newMetadata);
      void this.save();
    }

    isIndexed(item: IndexedItem) {
      return this.miniSearch.has(item.id);
    }

    add(item: IndexedItem) {
      try {
        this.miniSearch.add(item);
      } catch (error) {
        this.miniSearch.discard(item.id);
        this.miniSearch.add(item);
      }
      this.idToUpdatedAt[item.id] = item.updatedAt;
      void this.save();
    }

    remove(id: string) {
      try {
        this.miniSearch.discard(id);
        delete this.idToUpdatedAt[id];
        void this.save();
      } catch (error) {
        console.error('Error removing item from miniSearch index', error);
      }
    }

    getRecentItems(): IndexedItemBase[] {
      // find most recent ids from this.idToUpdatedAt
      const recentIds = Object.entries(this.idToUpdatedAt)
        .sort((a, b) => b[1] - a[1])
        .map((entry) => entry[0])
        .slice(0, NUM_RECENT);
      return recentIds.map((id) => ({ id, updatedAt: this.idToUpdatedAt[id] }));
    }

    search(
      query: string,
      searchClient: SearchClient,
      options?: SearchOptions,
      dateRangeFilter?: DateRangeFilter,
      sort?: boolean,
      autoSuggest?: boolean,
      // whether to return only results that match on all terms in query if possible;
      // results in tighter result pools better suited to e.g. chronological sorting
      preferFullMatches?: boolean
    ): IndexedItemBase[] | MiniSearchResult[] {
      if (!query) {
        return this.getRecentItems();
      }

      const defaultSearchOptions = getDefaultSearchOptions(searchClient, query, dateRangeFilter);

      const customOptions = {
        // ensure there are fallbacks for fuzzy and prefix if none specified in custom options
        fuzzy: defaultSearchOptions.fuzzy,
        prefix: defaultSearchOptions.prefix,
        ...options,
        // we create the custom filtering function here rather than passing it in from a client
        // to avoid passing a non-clonable function to web worker
        ...(dateRangeFilter ? { filter: getCustomDateFilter(dateRangeFilter) } : {})
      };

      const searchOptions = options ? customOptions : defaultSearchOptions;
      const andedResults = preferFullMatches
        ? this.miniSearch.search(query, {
          ...searchOptions,
          combineWith: 'AND'
        })
        : [];
      // if there are results that match on all terms in the query, return only those; otherwise, widen the search to the default "OR" behavior
      const miniSearchResults = andedResults.length ? andedResults : this.miniSearch.search(query, searchOptions);

      if (autoSuggest) {
        console.log('suggest', this.miniSearch.autoSuggest(query, searchOptions));
      }

      const sortableResults = getSortableSearchResults(miniSearchResults);

      return sort ? chronSortResults(sortableResults) : sortableResults;
    }

    prune(existingIds: string[]) {
      const jsonIndex = this.miniSearch.toJSON();
      const allDocIDs = Object.values(jsonIndex.documentIds) as Array<string>;
      const idsToPrune = allDocIDs.filter((id) => !existingIds.includes(id));
      idsToPrune.forEach((idToPrune) => {
        try {
          this.miniSearch.discard(idToPrune);
        } catch (error) {
          console.error('Error removing item from miniSearch index', error);
        }
      });
      return idsToPrune;
    }

    // return the docIDs of documents not in the index or out-of-date from the source list provided
    listStaleOrMissing(itemUpdatedAt: { id: string; updatedAt: number }[]) {
      const staleItems = itemUpdatedAt.filter((doc) => {
        const hasIndexedItem = this.miniSearch.has(doc.id);
        const curUpdatedAt = this.idToUpdatedAt[doc.id];
        if (!hasIndexedItem || (doc.updatedAt && doc.updatedAt > curUpdatedAt)) {
          return true;
        }
        return false;
      });

      return staleItems.map((doc) => doc.id);
    }
  };
};
