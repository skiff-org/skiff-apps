import { Dayjs } from 'dayjs';
import { ClickType, getClickType } from 'nightwatch-ui';
import { useCallback, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import { useCurrentCalendarID } from '../../apollo/currentCalendarMetadata';
import { DragType } from '../../components/Calendar/EventCard/DragContainer';
import { MARK_HOURS_WIDTH, SNAP_SIZE } from '../../constants/calendar.constants';
import { DATE_UNIT, DAY_UNIT, HOUR_UNIT, MINUTE_UNIT, SECOND_UNIT } from '../../constants/time.constants';
import { eventReducer } from '../../redux/reducers/eventReducer';
import { DrawerTypes, mobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { sharedEventDraggingReducer } from '../../redux/reducers/sharedEventDraggingReducer';
import { getDraftByID, saveDraft } from '../../storage/models/draft/modelUtils';
import { UpdateEventArgs } from '../../storage/models/event/types';
import { dayjs, getHourFromTop } from '../dateTimeUtils';
import { roundY } from '../dragFunctionsUtils';
import { finishEditDraftWithSaveDraftModal, shouldShowSaveDraftModal } from '../eventUtils';

import { useAppSelector } from './useAppSelector';
import { useCreatePendingEvent } from './useCreatePendingEvent';

interface DragToCreateProps {
  daysToShow: number;
  firstDay: dayjs.Dayjs;
}

const calcClickDateFromEvent = (
  weeklyView: HTMLDivElement,
  clickX: number,
  clickY: number,
  dragToCreateProps: DragToCreateProps
) => {
  const { daysToShow, firstDay } = dragToCreateProps;
  const x = clickX - weeklyView.getBoundingClientRect().x;
  const y = clickY - weeklyView.getBoundingClientRect().y + weeklyView.scrollTop;
  const width = weeklyView.clientWidth - MARK_HOURS_WIDTH;
  const dayColumnWidth = width / daysToShow;
  const dayColumnIndex = Math.floor((x - MARK_HOURS_WIDTH) / dayColumnWidth);
  const hourIndex = roundY(y);
  return firstDay.add(dayColumnIndex, DAY_UNIT).startOf(DATE_UNIT).add(getHourFromTop(hourIndex), HOUR_UNIT);
};

// if user DTC to the end of the day, it will put 12:00 which makes it a multi-day event.
// Subtracting one second keeps the event in one day.
const containEndDateToCurrentDay = (date: Dayjs) =>
  date.subtract(1, SECOND_UNIT).day() !== date.day() ? date.subtract(1, SECOND_UNIT) : date;

const containStartDateToCurrentDay = (startDate: Dayjs, endDate: Dayjs) =>
  startDate.day() !== endDate.day() ? startDate.add(1, DAY_UNIT).startOf(DATE_UNIT) : startDate;

const useDragToCreate = (props: DragToCreateProps) => {
  // state
  const [initialClickY, setInitialClickY] = useState(0);
  const [initialClickX, setInitialClickX] = useState(0);
  const lastOffsets = useRef({ x: 0, y: 0, moved: false });
  // hooks
  const dispatch = useDispatch();
  const createPendingEvent = useCreatePendingEvent(false);
  const selectedEventID = useAppSelector((state) => state.event.selectedEventID);
  const calendarID = useCurrentCalendarID();

  // helper functions
  const resetInitialXY = useCallback(() => {
    setInitialClickY(0);
    setInitialClickX(0);
  }, []);

  const updateDragState = useCallback(
    (yOffset: number, eventID?: string) => {
      dispatch(
        sharedEventDraggingReducer.actions.updateEventDragState({
          eventID: eventID || selectedEventID,
          dragType: yOffset > 0 ? DragType.Bottom : DragType.Top,
          yOffsets: {
            top: yOffset < 0 ? yOffset : 0,
            bottom: yOffset > 0 ? yOffset : 0
          }
        })
      );
    },
    [dispatch, selectedEventID]
  );

  const updateDraftDetails = useCallback(
    async (newDetails: UpdateEventArgs): Promise<void> => {
      if (!selectedEventID) return;

      const draft = await getDraftByID(selectedEventID);
      if (!draft) return;

      draft.updateWithPartialDetails(newDetails);
      void saveDraft(draft);
    },
    [selectedEventID]
  );

  const deleteOrSaveDraft = useCallback(() => {
    if (!selectedEventID || !calendarID) return;

    void finishEditDraftWithSaveDraftModal(selectedEventID, calendarID).then(() => {
      dispatch(eventReducer.actions.setSelectedEventID({ eventID: undefined }));
    });
  }, [selectedEventID, calendarID, dispatch]);

  /**
   * This feature is implanted in the following way:
   * When a user clicks on the weekly view, 3 event listeners are activated:
   *   - onMouseDown
   *   - onMouseMove
   *   - onMouseUp
   *
   * 1. onMouseDown: responsible on resetting the initial click position, the last offsets dragged eventID.
   *
   * 2. onMouseMove: will create the draft event and update drag state accordingly.
   *
   * 3. onMouseUp:
   *      - if there is already a selected event, and user didn't move the mouse, unselect the event.
   *      - if there is no selected event and the user did not move the mouse,
   *         create a new event with the default duration. (i.e similar to clicking before)
   *      - if user did move the mouse, create a new event with the duration of the drag and select it.
   */

  // event handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (getClickType(e) !== ClickType.Left) return;
      if (calendarID && shouldShowSaveDraftModal(calendarID)) {
        return;
      }

      dispatch(sharedEventDraggingReducer.actions.setDraggedEvent({ eventID: null }));
      setInitialClickY(e.clientY);
      setInitialClickX(e.clientX);
      lastOffsets.current = { x: 0, y: 0, moved: false };
    },
    [calendarID, dispatch]
  );

  const onMouseUpOrLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (getClickType(e) !== ClickType.Left || !initialClickY) return;
      e.stopPropagation();
      e.preventDefault();

      // drag to create event
      if (lastOffsets.current.moved && selectedEventID) {
        const mouseUpDate = calcClickDateFromEvent(e.currentTarget, initialClickX, e.clientY, props);
        const mouseDownDate = calcClickDateFromEvent(e.currentTarget, initialClickX, initialClickY, props);
        const isDraggingUp = lastOffsets.current.y < 0;
        // make sure that the end date and the start date are in the same day
        // and that they are ordered according to the drag direction
        let endDate = isDraggingUp ? mouseDownDate.valueOf() : containEndDateToCurrentDay(mouseUpDate).valueOf();
        const startDate = isDraggingUp
          ? containStartDateToCurrentDay(mouseUpDate, mouseDownDate).valueOf()
          : mouseDownDate.valueOf();

        if (startDate === endDate) {
          // If the startDate and the endDate are the same then create a 15 minute event
          endDate += dayjs.duration(SNAP_SIZE, MINUTE_UNIT).asMilliseconds();
        }

        void updateDraftDetails({
          plainContent: {
            endDate: endDate.valueOf(),
            startDate: startDate.valueOf()
          }
        });
        dispatch(sharedEventDraggingReducer.actions.setDraggedEvent({ eventID: null }));
        resetInitialXY();
        return;
      }
      // click to create event
      if (!selectedEventID) {
        const eventID = uuidv4();
        const clickDate = calcClickDateFromEvent(e.currentTarget, initialClickX, initialClickY, props);
        void createPendingEvent(clickDate, eventID);
        if (isMobile) dispatch(mobileDrawerReducer.actions.openDrawer(DrawerTypes.CreateEvent));
      } else {
        // click outside of event to unselect
        deleteOrSaveDraft();
      }

      resetInitialXY();
    },
    [
      selectedEventID,
      resetInitialXY,
      initialClickX,
      props,
      updateDraftDetails,
      dispatch,
      initialClickY,
      createPendingEvent,
      deleteOrSaveDraft
    ]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      // here we use e.buttons instead of e.button since e.button's representation of left click is same as uninitialized
      if (e.buttons !== 1 || !initialClickY) return;
      const yOffset = e.clientY - initialClickY;
      const roundedYOffset = roundY(yOffset);
      // we have to pre-generate the eventID because `createPendingEvent` is async and we need to update the drag state
      let generatedEventID: string | undefined = undefined;

      // the first time the user moved the mouse while dragging
      if (!lastOffsets.current.moved && roundedYOffset) {
        deleteOrSaveDraft();
        dispatch(eventReducer.actions.setSelectedEventID({ eventID: undefined }));
        const clickDate = calcClickDateFromEvent(e.currentTarget, initialClickX, initialClickY, props);
        generatedEventID = uuidv4();
        void createPendingEvent(clickDate, generatedEventID, clickDate);
        lastOffsets.current.moved = true;
      }

      if (lastOffsets.current.y === roundedYOffset) return;
      lastOffsets.current.y = roundedYOffset;
      updateDragState(roundedYOffset, generatedEventID);
    },
    [createPendingEvent, deleteOrSaveDraft, dispatch, initialClickX, initialClickY, props, updateDragState]
  );

  return { onMouseDown, onMouseUpOrLeave, onMouseMove };
};
export default useDragToCreate;
