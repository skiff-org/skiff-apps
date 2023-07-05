import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import isArray from 'lodash/isArray';
import uniqBy from 'lodash/uniqBy';
import { MailboxFilters } from 'skiff-graphql';

import { ThreadViewEmailInfo } from '../../models/email';
import { MailboxThreadInfo } from '../../models/thread';
import { getInitialThreadParams } from '../../utils/locationUtils';

interface PendingReply {
  email: ThreadViewEmailInfo;
  threadID: string;
}

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
  activeThread: {
    activeThreadID?: string;
    activeEmailID?: string;
  };
  lastSelectedIndex: number | null;
  pendingReplies: PendingReply[]; // email replies used for optimistic rendering
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
      // If we were at a state of 0 selected threads and are going into a state of 1 selected thread or more
      if (state.selectedThreadIDs.length === 0 && selectedThreadIDs.length > 0) {
        // unset hovered thread state to default to avoid it getting hover background
        state.hoveredThreadIndex = -1;
        state.hoveredThreadID = '';
      }
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
    setActiveThread: (
      state,
      action: PayloadAction<{
        activeThreadID?: string;
        activeEmailID?: string;
      }>
    ) => {
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
    }
  }
});
