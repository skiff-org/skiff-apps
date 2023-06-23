import { Icon, IconText, Size, Typography, TypographySize, TypographyWeight } from '@skiff-org/skiff-ui';
import React, { RefObject, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  UserAvatar,
  createAbbreviatedWalletEmail,
  getAddrDisplayName,
  splitEmailToAliasAndDomain
} from 'skiff-front-utils';
import { isENSName, isWalletAddress } from 'skiff-utils';
import styled from 'styled-components';

import { useDate } from '../../../hooks/useDate';
import { useDisplayPictureDataFromAddress } from '../../../hooks/useDisplayPictureDataFromAddress';
import { MailboxEmailInfo } from '../../../models/email';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';

import { useDisplayNameFromAddress } from '../../../hooks/useDisplayNameFromAddress';
import ContactActionDropdown from './ContactActionDropdown';

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
  width: fit-content;
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
  height: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const Name = styled.span`
  max-width: 68%;
`;

const Buttons = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 2px;
  background: var(--bg-l3-solid);
  border: 1px solid var(--border-secondary);
  box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.02);
  border-radius: 6px;
`;

interface SenderDetailsProps {
  email: MailboxEmailInfo;
  showContacts: boolean;
  expanded: boolean;
  moreButtonRef: RefObject<HTMLDivElement>;
  setShowMoreOptions: (showMoreOptions: boolean) => void;
  reply: (evt?: React.MouseEvent) => void;
}

export const SenderDetails: React.FC<SenderDetailsProps> = ({
  email,
  showContacts,
  expanded,
  moreButtonRef,
  setShowMoreOptions,
  reply
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { from, createdAt, scheduleSendAt } = email;

  // All mail should have a scheduleSendAt value since even regular sends are scheduled for 5 seconds after creation
  // Fallback includes for type safety
  const displayedDate = scheduleSendAt ?? createdAt;

  const { address: fromAddress, name: fromDisplayName } = email.from;
  const [showFromContactDropdown, setShowFromContactDropdown] = useState<boolean>(false);

  const fromContactRef = useRef<HTMLDivElement>(null);
  const { getMonthAndDay, getTime } = useDate();

  const { alias: fromAlias } = splitEmailToAliasAndDomain(fromAddress);
  const isWalletEmail = isWalletAddress(fromAlias);
  const displayPictureData = useDisplayPictureDataFromAddress(fromAddress);
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
      {expanded && (
        <Buttons>
          <IconText dataTest='mobile-reply' iconColor='secondary' onClick={reply} startIcon={Icon.Reply} />
          <IconText
            iconColor='secondary'
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
        <Name ref={fromContactRef}>
          <Typography
            color={showContacts ? 'link' : 'primary'}
            inline
            onClick={showContacts ? () => setShowFromContactDropdown((prev) => !prev) : undefined}
            weight={TypographyWeight.MEDIUM}
          >
            {isENSName(alias) ? alias : contactDisplayName || formattedDisplayName}
          </Typography>
        </Name>
        <ContactActionDropdown
          address={from}
          buttonRef={fromContactRef}
          setShowActionDropdown={setShowFromContactDropdown}
          show={showFromContactDropdown}
        />
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
          displayPictureData={displayPictureData}
          label={contactDisplayName || displayNameAlias}
          size={Size.LARGE}
        />
      </AvatarBlock>
      <FromAndDateContainer>
        {renderNameAndDate()}
        {renderAddress()}
      </FromAndDateContainer>
    </SenderBlock>
  );
};
