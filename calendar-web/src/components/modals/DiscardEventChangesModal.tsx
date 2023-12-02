import { FC } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { ConfirmModal } from 'skiff-front-utils';

import { useSelectedEventState } from '../../apollo/selectedEvent';
import { eventReducer } from '../../redux/reducers/eventReducer';
import { DrawerTypes, mobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { deleteDraftByID } from '../../storage/models/draft/modelUtils';
import { useSelectedEventID } from '../../utils/hooks/useSelectedEvent';

interface DiscardEventChangesModalProps {
  onClose: () => void;
  isOpen: boolean;
}

const DiscardEventChangesModal: FC<DiscardEventChangesModalProps> = ({ onClose, isOpen }) => {
  const dispatch = useDispatch();

  const { selectedEvent, selectedDraft } = useSelectedEventState();
  const selectedEventID = useSelectedEventID();

  const eventTitle = selectedDraft?.decryptedContent.title || selectedEvent?.decryptedContent.title;

  return (
    <ConfirmModal
      confirmName='Discard'
      description={`Changes in ${eventTitle ? `'${eventTitle}'` : 'event'} will be discarded`}
      destructive
      onClose={onClose}
      onConfirm={async () => {
        // delete the draft without saving the changes
        if (selectedEventID) await deleteDraftByID(selectedEventID);
        dispatch(eventReducer.actions.setSelectedEventID({ eventID: undefined }));
        if (isMobile) {
          dispatch(mobileDrawerReducer.actions.closeDrawer(DrawerTypes.EventInfo));
          dispatch(mobileDrawerReducer.actions.closeDrawer(DrawerTypes.CreateEvent));
        }
        onClose();
      }}
      open={isOpen}
      title='Changes will be lost'
    />
  );
};

export default DiscardEventChangesModal;
