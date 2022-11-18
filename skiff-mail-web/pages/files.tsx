import { NetworkStatus } from '@apollo/client';
import { isEqual } from 'lodash';
import { ChangeEvent, memo, useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import Autosizer from 'react-virtualized-auto-sizer';
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import {
  FilePreviewData,
  FileTableHeader,
  FileTableRow,
  FileTypeFilter,
  getIconFromMIMEType,
  MIMETypes,
  RecentlyViewedFiles,
  useTheme
} from 'skiff-front-utils';
import { MailboxFilters, UserThread, Email } from 'skiff-graphql';
import { useMailboxQuery } from 'skiff-mail-graphql';
import { filterExists } from 'skiff-utils';
import styled from 'styled-components';

import { ClientAttachment, inProgress, useAttachments } from '../components/Attachments';
import { DEFAULT_MAILBOX_LIMIT } from '../constants/mailbox.constants';
import { skemailModalReducer } from '../redux/reducers/modalReducer';
import { ModalType } from '../redux/reducers/modalTypes';
import { getNwContentType, getPreviewDataByType } from '../utils/attachmentsPreview';

const FilesPageContainer = styled.div`
  padding: 112px 64px;
  display: flex;
  flex-direction: column;

  width: 100%;
`;

// Number rendered will be controlled by width in skiff-front-utils/../RecentlyViewedFiles.tsx
// This const is used as an estimated max number and slice preview files accordingly
const MAX_RECENT_FILES_DISPLAYED = 10;

const ROW_HEIGHT = 70;

const QUERY_FILTERS: MailboxFilters = { attachments: true };

/**
 * Given an array of threads,
 * create a map that links attachment ids to their parent thread and email
 */
const generateAttachmentToThreadAndEmailMap = (
  threads: UserThread[]
): Map<string, { thread: UserThread; email: Email }> => {
  const attachmentIDtoThreadAndEmailMap = new Map<string, { thread: UserThread; email: Email }>();

  threads.forEach((thread) => {
    thread.emails.forEach((email) => {
      email.decryptedAttachmentMetadata?.forEach((attachment) => {
        attachmentIDtoThreadAndEmailMap.set(attachment.attachmentID, { thread, email });
      });
    });
  });

  return attachmentIDtoThreadAndEmailMap;
};

interface AttachmentItemData {
  attachments: ClientAttachment[];
  fetchAttachments: (ids: string[], fetchFailed?: boolean | undefined) => Promise<void>;
  attachmentIDtoThreadMap: Map<
    string,
    {
      thread: UserThread;
      email: Email;
    }
  >;
  openAttachmentsPreviewModal: (
    attachmentIndex: number,
    thread: UserThread | undefined,
    email: Email | undefined
  ) => void;
}

const AttachmentItem = memo(
  (props: ListChildComponentProps<AttachmentItemData>) => {
    const { index, style, data: listData } = props;
    const { attachments: attachmentsData, attachmentIDtoThreadMap, openAttachmentsPreviewModal } = listData;
    const attachment = attachmentsData[index];

    const { id, name, contentType, size } = attachment;
    const { thread, email } = attachmentIDtoThreadMap.get(id) ?? {};

    const nwContentType = getNwContentType(contentType);

    return (
      <div key={id} style={style}>
        <FileTableRow
          contentType={nwContentType}
          createdAt={email?.createdAt}
          onClick={() => openAttachmentsPreviewModal(index, thread, email)}
          previewProps={{
            data: getPreviewDataByType(attachment),
            contentType: nwContentType,
            mimeType: contentType,
            fileName: attachment.name,
            tryToOpenProtectedPdf: false
          }}
          progress={inProgress(attachment) ? attachment.progress : undefined}
          size={size}
          title={name}
          userLabels={thread?.attributes.userLabels}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    const { data: prevData, index: prevIndex } = prevProps;
    const { data: nextData, index: nextIndex } = nextProps;

    const currentAttachmentPrevData = prevData.attachments[prevIndex];
    const currentAttachmentNextData = nextData.attachments[nextIndex];

    return isEqual(currentAttachmentPrevData, currentAttachmentNextData);
  }
);
AttachmentItem.displayName = 'AttachmentItem';

const FilesMailbox: React.FC = () => {
  const { theme } = useTheme();

  const dispatch = useDispatch();

  const [activeFileTypeFilter, setActiveFileTypeFilter] = useState<FileTypeFilter>(FileTypeFilter.All);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const { data, networkStatus, fetchMore } = useMailboxQuery({
    variables: {
      request: {
        limit: DEFAULT_MAILBOX_LIMIT,
        filters: QUERY_FILTERS,
        cursor: null
      }
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network'
  });

  const threads = data?.mailbox?.threads;

  const attachmentIDtoThreadMap = useMemo(
    () => generateAttachmentToThreadAndEmailMap(((threads ?? []) as UserThread[]) ?? []),
    [threads]
  );

  const loading = networkStatus === NetworkStatus.loading || networkStatus === NetworkStatus.refetch || !data;

  const threadAttachmentMetadata = threads?.flatMap((thread) =>
    thread.emails.flatMap((email) => email.decryptedAttachmentMetadata).filter(filterExists)
  );

  const { attachments, fetchAttachments } = useAttachments({ metadata: threadAttachmentMetadata });

  // Filter out less-relevant file types (types that do not appear in filter dropdown)
  const filteredAttachments = attachments.filter((attachment) =>
    Object.keys(FileTypeFilter).some((fileType) =>
      (MIMETypes[fileType] as string[] | undefined)?.includes(attachment.contentType)
    )
  );

  const openAttachmentsPreviewModal = useCallback(
    (attachmentIndex: number, thread: UserThread | undefined, email: Email | undefined) =>
      dispatch(
        skemailModalReducer.actions.setOpenModal({
          type: ModalType.AttachmentPreview,
          attachments: filteredAttachments,
          attachmentsMetadata: threadAttachmentMetadata,
          initialAttachmentIndex: attachmentIndex,
          thread,
          email
        })
      ),
    [filteredAttachments, dispatch, threadAttachmentMetadata]
  );

  const recentAttachmentPreviews: FilePreviewData[] = filteredAttachments
    // Only display image or video previews here
    .filter(({ contentType }) => MIMETypes.Pdf.includes(contentType) || MIMETypes.Image.includes(contentType))
    .slice(0, MAX_RECENT_FILES_DISPLAYED)
    .map((attachment) => {
      const { id: attachmentID, name, contentType } = attachment;

      const { thread, email } = attachmentIDtoThreadMap.get(attachmentID) ?? {};
      const attachmentIndex = threadAttachmentMetadata?.findIndex((metadata) => attachmentID === metadata.attachmentID);

      return {
        id: attachment.id,
        title: name,
        onClick: () => {
          if (attachmentIndex === -1 || attachmentIndex === undefined) return;
          openAttachmentsPreviewModal(attachmentIndex, thread, email);
        },
        placeholderIcon: getIconFromMIMEType(contentType),
        theme,
        preview: {
          data: getPreviewDataByType(attachment),
          mimeType: attachment.contentType,
          fileName: attachment.name,
          contentType: getNwContentType(attachment.contentType)
        },
        refetch: () => {
          void fetchAttachments([attachmentID], true);
        },
        progress: inProgress(attachment) ? attachment.progress : undefined
      };
    });

  const renderInfiniteLoader = (): JSX.Element => {
    // whether or not there are more items to be rendered
    const hasNextPage = data?.mailbox?.pageInfo.hasNextPage;
    const cursor =
      hasNextPage && !!data?.mailbox?.pageInfo?.cursor
        ? { threadID: data.mailbox.pageInfo.cursor.threadID, date: data.mailbox.pageInfo.cursor.date as string }
        : null;

    let renderedListAttachments = filteredAttachments;

    // Filter out attachments that don't match the current file type filter
    if (activeFileTypeFilter !== FileTypeFilter.All) {
      renderedListAttachments = renderedListAttachments.filter((attachment) =>
        (MIMETypes[activeFileTypeFilter] as string[] | undefined)?.includes(attachment.contentType)
      );
    }

    // Filter by name inputted into search bar
    if (searchFilter) {
      renderedListAttachments = renderedListAttachments.filter((attachment) =>
        attachment.name.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Fetch attachment data for rendered attachments (only fetches attachments that have not yet been fetched)
    void fetchAttachments(renderedListAttachments.map((attach) => attach.id));

    // checks whether a certain item has loaded
    const isItemLoaded = (index: number) => !hasNextPage || index < renderedListAttachments.length;

    const loadMoreItems = async () => {
      await fetchMore({
        variables: {
          request: {
            limit: DEFAULT_MAILBOX_LIMIT,
            filters: QUERY_FILTERS,
            cursor
          }
        }
      });
    };

    return (
      <div style={{ height: '100%', width: '100%' }}>
        <Autosizer>
          {({ height, width }) => (
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={renderedListAttachments.length}
              loadMoreItems={loadMoreItems}
              threshold={8}
            >
              {({ ref, onItemsRendered }) => (
                <VariableSizeList<AttachmentItemData>
                  estimatedItemSize={ROW_HEIGHT}
                  height={height}
                  itemCount={renderedListAttachments.length}
                  itemData={{
                    attachments: renderedListAttachments,
                    attachmentIDtoThreadMap,
                    openAttachmentsPreviewModal,
                    fetchAttachments
                  }}
                  itemKey={(index, listData) => {
                    const { attachments: attachmentsData } = listData;
                    const item = attachmentsData[index];
                    return item.id;
                  }}
                  itemSize={() => ROW_HEIGHT}
                  onItemsRendered={onItemsRendered}
                  overscanCount={10}
                  ref={ref}
                  width={width}
                >
                  {AttachmentItem}
                </VariableSizeList>
              )}
            </InfiniteLoader>
          )}
        </Autosizer>
      </div>
    );
  };

  return (
    <FilesPageContainer>
      <RecentlyViewedFiles filePreviews={recentAttachmentPreviews} loading={loading} />
      <FileTableHeader
        activeFileTypeFilter={activeFileTypeFilter}
        hideCreated
        hideUpdated
        onSearchInputChange={(e: ChangeEvent<HTMLInputElement>) => setSearchFilter(e.target.value)}
        setFileTypeFilter={(filter) => setActiveFileTypeFilter(filter)}
        // showSearchInput
      />
      {!loading && renderInfiniteLoader()}
    </FilesPageContainer>
  );
};

export default FilesMailbox;
