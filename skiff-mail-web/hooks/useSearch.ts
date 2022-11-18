import { useEffect, useRef, useState } from 'react';
import { useDebouncedAsyncCallback } from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import { useGetUserContactListQuery, useUserLabelsQuery } from 'skiff-mail-graphql';
import { trimAndLowercase, POLL_INTERVAL_IN_MS } from 'skiff-utils';

import { useRequiredCurrentUserData } from '../apollo/currentUser';
import { AttachmentStates, ClientAttachment, isInline } from '../components/Attachments';
import { MIN_SPECIFIED_QUERY_LENGTH, RECENT_SEARCH_WINDOW } from '../components/shared/CmdPalette/constants';
import { sortByName, userLabelFromGraphQL, splitUserLabelsAndFolders, SYSTEM_LABELS } from '../utils/label';
import {
  filterSearchResults,
  SearchFilter,
  SearchItemType,
  SearchSkemail,
  SearchFilterType,
  SearchCategoryType,
  SearchCategory,
  SearchQuery,
  toFromSearch,
  getFilterRows,
  getFilterTypesToHide,
  hideFilters
} from '../utils/searchWorkerUtils';

import { useCurrentLabel } from './useCurrentLabel';
import { useDefaultEmailAlias } from './useDefaultEmailAlias';
import { getSearchWorker } from './useSearchWorker';

// The interval at which to update search results based on a query (MS)
export const SEARCH_UPDATE_INTERVAL = 250;

// The number of to and from results to show if  query length is less than MIN_SPECIFIED_QUERY_LENGTH
export const UNSPECIFIED_TO_FROM_LENGTH = 2;

export const useSearch = () => {
  const { userID } = useRequiredCurrentUserData();
  const currentRouteLabel = useCurrentLabel();

  const [skemails, setSkemails] = useState<Array<SearchSkemail>>([]);
  const [recentSkemails, setRecentSkemails] = useState<Array<SearchSkemail>>([]);
  const [attachmentResults, setAttachmentResults] = useState<Array<SearchCategory>>([]);

  const [toAddressResults, setToAddressResults] = useState<AddressObject[]>([]);
  const [fromAddressResults, setFromAddressResults] = useState<AddressObject[]>([]);

  // need a ref because search is triggered by setTimeout, which does not get the latest state
  // read more about it: https://stackoverflow.com/questions/55198517/react-usestate-why-settimeout-function-does-not-have-latest-state-value
  const [query, setQuery] = useState('');
  const queryRef = useRef(query);

  // Labels, other activeFilters that can be applied along with plain text
  const [activeFilters, setActiveFilters] = useState<Array<SearchFilter>>([]);
  // Reverse ordered list of recent search terms.
  const [recentSearches, setRecentSearches] = useState<SearchQuery[]>([]);

  const [loading, setLoading] = useState(false);

  const [workerSearch] = useDebouncedAsyncCallback(async (currentQuery: string) => {
    const searchResults = (await getSearchWorker()?.search(currentQuery, undefined, !!activeFilters.length)) || [];
    const filteredAttachmentSkemailResults =
      (await getSearchWorker()?.search(currentQuery, { fields: ['attachments'] })) || [];
    const toFromSearchResults = await toFromSearch(currentQuery);

    const filteredResults = filterSearchResults(searchResults, activeFilters);
    const subjectResults = filteredResults.filter((result) =>
      result.subject.toLowerCase().includes(query.toLowerCase())
    );
    const orderedResults = [...subjectResults, ...filteredResults.filter((result) => !subjectResults.includes(result))];
    setSkemails(orderedResults.map((result) => ({ ...result, itemType: SearchItemType.Skemail })));

    const attachmentSkemailResults: SearchSkemail[] = filteredAttachmentSkemailResults.map((result) => ({
      ...result,
      itemType: SearchItemType.Skemail
    }));
    const attachmentInfoResults: SearchCategory[] = [];
    attachmentSkemailResults.forEach((result) => {
      const clientAttachments: ClientAttachment[] =
        result.attachments?.map((attachment) => {
          const contentType = attachment.decryptedMetadata?.contentType ?? '';
          const filename = attachment.decryptedMetadata?.filename ?? '';
          const size = attachment.decryptedMetadata?.size ?? 0;
          const contentId = attachment.decryptedMetadata?.contentId ?? '';
          return {
            state: AttachmentStates.Remote,
            id: attachment.attachmentID,
            contentType,
            name: filename,
            size,
            contentID: contentId,
            inline: !!isInline(attachment)
          };
        }) ?? [];
      result.attachments?.forEach((attachment, index) => {
        const filename = attachment.decryptedMetadata?.filename ?? '';
        const filetype = attachment.decryptedMetadata?.contentType ?? '';
        const filesize = attachment.decryptedMetadata?.size;
        if (filename.includes(currentQuery)) {
          attachmentInfoResults.push({
            itemType: SearchItemType.Category,
            subject: filename,
            categoryInfo: {
              categoryType: SearchCategoryType.Attachments,
              fileName: filename,
              fileType: filetype,
              fileSize: filesize,
              email: result,
              index,
              clientAttachments
            }
          });
        }
      });
    });
    setAttachmentResults(attachmentInfoResults);

    const getUniqueAddresses = (addresses: AddressObject[]): AddressObject[] => {
      return addresses.reduce((uniqueAddresses: AddressObject[], addr) => {
        if (!uniqueAddresses.some(({ address }) => addr.address === address)) {
          uniqueAddresses.push(addr);
        }
        return uniqueAddresses;
      }, []);
    };
    const fromAddresses: AddressObject[] = toFromSearchResults
      .map((email) => email.from)
      .filter(
        (address) =>
          trimAndLowercase(address.address).includes(trimAndLowercase(currentQuery)) ||
          trimAndLowercase(address.name ?? '').includes(trimAndLowercase(currentQuery))
      );
    setFromAddressResults(
      currentQuery.length < MIN_SPECIFIED_QUERY_LENGTH
        ? getUniqueAddresses(fromAddresses).slice(0, UNSPECIFIED_TO_FROM_LENGTH)
        : getUniqueAddresses(fromAddresses)
    );
    // Use flatMap because it is possible there are multiple to addresses for each skemail
    const toAddresses: AddressObject[] = toFromSearchResults
      .flatMap((email) => email.to.concat(email.cc, email.bcc))
      .filter(
        (address) =>
          trimAndLowercase(address.address).includes(trimAndLowercase(currentQuery)) ||
          trimAndLowercase(address.name ?? '').includes(trimAndLowercase(currentQuery))
      );
    setToAddressResults(
      currentQuery.length < MIN_SPECIFIED_QUERY_LENGTH
        ? getUniqueAddresses(toAddresses).slice(0, UNSPECIFIED_TO_FROM_LENGTH)
        : getUniqueAddresses(toAddresses)
    );

    setLoading(false);
  }, SEARCH_UPDATE_INTERVAL);

  const search = () => {
    setLoading(true);
    void workerSearch(queryRef.current || '');
  };

  const reset = () => {
    setQuery('');
    queryRef.current = '';
    search();
  };

  const searchForQuery = (currentQuery: string) => {
    setQuery(currentQuery);
    queryRef.current = currentQuery;
    search();
  };

  // Populate recent skemails for an empty query
  useEffect(() => {
    const getRecentSkemails = async () => {
      const res = await getSearchWorker()?.search('');
      setRecentSkemails(res?.map((result) => ({ ...result, itemType: SearchItemType.Skemail })) || []);
    };
    void getRecentSkemails();
  }, []);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const filtersMatch = (filterA: SearchFilter[], filterB: SearchFilter[]) => {
    const filterSubjectsA = filterA.map((filter) => filter.subject);
    const filterSubjectsB = filterB.map((filter) => filter.subject);
    return (
      filterSubjectsA.every((subject) => filterSubjectsB.includes(subject)) &&
      filterSubjectsB.every((subject) => filterSubjectsA.includes(subject))
    );
  };
  const recentSearchesMatchingQuery = recentSearches.filter((recentSearch) => {
    return trimAndLowercase(recentSearch.subject).includes(trimAndLowercase(query));
  });

  // Filter out queries that match searches which are more recent and filter out queries that match the current search term
  const filteredRecentSearches = recentSearchesMatchingQuery
    .filter((recent, index) => {
      const isDuplicate = recentSearchesMatchingQuery.some((otherRecent, otherIndex) => {
        const recentsMatch =
          recent.subject === otherRecent.subject && filtersMatch(recent.filters, otherRecent.filters);
        return index > otherIndex && recentsMatch;
      });
      const isCurrentSearch = recent.subject === query && filtersMatch(recent.filters, activeFilters);
      return !isDuplicate && !isCurrentSearch;
    })
    .slice(0, RECENT_SEARCH_WINDOW);

  /** Filters Options */

  // GraphQL
  const { data: userLabelData, error: userLabelError } = useUserLabelsQuery();
  const userLabels = userLabelData?.userLabels ?? [];
  const [userLabelsList, userFoldersList] = splitUserLabelsAndFolders(
    userLabelData?.userLabels?.map(userLabelFromGraphQL).sort(sortByName) ?? []
  );

  const { data: contactListData, error: contactListError } = useGetUserContactListQuery({
    variables: {
      request: {
        userID
      }
    },
    pollInterval: POLL_INTERVAL_IN_MS
  });
  const contactList = contactListData?.user?.contactList ?? [];
  const contactListSearchResults: SearchCategory[] = contactList
    .filter(
      (info) =>
        info.name?.toLowerCase().includes(query.toLowerCase()) ||
        info.address.toLowerCase().includes(query.toLowerCase())
    )
    .map((info) => ({
      itemType: SearchItemType.Category,
      subject: info.address,
      categoryInfo: {
        categoryType: SearchCategoryType.Contact,
        address: info.address,
        displayName: info.name
      }
    }));

  const labelListSearchResuls: SearchCategory[] = userLabelsList
    .filter((label) => label.name.toLowerCase().includes(query.toLowerCase()))
    .map((label) => ({
      itemType: SearchItemType.Category,
      subject: label.name,
      categoryInfo: {
        categoryType: SearchCategoryType.Labels,
        name: label.name,
        color: label.color,
        variant: label.variant
      }
    }));

  const folderListSearchResults: SearchCategory[] = userFoldersList
    .filter((folder) => folder.name.toLowerCase().includes(query.toLowerCase()))
    .map((folder) => ({
      itemType: SearchItemType.Category,
      subject: folder.name,
      categoryInfo: {
        categoryType: SearchCategoryType.Folders,
        name: folder.name,
        color: folder.color,
        variant: folder.variant
      }
    }));

  if (userLabelError) {
    console.error(`Failed to retrieve User's labels`, JSON.stringify(userLabelError, null, 2));
  }
  if (contactListError) {
    console.error(`Failed to retrieve User's contact list`, JSON.stringify(contactListError, null, 2));
  }

  // Array filter helpers
  const notActiveLabelFilter = (label: string) => !activeFilters.map((filter) => filter.subject).includes(label);

  // note this will filter TO/FROM the same person, i.e. can't search for emails to self.
  const notActiveAddressFilter = (label: AddressObject) =>
    !activeFilters.map((filter) => filter.subject).includes(label.name ?? label.address);

  const filterTypesToHide: SearchFilterType[] = getFilterTypesToHide(activeFilters);
  const addressInQuery = (addressObj: AddressObject): boolean =>
    addressObj.address.toLowerCase().includes(query.toLowerCase()) ||
    addressObj.name?.toLowerCase().includes(query.toLowerCase()) ||
    false;

  // User labels
  const userLabelFilters: SearchFilter[] = userLabels
    .filter((label) => label.labelName.toLowerCase().includes(query.toLowerCase()))
    .filter((userLabel) => notActiveLabelFilter(userLabel.labelName))
    .map((label) => ({
      itemType: SearchItemType.Filter,
      subject: `${label.labelName}`,
      filter: {
        filterType: SearchFilterType.UserLabel,
        filterValue: label.labelName
      }
    }));
  // System labels
  const systemLabelFilters: SearchFilter[] = SYSTEM_LABELS.filter((label) =>
    label.name.toLowerCase().includes(query.toLowerCase())
  )
    .filter((label) => notActiveLabelFilter(label.name))
    .map((label) => ({
      itemType: SearchItemType.Filter,
      subject: label.name,
      filter: {
        filterType: SearchFilterType.SystemLabel,
        filterValue: label.value
      }
    }));
  if (currentRouteLabel) {
    systemLabelFilters.push({
      itemType: SearchItemType.Filter,
      subject: `${currentRouteLabel}`,
      query,
      filter: {
        filterType: SearchFilterType.SystemLabel,
        filterValue: currentRouteLabel
      }
    });
  }

  // From addresses
  const addressFromFilters: SearchFilter[] = fromAddressResults
    .filter(notActiveAddressFilter)
    .filter(addressInQuery)
    .map((contact) => ({
      itemType: SearchItemType.Filter,
      subject: `${contact.name || contact.address}`,
      filter: {
        filterType: SearchFilterType.FromAddress,
        filterValue: contact
      }
    }));
  // To addresses
  const addressToFilters: SearchFilter[] = toAddressResults
    .filter(notActiveAddressFilter)
    .filter(addressInQuery)
    .map((contact) => ({
      itemType: SearchItemType.Filter,
      subject: `${contact.name || contact.address}`,
      filter: {
        filterType: SearchFilterType.ToAddress,
        filterValue: contact
      }
    }));

  const allFilterOptions = query
    ? [...userLabelFilters, ...systemLabelFilters, ...addressFromFilters, ...addressToFilters]
    : [];

  const filterOptions = hideFilters(allFilterOptions, filterTypesToHide);
  const [defaultEmailAlias] = useDefaultEmailAlias();
  const filterRows = getFilterRows(filterTypesToHide, defaultEmailAlias);

  const getSkemailSearchResults = () => {
    if (activeFilters.some((filter) => filter.filter.filterType === SearchFilterType.Category)) {
      return [];
    }
    if (!!query || activeFilters.length) {
      return skemails;
    }
    return recentSkemails;
  };
  return {
    query,
    loading,
    skemails: getSkemailSearchResults(),
    contactList: contactListSearchResults,
    attachmentList: attachmentResults,
    labelList: labelListSearchResuls,
    folderList: folderListSearchResults,
    filterOptions,
    filterRows,
    activeFilters,
    userLabels,
    recentSearches: filteredRecentSearches,
    reset,
    search,
    setQuery,
    setRecentSearches,
    setActiveFilters,
    searchForQuery
  };
};
