import { FC, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { LogoutModal } from 'skiff-front-utils';

import { getCurrentCalendarMetadata } from '../../apollo/currentCalendarMetadata';
import { modalReducer } from '../../redux/reducers/modalReducer';
import { getUnsyncedEvents } from '../../storage/models/event/modelUtils';
import { useCalendarLogout } from '../../utils/hooks/useCalendarLogout';

interface CalendarLogoutModalProps {
  isOpen: boolean;
}

const CalendarLogoutModal: FC<CalendarLogoutModalProps> = ({ isOpen }) => {
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const dispatch = useDispatch();

  const handleLogout = useCalendarLogout();

  // Check for unsaved changes
  useEffect(() => {
    void (async () => {
      const metadata = await getCurrentCalendarMetadata();
      const updates = await getUnsyncedEvents(metadata?.lastUpdated);
      if (updates.length > 0) setUnsavedChanges(true);
      else setUnsavedChanges(false);
    })();
  }, [isOpen]);

  return (
    <LogoutModal
      description={
        unsavedChanges
          ? 'You have unsynced local changes. After logging out, they will be permanently lost.'
          : undefined
      }
      isOpen={isOpen}
      onClose={() => {
        dispatch(modalReducer.actions.setOpenModal());
      }}
      onLogout={handleLogout}
    />
  );
};

export default CalendarLogoutModal;
