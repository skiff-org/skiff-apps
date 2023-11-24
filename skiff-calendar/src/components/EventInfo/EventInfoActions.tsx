import { Button, FilledVariant, Icon, IconButton, Icons, Type } from 'nightwatch-ui';
import { useState, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useToast, BrowserDesktopView } from 'skiff-front-utils';
import styled from 'styled-components';

import { useCurrentCalendarID } from '../../apollo/currentCalendarMetadata';
import { useSelectedEventState } from '../../apollo/selectedEvent';
import { EVENT_INFO_PADDING_LEFT_RIGHT } from '../../constants/calendar.constants';
import { eventReducer } from '../../redux/reducers/eventReducer';
import { DrawerTypes, mobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { deleteDraftByID } from '../../storage/models/draft/modelUtils';
import { finishEditDraftWithSaveDraftModal } from '../../utils';
import { useMobileDrawer } from '../../utils/hooks/useMobileDrawer';
import { useSelectedEvent, useSelectedEventID } from '../../utils/hooks/useSelectedEvent';
import { EventOptions } from '../Calendar/EventOptions';

import useCloseEventInfo from './useCloseEventInfo';

const ButtonFooter = styled.div`
  display: flex;
  align-items: flex-end;
  width: 100%;
  box-sizing: border-box;
  justify-content: space-between;
  ${!isMobile && `padding-left: ${EVENT_INFO_PADDING_LEFT_RIGHT}px`}
`;

const MobileButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-left: -8px; /* To vertically align the IconButtons with the drawer content */
`;

const SaveButtonContainer = styled.div`
  margin-left: auto;
  display: flex;
  gap: ${isMobile ? '4' : '8'}px;
  ${!isMobile && `padding-right: ${EVENT_INFO_PADDING_LEFT_RIGHT}px`}
`;

interface ActionsSectionProps {
  disableSaveEvent: boolean;
  canEdit: boolean;
  showMoreOptionsButton: boolean;
}

const EventInfoActions = (props: ActionsSectionProps) => {
  const { disableSaveEvent, canEdit, showMoreOptionsButton } = props;
  const calendarID = useCurrentCalendarID();

  const [isEventOptionsOpen, setIsEventOptionsOpen] = useState(false);
  const selectedEventID = useSelectedEventID();
  const { saveDraftAndCloseEventInfo } = useSelectedEvent();
  const { isOpen, openDrawer, closeDrawer } = useMobileDrawer(DrawerTypes.EventInfoMoreOptions);
  const dispatch = useDispatch();
  const { enqueueToast } = useToast();
  const optionsBtnRef = useRef<HTMLDivElement>(null);

  const { selectedEvent } = useSelectedEventState();
  const saveOrUpdateButtonText = !selectedEvent ? 'Save' : 'Update';

  const [cancelBtnClick, showSaveButton] = useCloseEventInfo();

  const deleteDraft = async () => {
    // delete the draft without saving the changes
    if (selectedEventID) await deleteDraftByID(selectedEventID);
    dispatch(eventReducer.actions.setSelectedEventID({ eventID: undefined }));
  };

  const hideDrawer = () => {
    dispatch(mobileDrawerReducer.actions.closeDrawer(DrawerTypes.EventInfo));
    dispatch(mobileDrawerReducer.actions.closeDrawer(DrawerTypes.CreateEvent));
  };

  // save functionality for mobile - we don't prompt the user to send mails, so we automatically send them
  const saveMobile = async () => {
    if (!selectedEventID || !calendarID) {
      enqueueToast({ body: 'Saving event failed' });
      return;
    }

    // save without showing the draft modal on mobile.
    const saved = await finishEditDraftWithSaveDraftModal(selectedEventID, calendarID);

    if (saved) {
      await deleteDraft();
      hideDrawer();
      enqueueToast({ body: 'Event saved' });
    }
  };

  return (
    <>
      <BrowserDesktopView>
        <ButtonFooter>
          {showMoreOptionsButton && (
            <>
              <IconButton
                icon={Icon.OverflowH}
                onClick={() => setIsEventOptionsOpen(true)}
                ref={optionsBtnRef}
                type={Type.SECONDARY}
                variant={FilledVariant.UNFILLED}
              />
              {selectedEventID && (
                <EventOptions
                  canEdit={canEdit}
                  dropdownBtnRef={optionsBtnRef}
                  eventID={selectedEventID}
                  isOpen={isEventOptionsOpen}
                  onClose={() => setIsEventOptionsOpen(false)}
                />
              )}
            </>
          )}
          <SaveButtonContainer>
            {!showSaveButton && (
              <Button onClick={() => void cancelBtnClick()} type={Type.SECONDARY}>
                Close
              </Button>
            )}
            {showSaveButton && (
              <>
                <Button onClick={() => void cancelBtnClick()} type={Type.SECONDARY}>
                  Cancel
                </Button>
                <Button
                  disabled={disableSaveEvent}
                  floatRight
                  onClick={async (e) => {
                    e.stopPropagation();
                    await saveDraftAndCloseEventInfo();
                  }}
                >
                  {saveOrUpdateButtonText}
                </Button>
              </>
            )}
          </SaveButtonContainer>
        </ButtonFooter>
      </BrowserDesktopView>
      <MobileView>
        <MobileButtonsContainer>
          <IconButton icon={Icon.Close} onClick={() => void cancelBtnClick()} variant={FilledVariant.UNFILLED} />
          <SaveButtonContainer>
            {showMoreOptionsButton && (
              <IconButton
                icon={<Icons color='disabled' icon={Icon.OverflowH} />}
                onClick={openDrawer}
                variant={FilledVariant.UNFILLED}
              />
            )}
            {showSaveButton && (
              <Button disabled={disableSaveEvent} onClick={saveMobile}>
                {saveOrUpdateButtonText}
              </Button>
            )}
          </SaveButtonContainer>
          {selectedEventID && showMoreOptionsButton && (
            <EventOptions canEdit={canEdit} eventID={selectedEventID} isOpen={isOpen} onClose={closeDrawer} />
          )}
        </MobileButtonsContainer>
      </MobileView>
    </>
  );
};

export default EventInfoActions;
