import Linkify from 'linkify-react';
import { Icon, Icons, InputField, Size, TextArea, Typography, TypographySize, useOnClickOutside } from 'nightwatch-ui';
import { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { InputFieldEndAction } from 'skiff-front-utils';
import { sanitizeURL } from 'skiff-utils';
import styled from 'styled-components';
import isURL from 'validator/lib/isURL';

import { UpdateEventArgs } from '../../storage/models/event/types';

const LocationAndDescriptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
`;

const DescriptionTypography = styled(Typography)`
  white-space: pre-line;
`;

const LinkifiedDescription = styled.div`
  width: 100%;
  background: var(--bg-overlay-tertiary);
  overflow-wrap: break-word;
  box-sizing: border-box;
  padding: 8px 12px;
  border-radius: 8px;
  overflow: auto;
  gap: 26px;
  display: flex;
  align-items: flex-start;
  height: 117.39px;
`;

const RelativeIcon = styled.div<{ $empty?: boolean }>`
  position: relative;
`;

const FixedIcon = styled.div`
  position: absolute;
`;

export const LocationAndDescriptionDataTest = {
  locationInputField: 'location-input-field',
  descriptionInputField: 'description-input-field'
};

interface LocationAndDescriptionProps {
  canEdit: boolean;
  setDescription: (newDescription: string) => void;
  setLocation: (newLocation: string) => void;
  updateEventDetails: (newDetails: UpdateEventArgs) => Promise<void>;
  location?: string;
  description?: string;
}

export const LocationAndDescription: React.FC<LocationAndDescriptionProps> = ({
  canEdit,
  location,
  description,
  setDescription,
  setLocation,
  updateEventDetails
}: LocationAndDescriptionProps) => {
  // Refs
  const locationInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [showEditableDescription, setShowEditableDescription] = useState(false);

  useOnClickOutside(
    descriptionRef,
    () => {
      if (showEditableDescription && descriptionRef.current) {
        setShowEditableDescription(false);
      }
    },
    [],
    {}, // Use default event handling
    [] // No excluded refs
  );

  const openURL = () => {
    if (!window || !location) return;
    window.open(sanitizeURL(location), '_blank');
  };

  return (
    <LocationAndDescriptionContainer>
      {/**
       * Only render the location field if
       * 1. the user has edit access
       * 2. the user has read-only access but the location is defined
       */}
      {(canEdit || location) && (
        <>
          <InputField
            dataTest={LocationAndDescriptionDataTest.locationInputField}
            disabled={!canEdit}
            endAdornment={
              location && isURL(location) ? (
                <InputFieldEndAction
                  icon={Icon.ExternalLink}
                  onClick={openURL}
                  size={isMobile ? Size.MEDIUM : Size.SMALL}
                />
              ) : undefined
            }
            icon={Icon.MapMarker}
            innerRef={locationInputRef}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setLocation(e.target.value);
              void updateEventDetails({ decryptedContent: { location: e.target.value } });
            }}
            onKeyDown={(e: React.KeyboardEvent) => {
              // Remove focus from field when Enter is pressed
              if (e.key === 'Enter') {
                locationInputRef.current?.blur();
              }
            }}
            placeholder='Location'
            size={isMobile ? Size.MEDIUM : Size.SMALL}
            value={location}
          />
        </>
      )}
      {/**
       * Only render the description field if
       * 1. the user has edit access
       * 2. the user has read-only access but the description is defined
       */}
      {(canEdit || description) && (
        <>
          {showEditableDescription && (
            <TextArea
              autoFocus
              dataTest={LocationAndDescriptionDataTest.descriptionInputField}
              disabled={!canEdit}
              innerRef={descriptionRef}
              icon={Icon.Edit}
              onBlur={() => setShowEditableDescription(false)}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setDescription(e.target.value);
                void updateEventDetails({ decryptedContent: { description: e.target.value } });
              }}
              placeholder='Description'
              rows={6}
              size={isMobile ? Size.MEDIUM : Size.SMALL}
              value={description}
            />
          )}
          {!showEditableDescription && (
            <LinkifiedDescription
              onClick={() => {
                if (canEdit) {
                  setShowEditableDescription(true);
                  descriptionRef.current?.focus();
                }
              }}
            >
              <RelativeIcon $empty={!description}>
                <FixedIcon>
                  <Icons size={Size.SMALL} color='disabled' icon={Icon.Edit} />
                </FixedIcon>
              </RelativeIcon>
              <Linkify options={{ nl2br: true, target: '_blank' }}>
                <DescriptionTypography
                  size={TypographySize.SMALL}
                  color={!!description ? 'secondary' : 'disabled'}
                  wrap
                >
                  {description || 'Description'}
                </DescriptionTypography>
              </Linkify>
            </LinkifiedDescription>
          )}
        </>
      )}
    </LocationAndDescriptionContainer>
  );
};
