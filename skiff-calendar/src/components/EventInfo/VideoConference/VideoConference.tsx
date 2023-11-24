import { Button, FilledVariant, Icon, IconButton, InputField, Size, Type } from 'nightwatch-ui';
import React, { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useStoreWorkspaceEventMutation } from 'skiff-front-graphql';
import { ConfirmModal, useToast, DEFAULT_WORKSPACE_EVENT_VERSION, InputFieldEndAction } from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import { sanitizeURL } from 'skiff-utils';
import styled from 'styled-components';
import isURL from 'validator/lib/isURL';

import { REMOVE_CONFERENCE_BTN } from '../../../constants/calendar.constants';
import { VideoConference } from '../../../storage/models/event/types';

import { ProvidersDetails } from './constants';
import { copyLinkToClipboard, generateJitsiMeeting, getVideoMeetingType } from './utils';

const JoinButtonContainer = styled.div`
  display: flex;
  gap: 5px;
  width: 100%;
  align-items: center;
`;

const FullWidth = styled.div`
  width: 100%;
`;

const SmallIcon = styled.div`
  width: min-content;
  margin-left: auto;
`;

export const VideoConferenceDataTest = {
  inputField: 'conferencing-input-field',
  joinOrAddButton: 'conferencing-join-or-add-button',
  removeButton: 'conferencing-remove-button'
};

export interface VideoConferenceProps {
  conference?: VideoConference;
  updateConference: (conference: VideoConference | undefined) => Promise<void>;
  canEdit: boolean;
  eventTitle?: string;
}

export const EventVideoConference = ({ eventTitle, conference, canEdit, updateConference }: VideoConferenceProps) => {
  const [deleteMeetConfirm, setDeleteMeetConfirm] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { enqueueToast } = useToast();
  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();

  useEffect(() => {
    setValue(conference?.link || '');
  }, [conference]);

  const removeConference = () => {
    void updateConference(undefined);
    setValue('');
  };

  const openConference = () => {
    if (!window || !conference) return;
    window.open(sanitizeURL(conference.link), '_blank');
  };

  const validateAndSubmitConference = async () => {
    const provider = getVideoMeetingType(value);

    // if no provider (also not Unknown provider) - remove the conference (should happen only if the input is empty)
    if (provider === undefined) {
      removeConference();
      return;
    } else {
      if (value !== conference?.link) {
        await updateConference({
          provider,
          link: value
        });
      }
    }

    inputRef.current?.blur();
  };

  const conferenceIsLink = conference && isURL(conference.link);
  const buttonTitle = conferenceIsLink ? `Join ${ProvidersDetails[conference.provider].title}` : 'Add Jitsi Meet';

  // if can't edit and no conference don't show
  if (!canEdit && !conference) return null;

  return (
    <>
      <InputField
        dataTest={VideoConferenceDataTest.inputField}
        disabled={!canEdit}
        endAdornment={
          conference ? (
            <InputFieldEndAction
              icon={Icon.Copy}
              onClick={() => void copyLinkToClipboard(conference.link, enqueueToast)}
              size={isMobile ? Size.MEDIUM : Size.SMALL}
            />
          ) : undefined
        }
        icon={Icon.Video}
        onBlur={() => void validateAndSubmitConference()}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        onKeyDown={(e: React.KeyboardEvent) => {
          // Remove focus from field when Enter is pressed
          if (e.key === 'Enter') {
            void validateAndSubmitConference();
          }
        }}
        placeholder='Conferencing'
        ref={inputRef}
        size={isMobile ? Size.MEDIUM : Size.SMALL}
        value={value}
      />
      {/**
       * Only render the join/add meeting button
       * 1. the user has edit access
       * 2. the user has read-only access but the location is defined
       */}
      {(canEdit || conferenceIsLink) && (
        <JoinButtonContainer>
          <FullWidth>
            <Button
              dataTest={VideoConferenceDataTest.joinOrAddButton}
              fullWidth
              onClick={() => {
                if (conferenceIsLink) {
                  openConference();
                } else {
                  const jitsiMeetLink = generateJitsiMeeting(eventTitle);
                  void updateConference(jitsiMeetLink);
                  setValue(jitsiMeetLink.link);
                  void storeWorkspaceEvent({
                    variables: {
                      request: {
                        eventName: WorkspaceEventType.GenerateJitsiLink,
                        version: DEFAULT_WORKSPACE_EVENT_VERSION,
                        data: ''
                      }
                    }
                  });
                }
              }}
              size={Size.SMALL}
              type={Type.SECONDARY}
            >
              {buttonTitle}
            </Button>
          </FullWidth>
          {conferenceIsLink && canEdit && (
            <SmallIcon className={REMOVE_CONFERENCE_BTN}>
              <IconButton
                dataTest={VideoConferenceDataTest.removeButton}
                icon={Icon.Close}
                onClick={() => setDeleteMeetConfirm(true)}
                size={Size.SMALL}
                tooltip='Remove conference'
                variant={FilledVariant.UNFILLED}
              />
            </SmallIcon>
          )}
        </JoinButtonContainer>
      )}
      <ConfirmModal
        confirmName='Remove'
        description='Meeting link will be removed from the event for everyone.'
        destructive
        onClose={() => setDeleteMeetConfirm(false)}
        onConfirm={() => {
          void removeConference();
          setDeleteMeetConfirm(false);
        }}
        open={deleteMeetConfirm}
        title={`Remove ${conference ? ProvidersDetails[conference.provider].title : 'conference'}`}
      />
    </>
  );
};
