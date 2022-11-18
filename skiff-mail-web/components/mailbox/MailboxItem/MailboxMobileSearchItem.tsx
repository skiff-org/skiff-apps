import React from 'react';
import { useDispatch } from 'react-redux';
import { ListChildComponentProps } from 'react-window';

import { useRouterLabelContext } from '../../../context/RouterLabelContext';
import { useCurrentUserEmailAliases } from '../../../hooks/useCurrentUserEmailAliases';
import { threadsEqual, userLabelsEqual } from '../../../utils/mailboxUtils';
import { SearchSkemail } from '../../../utils/searchWorkerUtils';
import { MobileMessageCell } from '../MessageCell/MobileMessageCell';

import { toggleThreadSelect } from './mailboxItemHelpers';

const threadIsSelected = (currSelectedIDs: string[], threadID: string) => currSelectedIDs.includes(threadID);

interface MobileMailboxSearchItemData {
  skemails: SearchSkemail[];
  selectedThreadIDs: string[];
  activeThreadID?: string;
  setActiveThreadID: (thread?: { threadID: string; emailID?: string | undefined } | undefined) => void;
}
function MobileMailboxSearchItem({ index, style, data }: ListChildComponentProps<MobileMailboxSearchItemData>) {
  const dispatch = useDispatch();
  const { value: label } = useRouterLabelContext();
  const currentUserAliases = useCurrentUserEmailAliases();

  if (index === 0) {
    return <div style={style} />;
  }

  const { skemails, selectedThreadIDs: currSelectedThreadIDs, activeThreadID, setActiveThreadID } = data;
  const { createdAt, from, to, id, threadID, content, read, subject } = skemails[index];

  const onMobileSearchResultClick = () => {
    setActiveThreadID({ threadID });
  };
  const isSelected = threadIsSelected(currSelectedThreadIDs, threadID);

  const isOutboundEmail = currentUserAliases.includes(from.address);
  const outboundDisplayNames = to.map((addressObj) => addressObj.name || addressObj.address);
  const outboundAddresses = to.map((addressObj) => addressObj.address);
  const displayNames = isOutboundEmail && !!to.length ? outboundDisplayNames : [from.name || from.address];
  const addresses = isOutboundEmail && !!to.length ? outboundAddresses : [from.address];

  return (
    <div key={threadID} style={{ ...style }}>
      <MobileMessageCell
        active={threadID === activeThreadID}
        addresses={addresses}
        // We don't store attachment data in the search index, so we can't render it accurately here
        date={new Date(createdAt)}
        displayNames={displayNames}
        facepileNames={displayNames}
        hasAttachment={false}
        key={id}
        label={label}
        message={content}
        onClick={onMobileSearchResultClick}
        onSelectToggle={() => toggleThreadSelect(dispatch, threadID, isSelected)}
        read={read}
        selected={isSelected}
        subject={subject}
        threadID={threadID}
      />
    </div>
  );
}

const threadActive = (
  prev: Readonly<ListChildComponentProps<MobileMailboxSearchItemData>>,
  next: Readonly<ListChildComponentProps<MobileMailboxSearchItemData>>
) => {
  // re-render if thread was active or if thread will be active or if thread array was changed
  const threadID = prev.data.skemails[prev.index].threadID;

  const wasActive = prev.data.activeThreadID === threadID;
  const willBeActive = next.data.activeThreadID === threadID;
  const threadChanged = !threadsEqual(prev.data.skemails, next.data.skemails); // Thread added/removed
  const selectedStateChanged =
    prev.data.selectedThreadIDs.includes(threadID) !== next.data.selectedThreadIDs.includes(threadID); // Thread selected/deselected
  const userLabelsChanged = !userLabelsEqual(
    prev.data.skemails[prev.index].userLabels,
    next.data.skemails[next.index].userLabels
  );
  const styleChanged = prev.style !== next.style;
  const indexChanged = prev.index !== next.index;

  const shouldRender =
    wasActive ||
    willBeActive ||
    threadChanged ||
    selectedStateChanged ||
    userLabelsChanged ||
    styleChanged ||
    indexChanged;
  return !shouldRender;
};

export default React.memo(MobileMailboxSearchItem, threadActive);
