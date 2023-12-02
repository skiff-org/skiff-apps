import { useCallback } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useWarnBeforeUnloading } from 'skiff-front-utils';

import { EventDiffState, useSelectedEventState } from '../../apollo/selectedEvent';
import { eventReducer } from '../../redux/reducers/eventReducer';
import { DrawerTypes, mobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { modalReducer } from '../../redux/reducers/modalReducer';
import { CalendarModalType } from '../../redux/reducers/modalTypes';
import { deleteDraftByID } from '../../storage/models/draft/modelUtils';
import { useSelectedEventID } from '../../utils/hooks/useSelectedEvent';
import { isRecurringChild } from '../../utils/recurringUtils';
import { isOnlyRSVPUpdate } from '../../utils/updateTypeUtils';

const useCloseEventInfo = () => {
  const dispatch = useDispatch();

  const selectedEventID = useSelectedEventID();

  const { diffMap, selectedEvent, selectedDraft } = useSelectedEventState();

  const stateNoUpdated = !selectedEvent && !selectedDraft;
  const recurringChild =
    (selectedEvent && isRecurringChild(selectedEvent)) || (selectedDraft && isRecurringChild(selectedDraft));
  const newEvent = diffMap?.diffState === EventDiffState.New;

  const isNewRecurringChild = stateNoUpdated || (recurringChild && newEvent);
  const onlyRsvpUpdates = isOnlyRSVPUpdate(selectedDraft?.localMetadata.updateType ?? []);

  const notSettled = !!diffMap && diffMap.diffState !== EventDiffState.Settled;
  const showSaveButton = notSettled && !isNewRecurringChild && !onlyRsvpUpdates;
  const eventIsNew = diffMap?.diffState === EventDiffState.New;
  const shouldWarn = !eventIsNew && showSaveButton;

  // Warns users that changes may be discarded if they attempt to leave the page
  useWarnBeforeUnloading(shouldWarn);

  const deleteDraft = useCallback(async () => {
    // delete the draft without saving the changes
    if (selectedEventID) await deleteDraftByID(selectedEventID);
    dispatch(eventReducer.actions.setSelectedEventID({ eventID: undefined }));
  }, [dispatch, selectedEventID]);

  const cancelBtnClick = useCallback(async () => {
    if (shouldWarn)
      return dispatch(
        modalReducer.actions.setOpenModal({
          type: CalendarModalType.DiscardEventChanges
        })
      );
    await deleteDraft();
    if (isMobile) {
      dispatch(mobileDrawerReducer.actions.closeDrawer(DrawerTypes.EventInfo));
      dispatch(mobileDrawerReducer.actions.closeDrawer(DrawerTypes.CreateEvent));
    }
  }, [deleteDraft, dispatch, shouldWarn]);

  return [cancelBtnClick, showSaveButton] as [onCancel: typeof cancelBtnClick, showSaveButton: typeof showSaveButton];
};

export default useCloseEventInfo;
