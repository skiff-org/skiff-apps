import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { DragType } from '../../components/Calendar/EventCard/DragContainer';

export interface DraggingData {
  yOffsets: { top: number; bottom: number };
  xOffset: number;
  dragType: DragType;
}

export interface DraggedEventData {
  draggedEventID: string | null;
  isDraggedFirstDisplayedEvent: boolean | undefined;
  isDraggedLastDisplayedEvent: boolean | undefined;
}

export interface SharedEventDraggingState {
  draggingData: DraggingData;
  draggedEventData: DraggedEventData;
}

export const initialEventDraggingData: DraggingData = {
  dragType: DragType.None,
  yOffsets: { top: 0, bottom: 0 },
  xOffset: 0
};

export const initialDraggedEventData: DraggedEventData = {
  draggedEventID: null,
  isDraggedFirstDisplayedEvent: undefined,
  isDraggedLastDisplayedEvent: undefined
};

export const initialDraggingState: SharedEventDraggingState = {
  draggingData: initialEventDraggingData,
  draggedEventData: initialDraggedEventData
};
// make only the dragType to be required
type OptionalDragData = Partial<Omit<DraggingData, 'dragType'>> & Pick<DraggingData, 'dragType'>;
export const sharedEventDraggingReducer = createSlice({
  name: 'sharedEventDragging',
  initialState: initialDraggingState,
  reducers: {
    setDraggedEvent: (
      state,
      action: PayloadAction<{ eventID: string | null; initialDragType?: DragType; isFirst?: boolean; isLast?: boolean }>
    ) => {
      const { eventID, isFirst, isLast } = action.payload;
      state.draggedEventData.draggedEventID = eventID;
      state.draggedEventData.isDraggedFirstDisplayedEvent = isFirst ?? undefined;
      state.draggedEventData.isDraggedLastDisplayedEvent = isLast ?? undefined;
      state.draggingData = { ...initialEventDraggingData, dragType: action.payload.initialDragType ?? DragType.None };
    },
    updateEventDragState: (state, action: PayloadAction<OptionalDragData & { eventID?: string }>) => {
      state.draggingData.dragType = action.payload.dragType;
      const { xOffset, yOffsets, eventID } = action.payload;

      if (Object.keys(action.payload).includes('eventID')) {
        state.draggedEventData.draggedEventID = eventID || null;
      }
      if (xOffset) {
        state.draggingData.xOffset = xOffset;
      }
      if (yOffsets) {
        state.draggingData.yOffsets = yOffsets;
      }
    }
  }
});
