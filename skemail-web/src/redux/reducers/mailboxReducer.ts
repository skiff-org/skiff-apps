import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import isArray from 'lodash/isArray';
import uniqBy from 'lodash/uniqBy';
import { MailboxFilters } from 'skiff-graphql';

import { ThreadViewEmailInfo } from '../../models/email';
import { MailboxThreadInfo } from '../../models/thread';
import { getInitialThreadParams } from '../../utils/locationUtils';
import { InProgressBulkAction, MailboxActionInfo, MailboxMultiSelectFilter } from '../../utils/mailboxActionUtils';

import { ActiveThread } from './reducers.types';

interface PendingReply {
  email: ThreadViewEmailInfo;
  threadID: string;
}

type QuickAliasFilter = Record<string, boolean>;

export interface SkemailMailboxReducerState {
  selectedThreadIDs: string[];
  hoveredThreadID: string;
  hoveredThreadIndex: number;
  renderedMailboxThreadsCount: number;
  /*
    Filter options:
    # read: true - read threads
    # read: false - unread threads
    # attachments: true - threads with attachments
    Not supported:
    # attachments: false
  */
  filters: MailboxFilters;
  activeThread: ActiveThread;
  lastSelectedIndex: number | null;
  /** Email replies used for optimistic rendering */
  pendingReplies: PendingReply[];
  /**
   * Filter that determines select checkbox state on message cells
   * Distinct from MailboxFilters which determine threads fetched from backend
   */
  multiSelectFilter?: MailboxMultiSelectFilter;
  /** ID of the thread that follows the curr active thread */
  nextActiveThreadID?: string;
  pendingMailboxAction?: MailboxActionInfo; // a thread action whose fulfillment is pending user decision to carry out on *all* or selected threads,
  /** ID of the thread that precedes the curr active thread */
  prevActiveThreadID?: string;
  /** A bulk thread action whose fulfillment is in progress */
  inProgressBulkAction?: InProgressBulkAction;
  quickAliasFilter?: QuickAliasFilter;
}

// Used for updating caching
// This is not a good solution, we will have to rethink this
// once we have more possible filters to query
export const possibleMailboxFilters: MailboxFilters[] = [{}, { read: true }, { read: false }];

const initialSkemailMailboxState: SkemailMailboxReducerState = {
  selectedThreadIDs: [],
  hoveredThreadID: '',
  hoveredThreadIndex: 0,
  renderedMailboxThreadsCount: 0,
  filters: {},
  activeThread: getInitialThreadParams(),
  lastSelectedIndex: null,
  pendingReplies: []
};

export const skemailMailboxReducer = createSlice({
  name: 'mailbox',
  initialState: initialSkemailMailboxState,
  reducers: {
    setSelectedThreadIDs: (state, action: PayloadAction<{ selectedThreadIDs: string[] }>) => {
      const { selectedThreadIDs } = action.payload;
      state.selectedThreadIDs = selectedThreadIDs;
    },
    addSelectedThreadID: (state, action: PayloadAction<string | string[]>) => {
      if (isArray(action.payload)) {
        action.payload.forEach((id) => state.selectedThreadIDs.push(id));
      } else {
        state.selectedThreadIDs.push(action.payload);
      }
    },
    removeSelectedThreadID: (state, action: PayloadAction<string | string[]>) => {
      if (isArray(action.payload)) {
        state.selectedThreadIDs = state.selectedThreadIDs.filter((id) => !action.payload.includes(id));
      } else {
        state.selectedThreadIDs = state.selectedThreadIDs.filter((id) => id !== action.payload);
      }
    },
    setHoveredThreadID: (state, action: PayloadAction<{ hoveredThreadID: string }>) => {
      const { hoveredThreadID } = action.payload;
      state.hoveredThreadID = hoveredThreadID;
    },
    setHoveredThreadIndex: (state, action: PayloadAction<{ hoveredThreadIndex: number }>) => {
      const { hoveredThreadIndex } = action.payload;
      state.hoveredThreadIndex = hoveredThreadIndex;
    },
    setFilters: (state, action: PayloadAction<{ filters: MailboxFilters }>) => {
      const { filters } = action.payload;
      state.filters = filters;
    },
    setRenderedMailboxThreadsCount: (state, action: PayloadAction<number>) => {
      state.renderedMailboxThreadsCount = action.payload;
    },
    setActiveThread: (state, action: PayloadAction<ActiveThread>) => {
      state.activeThread = action.payload;
    },
    setLastSelctedIndex: (state, action: PayloadAction<number | null>) => {
      state.lastSelectedIndex = action.payload;
    },
    selectDeselectThreadsBetween: (state, action: PayloadAction<{ threads: MailboxThreadInfo[]; index: number }>) => {
      const { threads, index } = action.payload;
      const lastSelectedIndex = state.lastSelectedIndex;
      const isSelected = state.selectedThreadIDs.includes(threads[index]?.threadID ?? '');
      if (typeof lastSelectedIndex !== 'number' || lastSelectedIndex === index) return;
      // Grab all threads in between the two recently selected threads]
      const startIndex = Math.min(lastSelectedIndex, index);
      const endIndex = Math.max(lastSelectedIndex, index);
      const multiSelectedThreadIDs = threads.slice(startIndex, endIndex + 1).map((t) => t.threadID);
      // If the thread being clicked is selected, deselect all
      if (isSelected) {
        const filterOutThreadsWithID = (id: string) => !multiSelectedThreadIDs.includes(id);
        state.selectedThreadIDs = state.selectedThreadIDs.filter(filterOutThreadsWithID);
      } // else, select all
      else {
        multiSelectedThreadIDs.forEach((t) => state.selectedThreadIDs.push(t));
      }
    },
    addToPendingReplies: (state, action: PayloadAction<{ reply: PendingReply }>) => {
      state.pendingReplies = uniqBy(
        [...state.pendingReplies, action.payload.reply],
        (pendingReply) => pendingReply.email.id
      );
    },
    removeFromPendingReplies: (state, action: PayloadAction<{ emailIDs: string[] }>) => {
      state.pendingReplies = state.pendingReplies.filter(
        (pendingReply) => !action.payload.emailIDs.includes(pendingReply.email.id)
      );
    },
    setPendingMailboxAction: (state, action: PayloadAction<MailboxActionInfo | undefined>) => {
      state.pendingMailboxAction = action.payload;
    },
    setInProgressBulkAction: (state, action: PayloadAction<InProgressBulkAction | undefined>) => {
      state.inProgressBulkAction = action.payload;
    },
    finishInProgressBulkAction: (state) => {
      const inProgressBulkAction = state.inProgressBulkAction;
      if (inProgressBulkAction) {
        state.inProgressBulkAction = { ...inProgressBulkAction, isFinishing: true };
      }
    },
    setMultiSelectFilter: (state, action: PayloadAction<MailboxMultiSelectFilter | undefined>) => {
      state.multiSelectFilter = action.payload;
    },
    toggleQuickAliasSelect: (state, action: PayloadAction<{ quickAlias: string; selected?: boolean }>) => {
      const quickAliasFilter = state.quickAliasFilter;
      const { quickAlias, selected } = action.payload;
      state.quickAliasFilter = {
        ...quickAliasFilter,
        [quickAlias]: selected !== undefined ? selected : !quickAliasFilter?.[quickAlias]
      };
    },
    clearQuickAliasFilter(state) {
      state.quickAliasFilter = undefined;
    },
    setPrevActiveThreadID: (state, action: PayloadAction<string | undefined>) => {
      state.prevActiveThreadID = action.payload;
    },
    setNextActiveThreadID: (state, action: PayloadAction<string | undefined>) => {
      state.nextActiveThreadID = action.payload;
    }
  }
});
