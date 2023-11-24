import { Icon, IconText, Size, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React, { RefObject, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  UserAvatar,
  createAbbreviatedWalletEmail,
  getAddrDisplayName,
  splitEmailToAliasAndDomain
} from 'skiff-front-utils';
import { isENSName, isWalletAddress, VERIFIED_SKIFF_EMAILS } from 'skiff-utils';
import styled from 'styled-components';

import { useDate } from '../../../hooks/useDate';
import { useDisplayNameFromAddress } from '../../../hooks/useDisplayNameFromAddress';
import { useDisplayPictureWithDefaultFallback } from '../../../hooks/useDisplayPictureDataFromAddress';
import { MailboxEmailInfo } from '../../../models/email';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import SenderDisplayName from '../../shared/SenderDisplayName/SenderDisplayName';

import ContactActionDropdown from './ContactActionDropdown';

const SENDER_INFO_MAX_WIDTH = '68%';

const SenderBlock = styled.div`
  display: flex;
  align-items: ${isMobile ? 'flex-start' : 'center'};
  gap: 16px;
`;

const AvatarBlock = styled.div`
  margin-top: 6px;
`;

const Email = styled.div`
  margin-top: ${isMobile ? '-8px' : ''};
  padding: ${isMobile ? '11px 0px 22px 0px' : ''};
  max-width: ${isMobile ? '212px' : ''};
  max-width: ${SENDER_INFO_MAX_WIDTH};
`;

const FromAndDateContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const ThreadActionButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const NameAndDate = styled.div`
  width: 100%;
  height: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Name = styled.span`
  max-width: ${SENDER_INFO_MAX_WIDTH};
  border-radius: 4px;
  cursor: pointer;
  padding: 0px 4px;
  margin: 0px -4px;
  :hover {
    background: var(--bg-overlay-tertiary);
  }
`;

const NameSilence = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
`;

const Buttons = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 2px;
  background: var(--bg-l3-solid);
  border: 1px solid var(--border-secondary);
  box-shadow: var(--shadow-l3);
  border-radius: 6px;
`;

interface SenderDetailsProps {
  email: MailboxEmailInfo;
  showContacts: boolean;
  expanded: boolean;
  moreButtonRef: RefObject<HTMLDivElement>;
  setShowMoreOptions: (showMoreOptions: boolean) => void;
  reply: (evt?: React.MouseEvent) => void;
  renderActions?: boolean;
}

export const SenderDetails: React.FC<SenderDetailsProps> = ({
  email,
  showContacts,
  expanded,
  moreButtonRef,
  setShowMoreOptions,
  reply,
  renderActions
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { from, createdAt, scheduleSendAt, id: messageID, notificationsTurnedOffForSender } = email;
  // All mail should have a scheduleSendAt value since even regular sends are scheduled for 5 seconds after creation
  // Fallback includes for type safety
  const displayedDate = scheduleSendAt ?? createdAt;

  const { address: fromAddress, name: fromDisplayName } = email.from;
  const [showFromContactDropdown, setShowFromContactDropdown] = useState<boolean>(false);

  const fromContactRef = useRef<HTMLDivElement>(null);
  const { getMonthAndDay, getTime } = useDate();

  const { alias: fromAlias } = splitEmailToAliasAndDomain(fromAddress);
  const isWalletEmail = isWalletAddress(fromAlias);
  const { displayPictureData, unverified } = useDisplayPictureWithDefaultFallback(fromAddress, messageID);

  const contactDisplayName = useDisplayNameFromAddress(fromAddress);
  // redux actions
  const dispatch = useDispatch();
  const setCurrentEmail = (currEmail: MailboxEmailInfo) =>
    dispatch(skemailMobileDrawerReducer.actions.setCurrentEmail(currEmail));
  const openShowMoreOptionsDrawer = () =>
    dispatch(skemailMobileDrawerReducer.actions.setShowMoreThreadOptionsDrawer({ open: true, emailSpecific: true }));

  const renderDateAndActionsButton = () => (
    <ThreadActionButtonContainer>
      {!isMobile && (
        <Typography color='disabled' minWidth='fit-content' size={TypographySize.SMALL}>
          {`${getMonthAndDay(displayedDate)}, ${getTime(displayedDate)}`}
        </Typography>
      )}
      {expanded && renderActions && (
        <Buttons>
          <IconText color='secondary' dataTest='mobile-reply' onClick={reply} startIcon={Icon.Reply} />
          <IconText
            color='secondary'
            onClick={(e) => {
              e?.stopPropagation();
              if (isMobile) {
                // set the email in the more options drawer to the current email
                setCurrentEmail(email);
                // open drawer
                openShowMoreOptionsDrawer();
              } else {
                // open dropdown
                setShowMoreOptions(true);
              }
            }}
            ref={moreButtonRef}
            startIcon={Icon.OverflowH}
          />
        </Buttons>
      )}
    </ThreadActionButtonContainer>
  );

  // render the address as the display name if the user has not specified a display name
  const { displayName, formattedDisplayName } = getAddrDisplayName(email.from);
  const { alias, domain } = splitEmailToAliasAndDomain(fromAddress);

  const renderNameAndDate = () => {
    return (
      <NameAndDate>
        <NameSilence>
          <Name onClick={() => setShowFromContactDropdown((prev) => !prev)} ref={fromContactRef}>
            <SenderDisplayName
              color={showContacts ? 'link' : 'primary'}
              isSilenced={email.from.blocked || undefined}
              isVerified={VERIFIED_SKIFF_EMAILS.includes(fromAddress)}
              notificationsMuted={notificationsTurnedOffForSender}
              weight={TypographyWeight.MEDIUM}
            >
              {isENSName(alias) ? alias : contactDisplayName || formattedDisplayName}
            </SenderDisplayName>
          </Name>
          <ContactActionDropdown
            address={from}
            buttonRef={fromContactRef}
            notificationsMuted={notificationsTurnedOffForSender}
            setShowActionDropdown={setShowFromContactDropdown}
            show={showFromContactDropdown}
          />
        </NameSilence>
        {renderDateAndActionsButton()}
      </NameAndDate>
    );
  };

  const renderAddress = () => {
    if (fromDisplayName) {
      return (
        <Email>
          <Typography color='secondary' inline size={isMobile ? TypographySize.SMALL : undefined}>
            &lt;{isWalletEmail ? createAbbreviatedWalletEmail(alias, domain) : fromAddress}&gt;
          </Typography>
        </Email>
      );
    }
  };

  const { alias: displayNameAlias } = splitEmailToAliasAndDomain(displayName);

  return (
    <SenderBlock>
      <AvatarBlock>
        <UserAvatar
          displayPictureData={{
            profileCustomURI: displayPictureData.profileCustomURI,
            profileAccentColor: displayPictureData.profileAccentColor,
            profileIcon: displayPictureData.profileIcon
          }}
          label={contactDisplayName || displayNameAlias}
          size={Size.LARGE}
          unverified={unverified}
        />
      </AvatarBlock>
      <FromAndDateContainer>
        {renderNameAndDate()}
        {renderAddress()}
      </FromAndDateContainer>
    </SenderBlock>
  );
};
